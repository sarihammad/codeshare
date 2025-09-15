package com.codeshare.infrastructure.redis;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

public class PresenceServiceTest {
  private StringRedisTemplate redisTemplate;
  private SetOperations<String, String> setOperations;
  private PresenceService presenceService;

  @BeforeEach
  void setUp() {
    redisTemplate = mock(StringRedisTemplate.class);
    setOperations = mock(SetOperations.class);
    when(redisTemplate.opsForSet()).thenReturn(setOperations);
    presenceService = new PresenceService(redisTemplate);
  }

  @Test
  void testAddUserToRoom() {
    presenceService.addUserToRoom("room1", "user1");
    verify(setOperations).add("room:room1:users", "user1");
  }

  @Test
  void testRemoveUserFromRoom() {
    presenceService.removeUserFromRoom("room1", "user1");
    verify(setOperations).remove("room:room1:users", "user1");
  }

  @Test
  void testGetUsersInRoom() {
    Set<String> users = new HashSet<>();
    users.add("user1");
    users.add("user2");
    when(setOperations.members("room:room1:users")).thenReturn(users);
    when(redisTemplate.opsForSet()).thenReturn(setOperations);
    Set<String> result = presenceService.getUsersInRoom("room1");
    assertEquals(users, result);
  }
}
