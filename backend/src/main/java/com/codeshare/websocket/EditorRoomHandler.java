package com.codeshare.websocket;

import com.codeshare.domain.editor.model.EditorMessage;
import com.codeshare.kafka.EditorEventProducer;
import com.codeshare.infrastructure.metrics.MetricsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.codeshare.infrastructure.redis.PresenceService;
import com.codeshare.infrastructure.security.JwtService;

import java.util.*;

@Component
public class EditorRoomHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Set<WebSocketSession>> roomSessions = new HashMap<>();
    private final EditorEventProducer producer;
    private final PresenceService presenceService;
    private final JwtService jwtService;
    private final MetricsService metricsService;

    public EditorRoomHandler(EditorEventProducer producer, PresenceService presenceService, JwtService jwtService, MetricsService metricsService) {
        this.producer = producer;
        this.presenceService = presenceService;
        this.jwtService = jwtService;
        this.metricsService = metricsService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Timer.Sample sample = metricsService.startWebSocketConnectionTimer();
        String roomId = getQueryParam(session, "roomId");
        String userId = extractUserIdFromSession(session);
        roomSessions.computeIfAbsent(roomId, k -> new HashSet<>()).add(session);
        if (roomId != null && userId != null) {
            presenceService.addUserToRoom(roomId, userId);
            broadcastPresence(roomId);
        }
        metricsService.incrementWebSocketConnections();
        metricsService.recordWebSocketConnectionDuration(sample);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            EditorMessage editorMessage = objectMapper.readValue(message.getPayload(), EditorMessage.class);
            producer.send("editor-events", objectMapper.writeValueAsString(editorMessage));
        } catch (Exception ignored) {
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = getQueryParam(session, "roomId");
        String userId = extractUserIdFromSession(session);
        roomSessions.values().forEach(sessions -> sessions.remove(session));
        if (roomId != null && userId != null) {
            presenceService.removeUserFromRoom(roomId, userId);
            broadcastPresence(roomId);
        }
        metricsService.incrementWebSocketDisconnections();
    }

    public void broadcastToRoom(String roomId, String message) {
        if (!roomSessions.containsKey(roomId)) return;
        roomSessions.get(roomId).forEach(session -> {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (Exception ignored) {
            }
        });
    }

    private void broadcastPresence(String roomId) {
        Set<String> users = presenceService.getUsersInRoom(roomId);
        try {
            String message = objectMapper.writeValueAsString(Map.of("type", "presence", "users", users));
            broadcastToRoom(roomId, message);
        } catch (Exception ignored) {}
    }

    private String extractUserIdFromSession(WebSocketSession session) {
        // Try to extract JWT from query param or cookies
        String token = getQueryParam(session, "token");
        if (token == null && session.getHandshakeHeaders().containsKey("cookie")) {
            List<String> cookies = session.getHandshakeHeaders().get("cookie");
            for (String cookieHeader : cookies) {
                String[] cookiesArr = cookieHeader.split(";");
                for (String cookie : cookiesArr) {
                    String[] parts = cookie.trim().split("=");
                    if (parts.length == 2 && parts[0].equals("jwt")) {
                        token = parts[1];
                        break;
                    }
                }
            }
        }
        if (token != null) {
            try {
                return jwtService.extractClaim(token, "userId");
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String getQueryParam(WebSocketSession session, String param) {
        return Optional.ofNullable(session.getUri())
                .flatMap(uri -> Arrays.stream(uri.getQuery().split("&"))
                        .map(s -> s.split("="))
                        .filter(pair -> pair.length == 2 && pair[0].equals(param))
                        .map(pair -> pair[1])
                        .findFirst()
                ).orElse(null);
    }
}