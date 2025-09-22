package com.codeshare.infrastructure.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Service;

@Service
public class YjsRedisService implements MessageListener {
  private static final Logger logger = LoggerFactory.getLogger(YjsRedisService.class);

  private final StringRedisTemplate redisTemplate;
  private final RedisMessageListenerContainer messageListenerContainer;
  private final ObjectMapper objectMapper;
  private final Map<String, YjsMessageHandler> roomHandlers = new ConcurrentHashMap<>();

  public YjsRedisService(
      StringRedisTemplate redisTemplate,
      RedisMessageListenerContainer messageListenerContainer,
      ObjectMapper objectMapper) {
    this.redisTemplate = redisTemplate;
    this.messageListenerContainer = messageListenerContainer;
    this.objectMapper = objectMapper;

    // Subscribe to all Yjs room channels
    messageListenerContainer.addMessageListener(this, new ChannelTopic("yjs:room:*"));
    logger.info("YjsRedisService initialized and subscribed to yjs:room:* channels");
  }

  public interface YjsMessageHandler {
    void handleMessage(String roomId, YjsMessage message);
  }

  public static class YjsMessage {
    private String type;
    private String content;
    private String userId;
    private long timestamp;

    public YjsMessage() {}

    public YjsMessage(String type, String content, String userId) {
      this.type = type;
      this.content = content;
      this.userId = userId;
      this.timestamp = System.currentTimeMillis();
    }

    // Getters and setters
    public String getType() {
      return type;
    }

    public void setType(String type) {
      this.type = type;
    }

    public String getContent() {
      return content;
    }

    public void setContent(String content) {
      this.content = content;
    }

    public String getUserId() {
      return userId;
    }

    public void setUserId(String userId) {
      this.userId = userId;
    }

    public long getTimestamp() {
      return timestamp;
    }

    public void setTimestamp(long timestamp) {
      this.timestamp = timestamp;
    }
  }

  public void registerRoomHandler(String roomId, YjsMessageHandler handler) {
    roomHandlers.put(roomId, handler);
    logger.debug("Registered handler for room: {}", roomId);
  }

  public void unregisterRoomHandler(String roomId) {
    roomHandlers.remove(roomId);
    logger.debug("Unregistered handler for room: {}", roomId);
  }

  public void publishMessage(String roomId, YjsMessage message) {
    try {
      String channel = "yjs:room:" + roomId;
      String messageJson = objectMapper.writeValueAsString(message);

      redisTemplate.convertAndSend(channel, messageJson);
      logger.debug("Published message to room {}: {}", roomId, message.getType());
    } catch (JsonProcessingException e) {
      logger.error("Failed to serialize Yjs message for room {}: {}", roomId, e.getMessage());
    }
  }

  public void publishAwarenessUpdate(String roomId, String userId, String awarenessData) {
    YjsMessage message = new YjsMessage("awareness", awarenessData, userId);
    publishMessage(roomId, message);
  }

  public void publishDocumentUpdate(String roomId, String userId, String documentData) {
    YjsMessage message = new YjsMessage("document", documentData, userId);
    publishMessage(roomId, message);
  }

  @Override
  public void onMessage(Message message, byte[] pattern) {
    try {
      String channel = new String(message.getChannel());
      String messageBody = new String(message.getBody());

      // Extract room ID from channel pattern: yjs:room:{roomId}
      String roomId = channel.substring("yjs:room:".length());

      YjsMessage yjsMessage = objectMapper.readValue(messageBody, YjsMessage.class);

      YjsMessageHandler handler = roomHandlers.get(roomId);
      if (handler != null) {
        handler.handleMessage(roomId, yjsMessage);
        logger.debug("Handled message for room {}: {}", roomId, yjsMessage.getType());
      } else {
        logger.debug("No handler registered for room: {}", roomId);
      }
    } catch (Exception e) {
      logger.error("Failed to process Redis message: {}", e.getMessage());
    }
  }

  public void cleanup() {
    roomHandlers.clear();
    logger.info("YjsRedisService cleanup completed");
  }
}
