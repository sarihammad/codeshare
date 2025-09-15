package com.codeshare.domain.room;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, UUID> {
  List<Room> findByOwnerId(UUID ownerId);

  List<Room> findByMemberIdsContains(UUID memberId);
}
