package com.codeshare.websocket;

import com.codeshare.infrastructure.security.JwtService;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

public class WebSocketAuthInterceptor implements HandshakeInterceptor {
  private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

  private final JwtService jwtService;

  public WebSocketAuthInterceptor(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes) {
    logger.info("WebSocket handshake for: {}", request.getURI());

    // Try to get token from cookies first
    List<String> cookieHeaders = request.getHeaders().get("Cookie");
    if (cookieHeaders != null) {
      for (String cookieHeader : cookieHeaders) {
        String[] cookies = cookieHeader.split(";");
        for (String cookie : cookies) {
          String[] parts = cookie.trim().split("=");
          if (parts.length == 2 && parts[0].equals("token")) {
            String token = parts[1];
            logger.info("Found JWT token in cookie for WebSocket handshake");
            return jwtService.isTokenValid(token);
          }
        }
      }
    }

    // Fallback: try to get token from query parameter (for backward compatibility)
    String query = request.getURI().getQuery();
    if (query != null && query.contains("token=")) {
      String jwt = query.split("token=")[1].split("&")[0];
      logger.info("Found JWT token in query parameter for WebSocket handshake");
      return jwtService.isTokenValid(jwt);
    }

    logger.warn("No JWT token found in WebSocket handshake");
    return false;
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
