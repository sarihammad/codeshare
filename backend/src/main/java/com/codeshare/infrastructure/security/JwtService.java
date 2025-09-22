package com.codeshare.infrastructure.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtService {
  private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration:1800000}") // Default 30 minutes
  private long expiration;

  @Value("${jwt.refresh-expiration:604800000}") // Default 7 days
  private long refreshExpiration;

  private Key key;

  @PostConstruct
  public void init() {
    // Validate secret strength
    if (secret.length() < 32) {
      throw new IllegalArgumentException(
          "JWT secret must be at least 32 characters long for security");
    }

    this.key = Keys.hmacShaKeyFor(secret.getBytes());
    logger.info("JWT service initialized with {} minute expiration", expiration / 60000);
  }

  public String generateToken(UUID userId, String email) {
    return Jwts.builder()
        .setSubject(email)
        .claim("userId", userId.toString())
        .claim("type", "access")
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + expiration))
        .signWith(key)
        .compact();
  }

  public String generateRefreshToken(UUID userId, String email) {
    return Jwts.builder()
        .setSubject(email)
        .claim("userId", userId.toString())
        .claim("type", "refresh")
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
        .signWith(key)
        .compact();
  }

  public String extractEmail(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody()
        .getSubject();
  }

  public boolean isTokenValid(String token) {
    try {
      var claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
      // Check if token is expired
      return !claims.getBody().getExpiration().before(new Date());
    } catch (Exception e) {
      logger.debug("Token validation failed: {}", e.getMessage());
      return false;
    }
  }

  public boolean isTokenExpired(String token) {
    try {
      var claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
      return claims.getBody().getExpiration().before(new Date());
    } catch (Exception e) {
      return true;
    }
  }

  public String extractClaim(String token, String claim) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody()
        .get(claim, String.class);
  }
}
