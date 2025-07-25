package com.codeshare.web.controller;

import com.codeshare.infrastructure.redis.PresenceService;
import com.codeshare.domain.room.service.RoomService;
import com.codeshare.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@WebMvcTest(RoomController.class)
@WithMockUser
public class RoomControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @MockBean
    private PresenceService presenceService;

    @MockBean
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        Mockito.reset(roomService, presenceService);
    }

    @Test
    void testGetRoomPresence() throws Exception {
        UUID roomId = UUID.randomUUID();
        Set<String> userIds = Set.of("user1", "user2");
        when(presenceService.getUsersInRoom(anyString())).thenReturn(userIds);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/rooms/" + roomId + "/presence"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0]").value("user1"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1]").value("user2"));
    }
} 