package com.codeshare.domain.room.service;

import com.codeshare.domain.room.Room;
import com.codeshare.domain.room.RoomRepository;
import com.codeshare.infrastructure.s3.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class RoomService {
    private static final Logger logger = LoggerFactory.getLogger(RoomService.class);
    
    private final RoomRepository roomRepository;
    private final S3Service s3Service;

    public RoomService(RoomRepository roomRepository, S3Service s3Service) {
        this.roomRepository = roomRepository;
        this.s3Service = s3Service;
    }

    public Room createRoom(String name, UUID ownerId, String language) {
        Room room = Room.builder()
                .name(name)
                .ownerId(ownerId)
                .language(language)
                .createdAt(Instant.now())
                .memberIds(new HashSet<>(Collections.singleton(ownerId)))
                .build();
        return roomRepository.save(room);
    }

    public Room joinRoom(UUID roomId, UUID userId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        room.getMemberIds().add(userId);
        return roomRepository.save(room);
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
        try {
            String key = roomId.toString() + "/current-snapshot.json";
            s3Service.uploadSnapshot(key, content);
            logger.debug("Successfully saved snapshot for room: {}", roomId);
        } catch (Exception e) {
            logger.warn("Failed to save snapshot for room {}: {}", roomId, e.getMessage());
            // Don't throw the exception to prevent 400 errors
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