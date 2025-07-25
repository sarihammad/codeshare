package com.codeshare.domain.room;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByOwnerId(UUID ownerId);
    List<Room> findByMemberIdsContains(UUID memberId);
} 