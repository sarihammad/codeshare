# Security Documentation

## Overview
This document outlines the security measures implemented in the CodeShare application.

## Authentication & Authorization

### JWT Token-Based Authentication
- **Stateless**: Uses JWT tokens for stateless authentication
- **Secure Cookies**: JWT tokens are stored in httpOnly, secure cookies
- **Expiration**: Configurable token expiration (default: 24 hours)
- **Secret Management**: JWT secret is externalized via environment variables

### Cookie Security
- **httpOnly**: Prevents XSS attacks by blocking JavaScript access
- **Secure**: HTTPS-only in production (configurable via `COOKIE_SECURE`)
- **SameSite**: Set to "Lax" to prevent CSRF attacks while allowing cross-site navigation
- **Path**: Restricted to root path "/"
- **MaxAge**: Matches JWT expiration time

### CORS Configuration
- **Origin Control**: Only allows configured frontend origins
- **Credentials**: Supports credentials for authenticated requests
- **Methods**: Allows necessary HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- **Headers**: Allows Authorization and Content-Type headers

## WebSocket Security

### Authentication
- **JWT Validation**: WebSocket connections require valid JWT tokens
- **Handshake Interceptor**: Validates tokens during WebSocket handshake
- **User Context**: Attaches user information to WebSocket sessions

### Authorization
- **Room Access**: Users can only access rooms they have permission for
- **Presence Management**: User presence is tracked per room

## Data Protection

### Database Security
- **Connection Security**: Database credentials externalized
- **Migration Management**: Uses Flyway for controlled schema changes
- **DDL Auto**: Disabled in production to prevent unauthorized schema changes

### Input Validation
- **Bean Validation**: All request DTOs use validation annotations
- **Rate Limiting**: API endpoints protected against abuse
- **SQL Injection**: Uses JPA/Hibernate to prevent SQL injection

## Infrastructure Security

### Environment Variables
- **Secret Management**: All secrets externalized to environment variables
- **Profile-Based**: Different configurations for local, staging, and production
- **No Hardcoded Secrets**: No secrets committed to version control

### Docker Security
- **Non-Root User**: Containers run as non-root user
- **Minimal Base Images**: Uses minimal base images where possible
- **Health Checks**: Proper health checks for all services

## Security Headers

### HTTP Security
- **CSRF Protection**: Disabled for stateless JWT APIs
- **Session Management**: Stateless session policy
- **Content Security**: Proper content type validation

## Monitoring & Logging

### Security Logging
- **Authentication Events**: Logs login attempts and failures
- **Authorization Events**: Logs access control decisions
- **WebSocket Events**: Logs connection and disconnection events

### Metrics
- **Security Metrics**: Tracks authentication and authorization metrics
- **Error Rates**: Monitors error rates for potential attacks

## Best Practices

### Development
1. Never commit secrets to version control
2. Use environment variables for all configuration
3. Validate all input data
4. Use HTTPS in production
5. Keep dependencies updated

### Production
1. Use strong, unique secrets
2. Enable secure cookie flags
3. Monitor security metrics
4. Regular security audits
5. Implement proper backup and recovery

## Security Checklist

- [x] JWT tokens with secure cookies
- [x] CORS properly configured
- [x] WebSocket authentication
- [x] Input validation
- [x] Rate limiting
- [x] Environment variable management
- [x] Database security
- [x] Docker security
- [x] Security logging
- [x] Health checks
