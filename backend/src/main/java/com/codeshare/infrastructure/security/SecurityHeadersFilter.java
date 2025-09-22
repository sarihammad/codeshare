package com.codeshare.infrastructure.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class SecurityHeadersFilter implements Filter {
  private static final Logger logger = LoggerFactory.getLogger(SecurityHeadersFilter.class);

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {

    HttpServletRequest httpRequest = (HttpServletRequest) request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;

    // Add request ID for tracing
    String requestId = UUID.randomUUID().toString();
    httpRequest.setAttribute("requestId", requestId);
    httpResponse.setHeader("X-Request-ID", requestId);

    // Security headers
    httpResponse.setHeader("X-Content-Type-Options", "nosniff");
    httpResponse.setHeader("X-Frame-Options", "DENY");
    httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
    httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content Security Policy (nonce-based for inline scripts)
    String nonce = generateNonce();
    httpRequest.setAttribute("cspNonce", nonce);
    String csp =
        String.format(
            "default-src 'self'; "
                + "script-src 'self' 'nonce-%s' 'unsafe-inline'; "
                + "style-src 'self' 'unsafe-inline'; "
                + "img-src 'self' data: https:; "
                + "font-src 'self' data:; "
                + "connect-src 'self' ws: wss:; "
                + "frame-ancestors 'none'; "
                + "base-uri 'self'; "
                + "form-action 'self'",
            nonce);
    httpResponse.setHeader("Content-Security-Policy", csp);

    // Permissions Policy (minimal permissions)
    httpResponse.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()");

    // Strict Transport Security (only for HTTPS)
    if (httpRequest.isSecure()) {
      httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    chain.doFilter(request, response);
  }

  private String generateNonce() {
    return UUID.randomUUID().toString().replace("-", "");
  }
}
