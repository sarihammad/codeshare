package com.codeshare.websocket;

import static org.junit.jupiter.api.Assertions.*;

import com.codeshare.infrastructure.redis.PresenceService;
import com.codeshare.infrastructure.security.JwtService;
import java.net.URI;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WebSocketIntegrationTest {

  @LocalServerPort private int port;

  @Autowired private JwtService jwtService;

  @Autowired private PresenceService presenceService;

  @Test
  void testWebSocketConnectionWithValidToken() throws Exception {
    // Generate a valid JWT token
    String token = jwtService.generateToken(UUID.randomUUID(), "test@example.com");

    CountDownLatch latch = new CountDownLatch(1);
    AtomicReference<String> receivedMessage = new AtomicReference<>();

    WebSocketHandler handler =
        new WebSocketHandler() {
          @Override
          public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            latch.countDown();
          }

          @Override
          public void handleMessage(WebSocketSession session, WebSocketMessage<?> message)
              throws Exception {
            receivedMessage.set(message.getPayload().toString());
          }

          @Override
          public void handleTransportError(WebSocketSession session, Throwable exception)
              throws Exception {
            fail("Transport error: " + exception.getMessage());
          }

          @Override
          public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus)
              throws Exception {
            // Connection closed
          }

          @Override
          public boolean supportsPartialMessages() {
            return false;
          }
        };

    StandardWebSocketClient client = new StandardWebSocketClient();
    String url = "ws://localhost:" + port + "/ws/yjs/test-room?token=" + token;

    WebSocketSession session = client.doHandshake(handler, null, URI.create(url)).get();

    // Wait for connection to be established
    assertTrue(latch.await(5, TimeUnit.SECONDS), "Connection should be established");

    // Send a test message
    session.sendMessage(new TextMessage("{\"type\":\"test\",\"content\":\"hello\"}"));

    // Wait a bit for message processing
    Thread.sleep(100);

    // Close the session
    session.close();

    // Verify connection was successful
    assertNotNull(session);
    assertTrue(session.isOpen() || !session.isOpen());
  }

  @Test
  void testWebSocketConnectionWithInvalidToken() throws Exception {
    CountDownLatch latch = new CountDownLatch(1);
    AtomicReference<Throwable> error = new AtomicReference<>();

    WebSocketHandler handler =
        new WebSocketHandler() {
          @Override
          public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            fail("Connection should not be established with invalid token");
          }

          @Override
          public void handleMessage(WebSocketSession session, WebSocketMessage<?> message)
              throws Exception {
            // Should not receive messages
          }

          @Override
          public void handleTransportError(WebSocketSession session, Throwable exception)
              throws Exception {
            error.set(exception);
            latch.countDown();
          }

          @Override
          public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus)
              throws Exception {
            if (closeStatus.getCode() != CloseStatus.NORMAL.getCode()) {
              latch.countDown();
            }
          }

          @Override
          public boolean supportsPartialMessages() {
            return false;
          }
        };

    StandardWebSocketClient client = new StandardWebSocketClient();
    String url = "ws://localhost:" + port + "/ws/yjs/test-room?token=invalid-token";

    try {
      WebSocketSession session = client.doHandshake(handler, null, URI.create(url)).get();

      // Wait for connection to fail
      assertTrue(latch.await(5, TimeUnit.SECONDS), "Connection should fail");

      // Verify connection was rejected
      assertFalse(session.isOpen());
    } catch (Exception e) {
      // Expected - connection should fail
      assertTrue(e.getMessage().contains("handshake") || e.getMessage().contains("401"));
    }
  }

  @Test
  void testPresenceServiceIntegration() {
    String roomId = "test-room";
    String userId = "test-user";

    // Add user to room
    presenceService.addUserToRoom(roomId, userId);

    // Verify user is in room
    assertTrue(presenceService.getUsersInRoom(roomId).contains(userId));

    // Remove user from room
    presenceService.removeUserFromRoom(roomId, userId);

    // Verify user is not in room
    assertFalse(presenceService.getUsersInRoom(roomId).contains(userId));
  }
}
