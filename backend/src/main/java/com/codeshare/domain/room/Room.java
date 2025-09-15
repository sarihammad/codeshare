package com.codeshare.domain.room;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
  @Id @GeneratedValue private UUID id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private UUID ownerId;

  private String language;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "room_members", joinColumns = @JoinColumn(name = "room_id"))
  @Column(name = "member_id")
  private Set<UUID> memberIds;
}
