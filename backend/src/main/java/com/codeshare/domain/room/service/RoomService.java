package com.codeshare.domain.room.service;

import com.codeshare.domain.room.Room;
import com.codeshare.domain.room.RoomRepository;
import com.codeshare.infrastructure.metrics.MetricsService;
import com.codeshare.infrastructure.s3.S3Service;
import io.micrometer.core.instrument.Timer;
import java.time.Instant;
import java.util.*;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class RoomService {
  private static final Logger logger = LoggerFactory.getLogger(RoomService.class);

  private final RoomRepository roomRepository;
  private final S3Service s3Service;
  private final MetricsService metricsService;

  public RoomService(
      RoomRepository roomRepository, S3Service s3Service, MetricsService metricsService) {
    this.roomRepository = roomRepository;
    this.s3Service = s3Service;
    this.metricsService = metricsService;
  }

  public Room createRoom(String name, UUID ownerId, String language) {
    Room room =
        Room.builder()
            .name(name)
            .ownerId(ownerId)
            .language(language)
            .createdAt(Instant.now())
            .memberIds(new HashSet<>(Collections.singleton(ownerId)))
            .build();
    Room savedRoom = roomRepository.save(room);
    metricsService.incrementRoomsCreated();
    metricsService.incrementActiveRooms();
    return savedRoom;
  }

  public Room joinRoom(UUID roomId, UUID userId) {
    Room room = roomRepository.findById(roomId).orElseThrow();
    room.getMemberIds().add(userId);
    Room savedRoom = roomRepository.save(room);
    metricsService.incrementRoomsJoined();
    return savedRoom;
  }

  public List<Room> getUserRooms(UUID userId) {
    Set<Room> rooms = new HashSet<>(roomRepository.findByOwnerId(userId));
    rooms.addAll(roomRepository.findByMemberIdsContains(userId));
    return new ArrayList<>(rooms);
  }

  public Optional<Room> getRoomById(UUID roomId) {
    return roomRepository.findById(roomId);
  }

  // Fetch snapshot keys from S3 for the given roomId
  public List<String> getRoomHistory(UUID roomId) {
    try {
      return s3Service.listSnapshotsForRoom(roomId.toString());
    } catch (Exception e) {
      logger.warn("Failed to get room history for room {}: {}", roomId, e.getMessage());
      return new ArrayList<>();
    }
  }

  // Save current snapshot to S3
  public void saveRoomSnapshot(UUID roomId, String content) {
    Timer.Sample sample = metricsService.startSnapshotWriteTimer();
    try {
      String key = roomId.toString() + "/current-snapshot.json";
      s3Service.uploadSnapshot(key, content);
      metricsService.incrementSnapshotsWritten();
      logger.debug("Successfully saved snapshot for room: {}", roomId);
    } catch (Exception e) {
      logger.warn("Failed to save snapshot for room {}: {}", roomId, e.getMessage());
      // Don't throw the exception to prevent 400 errors
    } finally {
      metricsService.recordSnapshotWriteDuration(sample);
    }
  }

  // Get current snapshot from S3
  public String getRoomSnapshot(UUID roomId) {
    try {
      String key = roomId.toString() + "/current-snapshot.json";
      String content = s3Service.getSnapshot(key);
      logger.debug("Successfully retrieved snapshot for room: {}", roomId);
      return content;
    } catch (Exception e) {
      logger.warn("Failed to get snapshot for room {}: {}", roomId, e.getMessage());
      return "";
    }
  }
}
