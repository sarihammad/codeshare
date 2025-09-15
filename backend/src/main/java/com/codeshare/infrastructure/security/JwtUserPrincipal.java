package com.codeshare.infrastructure.security;

import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtUserPrincipal implements Serializable {
  private UUID userId;
  private String email;
}
