package com.codeshare.websocket;

import com.codeshare.infrastructure.security.JwtService;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

public class WebSocketAuthInterceptor implements HandshakeInterceptor {
  private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

  private final JwtService jwtService;
  private final Set<String> allowedOrigins;

  public WebSocketAuthInterceptor(JwtService jwtService, Set<String> allowedOrigins) {
    this.jwtService = jwtService;
    this.allowedOrigins = allowedOrigins;
  }

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes) {
    logger.info("WebSocket handshake for: {}", request.getURI());

    // 1. Validate Origin against allowlist
    String origin = request.getHeaders().getFirst("Origin");
    if (origin != null && !allowedOrigins.contains(origin)) {
      logger.warn("WebSocket handshake rejected: invalid origin {}", origin);
      return false;
    }

    // 2. Try to get token from Sec-WebSocket-Protocol header first (preferred)
    List<String> protocols = request.getHeaders().get("Sec-WebSocket-Protocol");
    String token = null;
    if (protocols != null) {
      for (String protocol : protocols) {
        if (protocol.startsWith("jwt,")) {
          token = protocol.substring(4);
          logger.info("Found JWT token in Sec-WebSocket-Protocol header");
          break;
        }
      }
    }

    // 3. Fallback to httpOnly cookie if header missing
    if (token == null) {
      List<String> cookieHeaders = request.getHeaders().get("Cookie");
      if (cookieHeaders != null) {
        for (String cookieHeader : cookieHeaders) {
          String[] cookies = cookieHeader.split(";");
          for (String cookie : cookies) {
            String[] parts = cookie.trim().split("=");
            if (parts.length == 2 && parts[0].equals("token")) {
              token = parts[1];
              logger.info("Found JWT token in cookie for WebSocket handshake");
              break;
            }
          }
        }
      }
    }

    // 4. Reject if no token found
    if (token == null) {
      logger.warn("No JWT token found in WebSocket handshake");
      return false;
    }

    // 5. Verify JWT and attach userId to attributes
    if (!jwtService.isTokenValid(token)) {
      logger.warn("Invalid JWT token in WebSocket handshake");
      return false;
    }

    // Extract and attach user info to WebSocket attributes
    String email = jwtService.extractEmail(token);
    String userIdStr = jwtService.extractClaim(token, "userId");
    attributes.put("userId", userIdStr);
    attributes.put("email", email);

    logger.info("WebSocket handshake successful for user: {}", email);
    return true;
  }

  @Override
  public void afterHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Exception ex) {
    if (ex != null) {
      logger.error("WebSocket handshake failed: {}", ex.getMessage());
    } else {
      logger.info("WebSocket handshake successful for: {}", request.getURI());
    }
  }
}
