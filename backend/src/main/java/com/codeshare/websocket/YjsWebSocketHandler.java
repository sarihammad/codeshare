package com.codeshare.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class YjsWebSocketHandler extends TextWebSocketHandler {
    private static final Logger logger = LoggerFactory.getLogger(YjsWebSocketHandler.class);

    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        logger.info("Yjs WebSocket connection established: {}", session.getUri());
        
        String roomId = extractRoomId(session);
        if (roomId != null) {
            logger.info("Adding session to room: {}", roomId);
            roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
            logger.info("Total sessions in room {}: {}", roomId, roomSessions.get(roomId).size());
        } else {
            logger.warn("No roomId found in session: {}", session.getUri());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String roomId = extractRoomId(session);
        if (roomId != null && roomSessions.containsKey(roomId)) {
            logger.debug("Broadcasting message to room: {}", roomId);
            // Broadcast the message to all other sessions in the room
            roomSessions.get(roomId).stream()
                    .filter(s -> s != session && s.isOpen())
                    .forEach(s -> {
                        try {
                            s.sendMessage(message);
                        } catch (Exception e) {
                            logger.error("Failed to send message to session: {}", e.getMessage());
                        }
                    });
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        logger.info("Yjs WebSocket connection closed: {}", session.getUri());
        roomSessions.values().forEach(sessions -> sessions.remove(session));
        // Clean up empty rooms
        roomSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }

    private String extractRoomId(WebSocketSession session) {
        if (session.getUri() == null) {
            return null;
        }
        
        String path = session.getUri().getPath();
        logger.debug("Extracting roomId from path: {}", path);
        
        // Path format: /ws/yjs/{roomId}
        if (path.startsWith("/ws/yjs/")) {
            String roomId = path.substring("/ws/yjs/".length());
            if (!roomId.isEmpty()) {
                return roomId;
            }
        }
        
        // Fallback: try query parameter (for backward compatibility)
        if (session.getUri().getQuery() != null) {
            String query = session.getUri().getQuery();
            logger.debug("Trying query parameter: {}", query);
            
            return Arrays.stream(query.split("&"))
                    .map(s -> s.split("="))
                    .filter(pair -> pair.length == 2 && pair[0].equals("roomId"))
                    .map(pair -> pair[1])
                    .findFirst()
                    .orElse(null);
        }
        
        return null;
    }
} 