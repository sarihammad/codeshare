package com.codeshare.infrastructure.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

@Service
public class MetricsService {
  private final MeterRegistry meterRegistry;
  private final Map<String, AtomicInteger> activeConnections = new ConcurrentHashMap<>();
  private final Map<String, AtomicInteger> roomConnections = new ConcurrentHashMap<>();

  // Counters
  private final Counter wsConnectionsTotal;
  private final Counter wsDisconnectionsTotal;
  private final Counter messagesReceivedTotal;
  private final Counter messagesSentTotal;
  private final Counter snapshotsCreatedTotal;
  private final Counter snapshotsFailedTotal;
  private final Counter roomsCreatedTotal;
  private final Counter roomsDeletedTotal;

  // Timers
  private final Timer snapshotLatency;
  private final Timer messageProcessingLatency;
  private final Timer roomCreationLatency;

  public MetricsService(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;

    // Initialize counters
    this.wsConnectionsTotal =
        Counter.builder("websocket_connections_total")
            .description("Total number of WebSocket connections established")
            .register(meterRegistry);

    this.wsDisconnectionsTotal =
        Counter.builder("websocket_disconnections_total")
            .description("Total number of WebSocket connections closed")
            .register(meterRegistry);

    this.messagesReceivedTotal =
        Counter.builder("messages_received_total")
            .description("Total number of messages received")
            .tag("direction", "inbound")
            .register(meterRegistry);

    this.messagesSentTotal =
        Counter.builder("messages_sent_total")
            .description("Total number of messages sent")
            .tag("direction", "outbound")
            .register(meterRegistry);

    this.snapshotsCreatedTotal =
        Counter.builder("snapshots_created_total")
            .description("Total number of snapshots created")
            .register(meterRegistry);

    this.snapshotsFailedTotal =
        Counter.builder("snapshots_failed_total")
            .description("Total number of snapshot creation failures")
            .register(meterRegistry);

    this.roomsCreatedTotal =
        Counter.builder("rooms_created_total")
            .description("Total number of rooms created")
            .register(meterRegistry);

    this.roomsDeletedTotal =
        Counter.builder("rooms_deleted_total")
            .description("Total number of rooms deleted")
            .register(meterRegistry);

    // Initialize timers
    this.snapshotLatency =
        Timer.builder("snapshot_latency")
            .description("Time taken to create snapshots")
            .register(meterRegistry);

    this.messageProcessingLatency =
        Timer.builder("message_processing_latency")
            .description("Time taken to process messages")
            .register(meterRegistry);

    this.roomCreationLatency =
        Timer.builder("room_creation_latency")
            .description("Time taken to create rooms")
            .register(meterRegistry);

    // Register gauges
    Gauge.builder("websocket_connections_active")
        .description("Number of active WebSocket connections")
        .register(meterRegistry, this, MetricsService::getTotalActiveConnections);

    Gauge.builder("rooms_active")
        .description("Number of active rooms")
        .register(meterRegistry, this, MetricsService::getTotalActiveRooms);
  }

  // WebSocket metrics
  public void recordWebSocketConnection(String roomId) {
    wsConnectionsTotal.increment();
    activeConnections.computeIfAbsent("total", k -> new AtomicInteger(0)).incrementAndGet();
    roomConnections.computeIfAbsent(roomId, k -> new AtomicInteger(0)).incrementAndGet();
  }

  public void recordWebSocketDisconnection(String roomId) {
    wsDisconnectionsTotal.increment();
    activeConnections.computeIfAbsent("total", k -> new AtomicInteger(0)).decrementAndGet();
    roomConnections.computeIfAbsent(roomId, k -> new AtomicInteger(0)).decrementAndGet();

    // Clean up empty room connections
    if (roomConnections.get(roomId).get() <= 0) {
      roomConnections.remove(roomId);
    }
  }

  // Message metrics
  public void recordMessageReceived(String roomId) {
    messagesReceivedTotal.increment();
  }

  public void recordMessageSent(String roomId) {
    messagesSentTotal.increment();
  }

  public Timer.Sample startMessageProcessingTimer() {
    return Timer.start(meterRegistry);
  }

  public void recordMessageProcessingLatency(Timer.Sample sample) {
    sample.stop(messageProcessingLatency);
  }

  // Snapshot metrics
  public void recordSnapshotCreated(String roomId) {
    snapshotsCreatedTotal.increment();
  }

  public void recordSnapshotFailed(String roomId, String reason) {
    snapshotsFailedTotal.increment();
  }

  public Timer.Sample startSnapshotTimer() {
    return Timer.start(meterRegistry);
  }

  public void recordSnapshotLatency(Timer.Sample sample) {
    sample.stop(snapshotLatency);
  }

  // Room metrics
  public void recordRoomCreated(String roomId) {
    roomsCreatedTotal.increment();
  }

  public void recordRoomDeleted(String roomId) {
    roomsDeletedTotal.increment();
  }

  public Timer.Sample startRoomCreationTimer() {
    return Timer.start(meterRegistry);
  }

  public void recordRoomCreationLatency(Timer.Sample sample) {
    sample.stop(roomCreationLatency);
  }

  // Gauge values
  private double getTotalActiveConnections() {
    return activeConnections.getOrDefault("total", new AtomicInteger(0)).get();
  }

  private double getTotalActiveRooms() {
    return roomConnections.size();
  }

  public int getActiveConnectionsForRoom(String roomId) {
    return roomConnections.getOrDefault(roomId, new AtomicInteger(0)).get();
  }
}
