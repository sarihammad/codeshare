package com.codeshare.config;

import com.codeshare.infrastructure.security.JwtAuthenticationFilter;
import com.codeshare.infrastructure.security.RateLimitFilter;
import java.util.Arrays;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.*;
import org.springframework.security.config.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final RateLimitFilter rateLimitFilter;
  private final SecurityHeadersFilter securityHeadersFilter;

  public SecurityConfig(
      JwtAuthenticationFilter jwtAuthenticationFilter,
      RateLimitFilter rateLimitFilter,
      SecurityHeadersFilter securityHeadersFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.rateLimitFilter = rateLimitFilter;
    this.securityHeadersFilter = securityHeadersFilter;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // Get allowed origins from environment variable
    String allowedOriginsStr =
        System.getenv()
            .getOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000,https://localhost:3000");
    configuration.setAllowedOrigins(Arrays.asList(allowedOriginsStr.split(",")));

    // Only allow necessary methods
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

    // Only allow necessary headers
    configuration.setAllowedHeaders(
        Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"));

    // Expose only necessary headers
    configuration.setExposedHeaders(
        Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));

    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L); // Cache preflight for 1 hour

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/actuator/**")
                    .permitAll()
                    .requestMatchers("/api/auth/**")
                    .permitAll()
                    .requestMatchers("/ws/**")
                    .permitAll() // WebSocket handshake is tokenized below
                    .anyRequest()
                    .authenticated())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    http.addFilterBefore(securityHeadersFilter, UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }
}
