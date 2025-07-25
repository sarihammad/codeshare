package com.codeshare.domain.room.model;

import jakarta.validation.constraints.NotBlank;

public record CreateRoomRequest(@NotBlank String name, String language) {} 