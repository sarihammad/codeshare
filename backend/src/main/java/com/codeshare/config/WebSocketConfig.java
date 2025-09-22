package com.codeshare.config;

import com.codeshare.infrastructure.redis.PresenceService;
import com.codeshare.infrastructure.security.JwtService;
import com.codeshare.websocket.EditorRoomHandler;
import com.codeshare.websocket.WebSocketAuthInterceptor;
import com.codeshare.websocket.YjsWebSocketHandler;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

  private final EditorRoomHandler editorRoomHandler;
  private final YjsWebSocketHandler yjsWebSocketHandler;
  private final JwtService jwtService;
  private final PresenceService presenceService;
  private final Set<String> allowedOrigins;

  public WebSocketConfig(
      EditorRoomHandler editorRoomHandler,
      YjsWebSocketHandler yjsWebSocketHandler,
      JwtService jwtService,
      PresenceService presenceService,
      @Value("${security.cors.allowed-origins:http://localhost:3000,https://localhost:3000}")
          String allowedOriginsStr) {
    this.editorRoomHandler = editorRoomHandler;
    this.yjsWebSocketHandler = yjsWebSocketHandler;
    this.jwtService = jwtService;
    this.presenceService = presenceService;
    this.allowedOrigins = Set.of(allowedOriginsStr.split(","));
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    WebSocketAuthInterceptor authInterceptor =
        new WebSocketAuthInterceptor(jwtService, allowedOrigins);

    registry
        .addHandler(editorRoomHandler, "/ws/editor")
        .addInterceptors(authInterceptor)
        .setAllowedOrigins(allowedOrigins.toArray(new String[0]));

    // Map Yjs WebSocket to handle roomId in the path with authentication
    registry
        .addHandler(yjsWebSocketHandler, "/ws/yjs/**")
        .addInterceptors(authInterceptor)
        .setAllowedOrigins(allowedOrigins.toArray(new String[0]));
  }
}
