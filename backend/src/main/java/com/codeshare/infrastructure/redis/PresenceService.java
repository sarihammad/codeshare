package com.codeshare.infrastructure.redis;

import java.util.Set;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class PresenceService {

  private final StringRedisTemplate redisTemplate;

  public PresenceService(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  public void addUserToRoom(String roomId, String userId) {
    redisTemplate.opsForSet().add("room:" + roomId + ":users", userId);
  }

  public void removeUserFromRoom(String roomId, String userId) {
    redisTemplate.opsForSet().remove("room:" + roomId + ":users", userId);
  }

  public Set<String> getUsersInRoom(String roomId) {
    return redisTemplate.opsForSet().members("room:" + roomId + ":users");
  }
}
