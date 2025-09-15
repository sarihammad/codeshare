package com.codeshare.infrastructure.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class MetricsService {

  private final MeterRegistry meterRegistry;
  private final AtomicInteger activeRooms = new AtomicInteger(0);
  private final AtomicInteger activeWebSocketConnections = new AtomicInteger(0);
  private final AtomicLong totalSnapshotsWritten = new AtomicLong(0);

  private final Counter roomsCreatedCounter;
  private final Counter roomsJoinedCounter;
  private final Counter snapshotsWrittenCounter;
  private final Counter websocketConnectionsCounter;
  private final Counter websocketDisconnectionsCounter;
  private final Timer snapshotWriteTimer;
  private final Timer websocketConnectionTimer;

  public MetricsService(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;

    // Initialize counters
    this.roomsCreatedCounter =
        Counter.builder("codeshare.rooms.created")
            .description("Total number of rooms created")
            .register(meterRegistry);

    this.roomsJoinedCounter =
        Counter.builder("codeshare.rooms.joined")
            .description("Total number of room joins")
            .register(meterRegistry);

    this.snapshotsWrittenCounter =
        Counter.builder("codeshare.snapshots.written")
            .description("Total number of snapshots written")
            .register(meterRegistry);

    this.websocketConnectionsCounter =
        Counter.builder("codeshare.websocket.connections")
            .description("Total number of WebSocket connections")
            .register(meterRegistry);

    this.websocketDisconnectionsCounter =
        Counter.builder("codeshare.websocket.disconnections")
            .description("Total number of WebSocket disconnections")
            .register(meterRegistry);

    // Initialize timers
    this.snapshotWriteTimer =
        Timer.builder("codeshare.snapshots.write.duration")
            .description("Time taken to write snapshots")
            .register(meterRegistry);

    this.websocketConnectionTimer =
        Timer.builder("codeshare.websocket.connection.duration")
            .description("Time taken for WebSocket connections")
            .register(meterRegistry);

    // Register gauges
    Gauge.builder("codeshare.rooms.active", this, MetricsService::getActiveRooms)
        .description("Number of currently active rooms")
        .register(meterRegistry);

    Gauge.builder(
            "codeshare.websocket.connections.active",
            this,
            MetricsService::getActiveWebSocketConnections)
        .description("Number of currently active WebSocket connections")
        .register(meterRegistry);

    Gauge.builder("codeshare.snapshots.total", this, MetricsService::getTotalSnapshotsWritten)
        .description("Total number of snapshots written")
        .register(meterRegistry);
  }

  // Room metrics
  public void incrementRoomsCreated() {
    roomsCreatedCounter.increment();
  }

  public void incrementRoomsJoined() {
    roomsJoinedCounter.increment();
  }

  public void incrementActiveRooms() {
    activeRooms.incrementAndGet();
  }

  public void decrementActiveRooms() {
    activeRooms.decrementAndGet();
  }

  public int getActiveRooms() {
    return activeRooms.get();
  }

  // WebSocket metrics
  public void incrementWebSocketConnections() {
    websocketConnectionsCounter.increment();
    activeWebSocketConnections.incrementAndGet();
  }

  public void incrementWebSocketDisconnections() {
    websocketDisconnectionsCounter.increment();
    activeWebSocketConnections.decrementAndGet();
  }

  public int getActiveWebSocketConnections() {
    return activeWebSocketConnections.get();
  }

  public Timer.Sample startWebSocketConnectionTimer() {
    return Timer.start(meterRegistry);
  }

  public void recordWebSocketConnectionDuration(Timer.Sample sample) {
    sample.stop(websocketConnectionTimer);
  }

  // Snapshot metrics
  public void incrementSnapshotsWritten() {
    snapshotsWrittenCounter.increment();
    totalSnapshotsWritten.incrementAndGet();
  }

  public long getTotalSnapshotsWritten() {
    return totalSnapshotsWritten.get();
  }

  public Timer.Sample startSnapshotWriteTimer() {
    return Timer.start(meterRegistry);
  }

  public void recordSnapshotWriteDuration(Timer.Sample sample) {
    sample.stop(snapshotWriteTimer);
  }
}
