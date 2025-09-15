package com.codeshare.domain.room.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SnapshotRequest(
    @NotBlank(message = "Content is required")
        @Size(max = 1000000, message = "Content must be at most 1MB")
        String content) {}
