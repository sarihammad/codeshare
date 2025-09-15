package com.codeshare.domain.room.model;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record JoinRoomRequest(@NotNull UUID roomId) {}
