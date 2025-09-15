package com.codeshare.domain.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.codeshare.domain.auth.model.*;
import com.codeshare.domain.user.*;
import com.codeshare.infrastructure.security.JwtService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

  private UserRepository userRepository;
  private PasswordEncoder passwordEncoder;
  private JwtService jwtService;
  private AuthService authService;

  @BeforeEach
  void setUp() {
    userRepository = mock(UserRepository.class);
    passwordEncoder = mock(PasswordEncoder.class);
    jwtService = mock(JwtService.class);
    authService = new AuthService(userRepository, passwordEncoder, jwtService);
  }

  @Test
  void register_shouldCreateUserAndReturnToken() {
    RegisterRequest request = new RegisterRequest("test@example.com", "password");

    when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
    when(passwordEncoder.encode("password")).thenReturn("hashed");
    when(jwtService.generateToken(any(), eq("test@example.com"))).thenReturn("token");

    AuthResponse response = authService.register(request);

    assertEquals("token", response.token());
    verify(userRepository).save(any(User.class));
  }

  @Test
  void authenticate_shouldReturnTokenForValidUser() {
    User user = new User();
    user.setId(UUID.randomUUID());
    user.setEmail("user@example.com");
    user.setPassword("hashed");

    AuthRequest request = new AuthRequest("user@example.com", "password");

    when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("password", "hashed")).thenReturn(true);
    when(jwtService.generateToken(any(), eq("user@example.com"))).thenReturn("token");

    AuthResponse response = authService.authenticate(request);

    assertEquals("token", response.token());
  }

  @Test
  void authenticate_shouldThrowOnInvalidPassword() {
    User user = new User();
    user.setEmail("user@example.com");
    user.setPassword("wrong");

    AuthRequest request = new AuthRequest("user@example.com", "password");

    when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("password", "wrong")).thenReturn(false);

    assertThrows(IllegalArgumentException.class, () -> authService.authenticate(request));
  }
}
