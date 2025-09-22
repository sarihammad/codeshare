package com.codeshare.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.codeshare.infrastructure.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class WebSocketIntegrationTest {

  @LocalServerPort private int port;

  @Autowired private JwtService jwtService;

  @Autowired private ObjectMapper objectMapper;

  private StandardWebSocketClient webSocketClient;
  private String baseUrl;

  @BeforeEach
  void setUp() {
    webSocketClient = new StandardWebSocketClient();
    baseUrl = "ws://localhost:" + port;
  }

  @Test
  void testWebSocketHandshakeWithValidToken() throws Exception {
    // Given
    String roomId = "test-room-" + System.currentTimeMillis();
    String token = jwtService.generateToken("test-user", "test@example.com");
    String wsUrl = baseUrl + "/ws/yjs/" + roomId + "?token=" + token;

    CountDownLatch connectionLatch = new CountDownLatch(1);
    List<String> receivedMessages = new ArrayList<>();

    // When
    WebSocketSession session =
        webSocketClient
            .doHandshake(
                new org.springframework.web.socket.WebSocketHandler() {
                  @Override
                  public void afterConnectionEstablished(WebSocketSession session) {
                    connectionLatch.countDown();
                  }

                  @Override
                  public void handleMessage(WebSocketSession session, TextMessage message) {
                    receivedMessages.add(message.getPayload());
                  }

                  @Override
                  public void handleTransportError(WebSocketSession session, Throwable exception) {
                    // Handle errors
                  }

                  @Override
                  public void afterConnectionClosed(
                      WebSocketSession session, CloseStatus closeStatus) {
                    // Handle connection close
                  }
                },
                null,
                new URI(wsUrl))
            .get(5, TimeUnit.SECONDS);

    // Then
    assertThat(connectionLatch.await(5, TimeUnit.SECONDS)).isTrue();
    assertThat(session.isOpen()).isTrue();
    assertThat(session.getUri().getPath()).contains(roomId);

    session.close();
  }

  @Test
  void testWebSocketHandshakeWithInvalidToken() throws Exception {
    // Given
    String roomId = "test-room-" + System.currentTimeMillis();
    String invalidToken = "invalid-token";
    String wsUrl = baseUrl + "/ws/yjs/" + roomId + "?token=" + invalidToken;

    CountDownLatch errorLatch = new CountDownLatch(1);

    // When
    try {
      webSocketClient
          .doHandshake(
              new org.springframework.web.socket.WebSocketHandler() {
                @Override
                public void afterConnectionEstablished(WebSocketSession session) {
                  // Should not be called
                }

                @Override
                public void handleMessage(WebSocketSession session, TextMessage message) {
                  // Should not be called
                }

                @Override
                public void handleTransportError(WebSocketSession session, Throwable exception) {
                  errorLatch.countDown();
                }

                @Override
                public void afterConnectionClosed(
                    WebSocketSession session, CloseStatus closeStatus) {
                  // Handle connection close
                }
              },
              null,
              new URI(wsUrl))
          .get(5, TimeUnit.SECONDS);
    } catch (Exception e) {
      // Expected to fail
    }

    // Then
    assertThat(errorLatch.await(5, TimeUnit.SECONDS)).isTrue();
  }

  @Test
  void testWebSocketMessageBroadcasting() throws Exception {
    // Given
    String roomId = "test-room-" + System.currentTimeMillis();
    String token1 = jwtService.generateToken("user1", "user1@example.com");
    String token2 = jwtService.generateToken("user2", "user2@example.com");

    String wsUrl1 = baseUrl + "/ws/yjs/" + roomId + "?token=" + token1;
    String wsUrl2 = baseUrl + "/ws/yjs/" + roomId + "?token=" + token2;

    CountDownLatch connectionLatch1 = new CountDownLatch(1);
    CountDownLatch connectionLatch2 = new CountDownLatch(1);
    CountDownLatch messageLatch = new CountDownLatch(1);

    List<String> receivedMessages1 = new ArrayList<>();
    List<String> receivedMessages2 = new ArrayList<>();

    // When - Connect first client
    WebSocketSession session1 =
        webSocketClient
            .doHandshake(
                new org.springframework.web.socket.WebSocketHandler() {
                  @Override
                  public void afterConnectionEstablished(WebSocketSession session) {
                    connectionLatch1.countDown();
                  }

                  @Override
                  public void handleMessage(WebSocketSession session, TextMessage message) {
                    receivedMessages1.add(message.getPayload());
                    messageLatch.countDown();
                  }

                  @Override
                  public void handleTransportError(WebSocketSession session, Throwable exception) {
                    // Handle errors
                  }

                  @Override
                  public void afterConnectionClosed(
                      WebSocketSession session, CloseStatus closeStatus) {
                    // Handle connection close
                  }
                },
                null,
                new URI(wsUrl1))
            .get(5, TimeUnit.SECONDS);

    // Connect second client
    WebSocketSession session2 =
        webSocketClient
            .doHandshake(
                new org.springframework.web.socket.WebSocketHandler() {
                  @Override
                  public void afterConnectionEstablished(WebSocketSession session) {
                    connectionLatch2.countDown();
                  }

                  @Override
                  public void handleMessage(WebSocketSession session, TextMessage message) {
                    receivedMessages2.add(message.getPayload());
                  }

                  @Override
                  public void handleTransportError(WebSocketSession session, Throwable exception) {
                    // Handle errors
                  }

                  @Override
                  public void afterConnectionClosed(
                      WebSocketSession session, CloseStatus closeStatus) {
                    // Handle connection close
                  }
                },
                null,
                new URI(wsUrl2))
            .get(5, TimeUnit.SECONDS);

    // Wait for both connections
    assertThat(connectionLatch1.await(5, TimeUnit.SECONDS)).isTrue();
    assertThat(connectionLatch2.await(5, TimeUnit.SECONDS)).isTrue();

    // Send message from first client
    String testMessage = "Hello from user1!";
    session1.sendMessage(new TextMessage(testMessage));

    // Then
    assertThat(messageLatch.await(5, TimeUnit.SECONDS)).isTrue();
    assertThat(receivedMessages1).isEmpty(); // Should not receive own message
    assertThat(receivedMessages2).hasSize(1);
    assertThat(receivedMessages2.get(0)).isEqualTo(testMessage);

    session1.close();
    session2.close();
  }

  @Test
  void testWebSocketConvergenceWithMultipleMessages() throws Exception {
    // Given
    String roomId = "test-room-" + System.currentTimeMillis();
    String token1 = jwtService.generateToken("user1", "user1@example.com");
    String token2 = jwtService.generateToken("user2", "user2@example.com");

    String wsUrl1 = baseUrl + "/ws/yjs/" + roomId + "?token=" + token1;
    String wsUrl2 = baseUrl + "/ws/yjs/" + roomId + "?token=" + token2;

    CountDownLatch connectionLatch = new CountDownLatch(2);
    CountDownLatch messageLatch = new CountDownLatch(4); // 2 messages from each client

    List<String> receivedMessages1 = new ArrayList<>();
    List<String> receivedMessages2 = new ArrayList<>();

    // When - Connect both clients
    WebSocketSession session1 =
        webSocketClient
            .doHandshake(
                new org.springframework.web.socket.WebSocketHandler() {
                  @Override
                  public void afterConnectionEstablished(WebSocketSession session) {
                    connectionLatch.countDown();
                  }

                  @Override
                  public void handleMessage(WebSocketSession session, TextMessage message) {
                    receivedMessages1.add(message.getPayload());
                    messageLatch.countDown();
                  }

                  @Override
                  public void handleTransportError(WebSocketSession session, Throwable exception) {
                    // Handle errors
                  }

                  @Override
                  public void afterConnectionClosed(
                      WebSocketSession session, CloseStatus closeStatus) {
                    // Handle connection close
                  }
                },
                null,
                new URI(wsUrl1))
            .get(5, TimeUnit.SECONDS);

    WebSocketSession session2 =
        webSocketClient
            .doHandshake(
                new org.springframework.web.socket.WebSocketHandler() {
                  @Override
                  public void afterConnectionEstablished(WebSocketSession session) {
                    connectionLatch.countDown();
                  }

                  @Override
                  public void handleMessage(WebSocketSession session, TextMessage message) {
                    receivedMessages2.add(message.getPayload());
                    messageLatch.countDown();
                  }

                  @Override
                  public void handleTransportError(WebSocketSession session, Throwable exception) {
                    // Handle errors
                  }

                  @Override
                  public void afterConnectionClosed(
                      WebSocketSession session, CloseStatus closeStatus) {
                    // Handle connection close
                  }
                },
                null,
                new URI(wsUrl2))
            .get(5, TimeUnit.SECONDS);

    // Wait for both connections
    assertThat(connectionLatch.await(5, TimeUnit.SECONDS)).isTrue();

    // Send messages from both clients
    session1.sendMessage(new TextMessage("Message 1 from user1"));
    session2.sendMessage(new TextMessage("Message 1 from user2"));
    session1.sendMessage(new TextMessage("Message 2 from user1"));
    session2.sendMessage(new TextMessage("Message 2 from user2"));

    // Then
    assertThat(messageLatch.await(10, TimeUnit.SECONDS)).isTrue();
    assertThat(receivedMessages1).hasSize(2); // Should receive messages from user2
    assertThat(receivedMessages2).hasSize(2); // Should receive messages from user1

    // Verify message content
    assertThat(receivedMessages1).contains("Message 1 from user2", "Message 2 from user2");
    assertThat(receivedMessages2).contains("Message 1 from user1", "Message 2 from user1");

    session1.close();
    session2.close();
  }

  @Test
  void testWebSocketConnectionCleanup() throws Exception {
    // Given
    String roomId = "test-room-" + System.currentTimeMillis();
    String token = jwtService.generateToken("test-user", "test@example.com");
    String wsUrl = baseUrl + "/ws/yjs/" + roomId + "?token=" + token;

    CountDownLatch connectionLatch = new CountDownLatch(1);
    CountDownLatch closeLatch = new CountDownLatch(1);

    // When
    WebSocketSession session =
        webSocketClient
            .doHandshake(
                new org.springframework.web.socket.WebSocketHandler() {
                  @Override
                  public void afterConnectionEstablished(WebSocketSession session) {
                    connectionLatch.countDown();
                  }

                  @Override
                  public void handleMessage(WebSocketSession session, TextMessage message) {
                    // Handle messages
                  }

                  @Override
                  public void handleTransportError(WebSocketSession session, Throwable exception) {
                    // Handle errors
                  }

                  @Override
                  public void afterConnectionClosed(
                      WebSocketSession session, CloseStatus closeStatus) {
                    closeLatch.countDown();
                  }
                },
                null,
                new URI(wsUrl))
            .get(5, TimeUnit.SECONDS);

    // Wait for connection
    assertThat(connectionLatch.await(5, TimeUnit.SECONDS)).isTrue();
    assertThat(session.isOpen()).isTrue();

    // Close connection
    session.close();

    // Then
    assertThat(closeLatch.await(5, TimeUnit.SECONDS)).isTrue();
    assertThat(session.isOpen()).isFalse();
  }

  @Test
  void testWebSocketRateLimiting() throws Exception {
    // Given
    String roomId = "test-room-" + System.currentTimeMillis();
    String token = jwtService.generateToken("test-user", "test@example.com");
    String wsUrl = baseUrl + "/ws/yjs/" + roomId + "?token=" + token;

    CountDownLatch errorLatch = new CountDownLatch(1);
    List<Exception> errors = new ArrayList<>();

    // When - Try to connect multiple times rapidly (should trigger rate limiting)
    for (int i = 0; i < 10; i++) {
      try {
        webSocketClient
            .doHandshake(
                new org.springframework.web.socket.WebSocketHandler() {
                  @Override
                  public void afterConnectionEstablished(WebSocketSession session) {
                    // Should not be called for rate-limited connections
                  }

                  @Override
                  public void handleMessage(WebSocketSession session, TextMessage message) {
                    // Should not be called
                  }

                  @Override
                  public void handleTransportError(WebSocketSession session, Throwable exception) {
                    errors.add((Exception) exception);
                    errorLatch.countDown();
                  }

                  @Override
                  public void afterConnectionClosed(
                      WebSocketSession session, CloseStatus closeStatus) {
                    // Handle connection close
                  }
                },
                null,
                new URI(wsUrl))
            .get(1, TimeUnit.SECONDS);
      } catch (Exception e) {
        errors.add(e);
      }
    }

    // Then - At least some connections should be rate limited
    await().atMost(Duration.ofSeconds(10)).until(() -> errors.size() > 0);
    assertThat(errors).isNotEmpty();
  }
}
