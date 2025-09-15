package com.codeshare.domain.auth.service;

import com.codeshare.domain.auth.model.*;
import com.codeshare.domain.user.*;
import com.codeshare.infrastructure.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new IllegalArgumentException("Email already exists");
    }

    var user = new User();
    user.setEmail(request.email());
    user.setPassword(passwordEncoder.encode(request.password()));
    user.setRole(User.Role.USER);
    userRepository.save(user);

    var token = jwtService.generateToken(user.getId(), user.getEmail());
    return new AuthResponse(token);
  }

  public AuthResponse authenticate(AuthRequest request) {
    var user =
        userRepository
            .findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    var token = jwtService.generateToken(user.getId(), user.getEmail());
    return new AuthResponse(token);
  }
}
