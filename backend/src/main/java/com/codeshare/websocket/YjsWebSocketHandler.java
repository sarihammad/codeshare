package com.codeshare.websocket;

import com.codeshare.infrastructure.redis.YjsRedisService;
import jakarta.annotation.PreDestroy;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class YjsWebSocketHandler extends TextWebSocketHandler
    implements YjsRedisService.YjsMessageHandler {
  private static final Logger logger = LoggerFactory.getLogger(YjsWebSocketHandler.class);

  private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
  private final YjsRedisService yjsRedisService;
  private final MetricsService metricsService;

  public YjsWebSocketHandler(YjsRedisService yjsRedisService, MetricsService metricsService) {
    this.yjsRedisService = yjsRedisService;
    this.metricsService = metricsService;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    logger.info("Yjs WebSocket connection established: {}", session.getUri());

    String roomId = extractRoomId(session);
    if (roomId != null) {
      logger.info("Adding session to room: {}", roomId);
      roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);

      // Register this handler for Redis pub/sub if this is the first session in the room
      if (roomSessions.get(roomId).size() == 1) {
        yjsRedisService.registerRoomHandler(roomId, this);
      }

      // Record metrics
      metricsService.recordWebSocketConnection(roomId);

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

      // Get user ID from session attributes (set during WebSocket handshake)
      String userId = (String) session.getAttributes().get("userId");

      // Record metrics
      metricsService.recordMessageReceived(roomId);

      // Publish to Redis for cross-instance communication
      yjsRedisService.publishDocumentUpdate(
          roomId, userId != null ? userId : "anonymous", message.getPayload());

      // Broadcast the message to all other sessions in the room (local instance)
      roomSessions.get(roomId).stream()
          .filter(s -> s != session && s.isOpen())
          .forEach(
              s -> {
                try {
                  s.sendMessage(message);
                  metricsService.recordMessageSent(roomId);
                } catch (Exception e) {
                  logger.error("Failed to send message to session: {}", e.getMessage());
                }
              });
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    logger.info("Yjs WebSocket connection closed: {}", session.getUri());

    String roomId = extractRoomId(session);
    if (roomId != null) {
      roomSessions.get(roomId).remove(session);

      // Record metrics
      metricsService.recordWebSocketDisconnection(roomId);

      // Unregister Redis handler if no more sessions in this room
      if (roomSessions.get(roomId).isEmpty()) {
        yjsRedisService.unregisterRoomHandler(roomId);
        roomSessions.remove(roomId);
      }
    } else {
      // Fallback: remove from all rooms
      roomSessions.values().forEach(sessions -> sessions.remove(session));
      roomSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
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

  @Override
  public void handleMessage(String roomId, YjsRedisService.YjsMessage message) {
    // Handle messages from Redis (from other instances)
    if (roomSessions.containsKey(roomId)) {
      logger.debug("Handling Redis message for room {}: {}", roomId, message.getType());

      TextMessage textMessage = new TextMessage(message.getContent());

      // Broadcast to all local sessions in the room
      roomSessions.get(roomId).stream()
          .filter(WebSocketSession::isOpen)
          .forEach(
              session -> {
                try {
                  session.sendMessage(textMessage);
                } catch (Exception e) {
                  logger.error("Failed to send Redis message to session: {}", e.getMessage());
                }
              });
    }
  }

  @PreDestroy
  public void cleanup() {
    // Close all WebSocket sessions gracefully
    roomSessions
        .values()
        .forEach(
            sessions ->
                sessions.forEach(
                    session -> {
                      try {
                        if (session.isOpen()) {
                          session.close(CloseStatus.SERVER_ERROR);
                        }
                      } catch (Exception e) {
                        logger.warn("Error closing WebSocket session: {}", e.getMessage());
                      }
                    }));
    roomSessions.clear();
    logger.info("YjsWebSocketHandler cleanup completed");
  }
}
