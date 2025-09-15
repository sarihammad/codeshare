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

  // Rate limits for different endpoints
  private static final Bandwidth AUTH_LIMIT =
      Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
  private static final Bandwidth ROOM_MUTATION_LIMIT =
      Bandwidth.classic(60, Refill.intervally(60, Duration.ofMinutes(1)));
  private static final Bandwidth GENERAL_LIMIT =
      Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String clientIp = getClientIpAddress(request);
    String requestPath = request.getRequestURI();

    // Determine rate limit based on endpoint
    Bandwidth limit = getRateLimit(requestPath);
    Bucket bucket = getBucket(clientIp, limit);

    if (bucket.tryConsume(1)) {
      filterChain.doFilter(request, response);
    } else {
      logger.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, requestPath);
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setContentType("application/json");
      response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
    }
  }

  private Bucket getBucket(String clientIp, Bandwidth limit) {
    return buckets.computeIfAbsent(clientIp, k -> Bucket4j.builder().addLimit(limit).build());
  }

  private Bandwidth getRateLimit(String requestPath) {
    if (requestPath.startsWith("/api/auth/")) {
      return AUTH_LIMIT;
    }
    if (requestPath.startsWith("/api/rooms/")
        && (requestPath.contains("POST")
            || requestPath.contains("PUT")
            || requestPath.contains("DELETE"))) {
      return ROOM_MUTATION_LIMIT;
    }
    return GENERAL_LIMIT;
  }

  private String getClientIpAddress(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }

    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
      return xRealIp;
    }

    return request.getRemoteAddr();
  }
}
