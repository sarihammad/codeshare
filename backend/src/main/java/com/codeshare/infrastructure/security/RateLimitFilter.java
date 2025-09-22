package com.codeshare.infrastructure.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {
  private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

  // Rate limit buckets per IP address
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
  private final MeterRegistry meterRegistry;
  private final Counter rateLimitExceededCounter;
  private final Counter rateLimitAllowedCounter;

  // Trust proxy configuration
  @Value("${security.rate-limit.trust-proxy:false}")
  private boolean trustProxy;

  public RateLimitFilter(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
    this.rateLimitExceededCounter =
        Counter.builder("rate_limit_exceeded")
            .description("Number of requests that exceeded rate limits")
            .tag("type", "exceeded")
            .register(meterRegistry);
    this.rateLimitAllowedCounter =
        Counter.builder("rate_limit_allowed")
            .description("Number of requests that passed rate limits")
            .tag("type", "allowed")
            .register(meterRegistry);
  }

  // Rate limits for different endpoints
  private static final Bandwidth AUTH_LIMIT =
      Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
  private static final Bandwidth WS_HANDSHAKE_LIMIT =
      Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));
  private static final Bandwidth ROOM_MUTATION_LIMIT =
      Bandwidth.classic(60, Refill.intervally(60, Duration.ofMinutes(1)));
  private static final Bandwidth SNAPSHOT_LIMIT =
      Bandwidth.classic(20, Refill.intervally(20, Duration.ofMinutes(1)));
  private static final Bandwidth GENERAL_LIMIT =
      Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String clientIp = getClientIpAddress(request);
    String requestPath = request.getRequestURI();
    String method = request.getMethod();

    // Determine rate limit based on endpoint
    Bandwidth limit = getRateLimit(requestPath, method);
    String bucketKey = clientIp + ":" + requestPath;
    Bucket bucket = getBucket(bucketKey, limit);

    if (bucket.tryConsume(1)) {
      rateLimitAllowedCounter.increment();
      filterChain.doFilter(request, response);
    } else {
      rateLimitExceededCounter.increment();
      logger.warn(
          "Rate limit exceeded for IP: {} on path: {} method: {}", clientIp, requestPath, method);
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setContentType("application/json");
      response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
    }
  }

  private Bucket getBucket(String bucketKey, Bandwidth limit) {
    return buckets.computeIfAbsent(bucketKey, k -> Bucket4j.builder().addLimit(limit).build());
  }

  private Bandwidth getRateLimit(String requestPath, String method) {
    // WebSocket handshake rate limiting
    if (requestPath.startsWith("/ws/")) {
      return WS_HANDSHAKE_LIMIT;
    }

    // Authentication endpoints - strictest limits
    if (requestPath.startsWith("/api/auth/")) {
      return AUTH_LIMIT;
    }

    // Snapshot endpoints
    if (requestPath.contains("/snapshot") && "POST".equals(method)) {
      return SNAPSHOT_LIMIT;
    }

    // Room mutation endpoints
    if (requestPath.startsWith("/api/rooms/")
        && ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method))) {
      return ROOM_MUTATION_LIMIT;
    }

    return GENERAL_LIMIT;
  }

  private String getClientIpAddress(HttpServletRequest request) {
    // Only trust proxy headers if configured to do so
    if (trustProxy) {
      String xForwardedFor = request.getHeader("X-Forwarded-For");
      if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
        // Take the first IP in the chain (original client)
        return xForwardedFor.split(",")[0].trim();
      }

      String xRealIp = request.getHeader("X-Real-IP");
      if (xRealIp != null && !xRealIp.isEmpty()) {
        return xRealIp;
      }
    }

    return request.getRemoteAddr();
  }
}
