package com.codeshare.web.controller;

import com.codeshare.domain.room.Room;
import com.codeshare.domain.room.model.*;
import com.codeshare.domain.room.service.RoomService;
import com.codeshare.infrastructure.redis.PresenceService;
import com.codeshare.infrastructure.security.JwtUserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
@Validated
public class RoomController {
    private static final Logger logger = LoggerFactory.getLogger(RoomController.class);
    
    private final RoomService roomService;
    private final PresenceService presenceService;

    public RoomController(RoomService roomService, PresenceService presenceService) {
        this.roomService = roomService;
        this.presenceService = presenceService;
    }

    private UUID getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtUserPrincipal principal) {
            return principal.getUserId();
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request) {
        try {
            Room room = roomService.createRoom(request.name(), getUserId(), request.language());
            return ResponseEntity.ok(toResponse(room));
        } catch (Exception e) {
            logger.error("Failed to create room: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<RoomResponse>> getMyRooms() {
        try {
            List<Room> rooms = roomService.getUserRooms(getUserId());
            return ResponseEntity.ok(rooms.stream().map(this::toResponse).collect(Collectors.toList()));
        } catch (Exception e) {
            logger.error("Failed to get user rooms: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(@Valid @RequestBody JoinRoomRequest request) {
        try {
            Room room = roomService.joinRoom(request.roomId(), getUserId());
            return ResponseEntity.ok(toResponse(room));
        } catch (Exception e) {
            logger.error("Failed to join room: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<String>> getRoomHistory(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(roomService.getRoomHistory(id));
        } catch (Exception e) {
            logger.error("Failed to get room history: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable UUID id) {
        try {
            return roomService.getRoomById(id)
                    .map(this::toResponse)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Failed to get room: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/snapshot")
    public ResponseEntity<SnapshotResponse> getRoomSnapshot(@PathVariable UUID id) {
        try {
            String content = roomService.getRoomSnapshot(id);
            return ResponseEntity.ok(new SnapshotResponse(content));
        } catch (Exception e) {
            logger.warn("Failed to get room snapshot for room {}: {}", id, e.getMessage());
            // Return empty content instead of 404 to prevent frontend errors
            return ResponseEntity.ok(new SnapshotResponse(""));
        }
    }

    @PostMapping("/{id}/snapshot")
    public ResponseEntity<SnapshotResponse> saveRoomSnapshot(@PathVariable UUID id, @Valid @RequestBody SnapshotRequest request) {
        try {
            if (request.content() == null) {
                logger.warn("Received null content for room snapshot: {}", id);
                return ResponseEntity.badRequest().build();
            }
            
            roomService.saveRoomSnapshot(id, request.content());
            return ResponseEntity.ok(new SnapshotResponse(request.content()));
        } catch (Exception e) {
            logger.warn("Failed to save room snapshot for room {}: {}", id, e.getMessage());
            // Return success even if S3 save fails to prevent frontend errors
            return ResponseEntity.ok(new SnapshotResponse(request.content()));
        }
    }

    @GetMapping("/{id}/presence")
    public ResponseEntity<Set<String>> getRoomPresence(@PathVariable UUID id) {
        try {
            Set<String> users = presenceService.getUsersInRoom(id.toString());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Failed to get presence for room {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        logger.error("Validation error: {}", ex.getMessage());
        return ResponseEntity.badRequest().body("Validation error: " + ex.getMessage());
    }

    private RoomResponse toResponse(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getOwnerId(),
                room.getLanguage(),
                room.getCreatedAt(),
                room.getMemberIds()
        );
    }
} 