package com.codeshare.kafka;

import com.codeshare.domain.editor.model.EditorMessage;
import com.codeshare.websocket.EditorRoomHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class EditorEventConsumer {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final EditorRoomHandler editorRoomHandler;

  public EditorEventConsumer(EditorRoomHandler editorRoomHandler) {
    this.editorRoomHandler = editorRoomHandler;
  }

  @KafkaListener(topics = "editor-events", groupId = "codeshare-group")
  public void consume(String message) {
    try {
      EditorMessage msg = objectMapper.readValue(message, EditorMessage.class);
      editorRoomHandler.broadcastToRoom(msg.roomId(), message);
    } catch (Exception ignored) {
    }
  }
}
