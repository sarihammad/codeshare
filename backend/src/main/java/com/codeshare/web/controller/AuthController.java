package com.codeshare.web.controller;

import com.codeshare.domain.auth.model.*;
import com.codeshare.domain.auth.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
  private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  private ResponseCookie.ResponseCookieBuilder createAccessTokenCookie(String token) {
    // Access token: short-lived (30 minutes default)
    long expirationMs = Long.parseLong(System.getenv().getOrDefault("JWT_EXPIRATION", "1800000"));
    long expirationSeconds = expirationMs / 1000;

    ResponseCookie.ResponseCookieBuilder builder =
        ResponseCookie.from("access-token", token)
            .httpOnly(true)
            .secure(Boolean.parseBoolean(System.getenv().getOrDefault("COOKIE_SECURE", "true")))
            .path("/")
            .maxAge(expirationSeconds)
            .sameSite("Strict");

    logger.info("Creating access token cookie with expiration: {} seconds", expirationSeconds);
    return builder;
  }

  private ResponseCookie.ResponseCookieBuilder createRefreshTokenCookie(String token) {
    // Refresh token: long-lived (7 days default)
    long expirationMs =
        Long.parseLong(System.getenv().getOrDefault("JWT_REFRESH_EXPIRATION", "604800000"));
    long expirationSeconds = expirationMs / 1000;

    ResponseCookie.ResponseCookieBuilder builder =
        ResponseCookie.from("refresh-token", token)
            .httpOnly(true)
            .secure(Boolean.parseBoolean(System.getenv().getOrDefault("COOKIE_SECURE", "true")))
            .path("/api/auth/refresh")
            .maxAge(expirationSeconds)
            .sameSite("Strict");

    logger.info("Creating refresh token cookie with expiration: {} seconds", expirationSeconds);
    return builder;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    logger.info("Register request for email: {}", request.email());
    AuthResponse authResponse = authService.register(request);

    ResponseCookie accessCookie = createAccessTokenCookie(authResponse.token()).build();
    ResponseCookie refreshCookie = createRefreshTokenCookie(authResponse.refreshToken()).build();

    logger.info("Setting auth cookies for register");

    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
        .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
        .body(new AuthResponse("success"));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
    logger.info("Login request for email: {}", request.email());
    AuthResponse authResponse = authService.authenticate(request);

    ResponseCookie accessCookie = createAccessTokenCookie(authResponse.token()).build();
    ResponseCookie refreshCookie = createRefreshTokenCookie(authResponse.refreshToken()).build();

    logger.info("Setting auth cookies for login");

    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
        .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
        .body(new AuthResponse("success"));
  }

  @PostMapping("/logout")
  public ResponseEntity<AuthResponse> logout() {
    logger.info("Logout request");
    ResponseCookie accessCookie = createAccessTokenCookie("").maxAge(0).build();
    ResponseCookie refreshCookie = createRefreshTokenCookie("").maxAge(0).build();

    logger.info("Clearing auth cookies");

    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
        .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
        .body(new AuthResponse("success"));
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refreshToken() {
    logger.info("Refresh token request");
    // This endpoint will be used to refresh the access token using the refresh token
    // The JWT filter will handle the authentication
    return ResponseEntity.ok(new AuthResponse("token refreshed"));
  }

  @GetMapping("/me")
  public ResponseEntity<AuthResponse> getCurrentUser() {
    logger.info("Get current user request");
    // This endpoint will be used to verify the token from the cookie
    // The JWT filter will handle the authentication
    return ResponseEntity.ok(new AuthResponse("authenticated"));
  }
}
