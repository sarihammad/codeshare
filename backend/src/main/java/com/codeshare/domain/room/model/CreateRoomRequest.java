package com.codeshare.domain.room.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
    @NotBlank(message = "Room name is required")
    @Size(min = 1, max = 100, message = "Room name must be between 1 and 100 characters")
    String name,
    
    @Size(max = 20, message = "Language must be at most 20 characters")
    String language
) {} 