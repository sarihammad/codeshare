package com.codeshare.infrastructure.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.io.Serializable;
import java.util.UUID;

@Data
@AllArgsConstructor
public class JwtUserPrincipal implements Serializable {
    private UUID userId;
    private String email;
} 