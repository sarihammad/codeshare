package com.codeshare.web.controller;

import com.codeshare.domain.auth.model.*;
import com.codeshare.domain.auth.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private ResponseCookie.ResponseCookieBuilder createCookieBuilder(String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("auth-token", token)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .sameSite("Lax");
        
        // Set domain only for production, not for localhost
        String host = System.getenv("HOST") != null ? System.getenv("HOST") : "localhost";
        logger.info("Creating cookie for host: {}", host);
        if (!host.contains("localhost")) {
            builder.domain("codesh-Publi-ymCC7MFYWsP4-1558037911.us-east-2.elb.amazonaws.com");
            logger.info("Setting cookie domain for production");
        } else {
            logger.info("Not setting cookie domain for localhost");
        }
        
        return builder;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        logger.info("Register request for email: {}", request.email());
        AuthResponse authResponse = authService.register(request);
        
        ResponseCookie cookie = createCookieBuilder(authResponse.token()).build();
        logger.info("Setting auth cookie for register: {}", cookie.toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse("success"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
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