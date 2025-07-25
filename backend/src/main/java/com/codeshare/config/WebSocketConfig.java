package com.codeshare.config;

import com.codeshare.infrastructure.redis.PresenceService;
import com.codeshare.infrastructure.security.JwtService;
import com.codeshare.websocket.EditorRoomHandler;
import com.codeshare.websocket.WebSocketAuthInterceptor;
import com.codeshare.websocket.YjsWebSocketHandler;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final EditorRoomHandler editorRoomHandler;
    private final YjsWebSocketHandler yjsWebSocketHandler;
    private final JwtService jwtService;
    private final PresenceService presenceService;

    public WebSocketConfig(EditorRoomHandler editorRoomHandler, YjsWebSocketHandler yjsWebSocketHandler, JwtService jwtService, PresenceService presenceService) {
        this.editorRoomHandler = editorRoomHandler;
        this.yjsWebSocketHandler = yjsWebSocketHandler;
        this.jwtService = jwtService;
        this.presenceService = presenceService;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(editorRoomHandler, "/ws/editor")
                .addInterceptors(new WebSocketAuthInterceptor(jwtService))
                .setAllowedOrigins("*");
        
        // Map Yjs WebSocket to handle roomId in the path
        registry.addHandler(yjsWebSocketHandler, "/ws/yjs/**")
                .setAllowedOrigins("*");
    }
}