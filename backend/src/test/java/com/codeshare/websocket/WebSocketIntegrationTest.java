package com.codeshare.websocket;

import com.codeshare.infrastructure.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

import java.net.URI;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JwtService jwtService;

    @Test
    void testWebSocketConnection() throws Exception {
        // Create a test JWT token
        String token = jwtService.generateToken("test@example.com");
        
        // Test WebSocket connection with authentication
        CountDownLatch latch = new CountDownLatch(1);
        WebSocketHandler handler = new WebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) {
                latch.countDown();
            }

            @Override
            public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
                // Handle incoming messages
            }

            @Override
            public void handleTransportError(WebSocketSession session, Throwable exception) {
                fail("WebSocket transport error: " + exception.getMessage());
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
                // Connection closed
            }

            @Override
            public boolean supportsPartialMessages() {
                return false;
            }
        };

        // Connect to WebSocket with token in query parameter
        String wsUrl = "ws://localhost:" + port + "/ws/editor?token=" + token;
        WebSocketSession session = new StandardWebSocketClient()
                .doHandshake(handler, null, URI.create(wsUrl))
                .get(5, TimeUnit.SECONDS);

        // Wait for connection to be established
        assertTrue(latch.await(5, TimeUnit.SECONDS), "WebSocket connection should be established");
        
        // Verify session is open
        assertTrue(session.isOpen(), "WebSocket session should be open");
        
        // Close the session
        session.close();
    }

    @Test
    void testWebSocketConnectionWithoutToken() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        WebSocketHandler handler = new WebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) {
                fail("Connection should not be established without token");
            }

            @Override
            public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
                // Handle incoming messages
            }

            @Override
            public void handleTransportError(WebSocketSession session, Throwable exception) {
                latch.countDown(); // Expected to fail
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
                // Connection closed
            }

            @Override
            public boolean supportsPartialMessages() {
                return false;
            }
        };

        // Try to connect without token
        String wsUrl = "ws://localhost:" + port + "/ws/editor";
        try {
            new StandardWebSocketClient()
                    .doHandshake(handler, null, URI.create(wsUrl))
                    .get(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Expected to fail
        }

        // Wait for error to be handled
        assertTrue(latch.await(5, TimeUnit.SECONDS), "WebSocket connection should fail without token");
    }

    @Test
    void testYjsWebSocketConnection() throws Exception {
        // Create a test JWT token
        String token = jwtService.generateToken("test@example.com");
        
        CountDownLatch latch = new CountDownLatch(1);
        WebSocketHandler handler = new WebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) {
                latch.countDown();
            }

            @Override
            public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
                // Handle incoming messages
            }

            @Override
            public void handleTransportError(WebSocketSession session, Throwable exception) {
                fail("WebSocket transport error: " + exception.getMessage());
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
                // Connection closed
            }

            @Override
            public boolean supportsPartialMessages() {
                return false;
            }
        };

        // Connect to Yjs WebSocket
        String wsUrl = "ws://localhost:" + port + "/ws/yjs/test-room?token=" + token;
        WebSocketSession session = new StandardWebSocketClient()
                .doHandshake(handler, null, URI.create(wsUrl))
                .get(5, TimeUnit.SECONDS);

        // Wait for connection to be established
        assertTrue(latch.await(5, TimeUnit.SECONDS), "Yjs WebSocket connection should be established");
        
        // Verify session is open
        assertTrue(session.isOpen(), "Yjs WebSocket session should be open");
        
        // Close the session
        session.close();
    }
}
