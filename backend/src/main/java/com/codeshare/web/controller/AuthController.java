package com.codeshare.web.controller;

import com.codeshare.domain.auth.model.*;
import com.codeshare.domain.auth.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private ResponseCookie.ResponseCookieBuilder createCookieBuilder(String token) {
        // Get JWT expiration from environment or use default
        long expirationMs = Long.parseLong(System.getenv().getOrDefault("JWT_EXPIRATION", "86400000"));
        long expirationSeconds = expirationMs / 1000;
        
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("token", token)
                .httpOnly(true)
                .secure(Boolean.parseBoolean(System.getenv().getOrDefault("COOKIE_SECURE", "false")))
                .path("/")
                .maxAge(expirationSeconds)
                .sameSite("Lax");
        
        logger.info("Creating secure cookie with expiration: {} seconds", expirationSeconds);
        
        return builder;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        logger.info("Register request for email: {}", request.email());
        AuthResponse authResponse = authService.register(request);
        
        ResponseCookie cookie = createCookieBuilder(authResponse.token()).build();
        logger.info("Setting auth cookie for register: {}", cookie.toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse("success"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        logger.info("Login request for email: {}", request.email());
        AuthResponse authResponse = authService.authenticate(request);
        
        ResponseCookie cookie = createCookieBuilder(authResponse.token()).build();
        logger.info("Setting auth cookie for login: {}", cookie.toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse("success"));
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout() {
        logger.info("Logout request");
        ResponseCookie cookie = createCookieBuilder("").maxAge(0).build();
        logger.info("Clearing auth cookie: {}", cookie.toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse("success"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        logger.info("Get current user request");
        // This endpoint will be used to verify the token from the cookie
        // The JWT filter will handle the authentication
        return ResponseEntity.ok(new AuthResponse("authenticated"));
    }
}