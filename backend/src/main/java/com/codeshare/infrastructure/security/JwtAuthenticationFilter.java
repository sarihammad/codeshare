package com.codeshare.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        logger.info("JWT Filter processing request: {}", path);
        
        if (path.startsWith("/api/auth")) {
            logger.info("Skipping JWT filter for auth endpoint: {}", path);
            filterChain.doFilter(request, response);
            return;
        }
        
        // Try to get token from cookie first
        String token = getTokenFromCookie(request);
        logger.info("Token from cookie: {}", token != null ? "found" : "not found");
        
        // Fallback to Authorization header for backward compatibility
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            logger.info("Authorization header: {}", authHeader != null ? "present" : "not present");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                logger.info("Token from Authorization header: found");
            }
        }
        
        if (token == null) {
            logger.warn("No token found for request: {}", path);
            filterChain.doFilter(request, response);
            return;
        }
        
        if (!jwtService.isTokenValid(token)) {
            logger.warn("Invalid token for request: {}", path);
            filterChain.doFilter(request, response);
            return;
        }
        
        logger.info("Token is valid, extracting user info");
        String email = jwtService.extractEmail(token);
        String userIdStr = jwtService.extractClaim(token, "userId");
        UUID userId = UUID.fromString(userIdStr);
        JwtUserPrincipal principal = new JwtUserPrincipal(userId, email);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal, null, Collections.emptyList());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        logger.info("Authentication set for user: {} on path: {}", email, path);
        filterChain.doFilter(request, response);
    }
    
    private String getTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            logger.debug("No cookies found in request");
            return null;
        }
        
        logger.debug("Found {} cookies", cookies.length);
        for (Cookie cookie : cookies) {
            logger.debug("Cookie: {} = {}", cookie.getName(), cookie.getValue() != null ? "present" : "null");
        }
        
        Optional<Cookie> authCookie = Arrays.stream(cookies)
                .filter(cookie -> "auth-token".equals(cookie.getName()))
                .findFirst();
        
        return authCookie.map(Cookie::getValue).orElse(null);
    }
} 