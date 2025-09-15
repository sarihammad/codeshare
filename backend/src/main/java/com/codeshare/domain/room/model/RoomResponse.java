package com.codeshare.domain.room.model;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record RoomResponse(
    UUID id, String name, UUID ownerId, String language, Instant createdAt, Set<UUID> memberIds) {}
