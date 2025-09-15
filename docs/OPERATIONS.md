# CodeShare Operations Guide

## Overview

This guide provides operational procedures for running, monitoring, and maintaining the CodeShare application in production environments.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15+ database
- Redis 7+ cache
- Kafka 3.6+ message broker
- AWS S3 bucket (optional, for snapshots)

## Deployment Procedures

### Initial Deployment

1. **Environment Setup**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure required variables
   export JWT_SECRET="$(openssl rand -base64 32)"
   export DB_PASSWORD="$(openssl rand -base64 16)"
   export COOKIE_SECURE="true"
   export FRONTEND_ORIGIN="https://your-domain.com"
   ```

2. **Database Initialization**

   ```bash
   # Start database services
   docker compose up -d postgres redis kafka

   # Wait for services to be healthy
   docker compose ps

   # Verify database connection
   docker compose exec postgres psql -U postgres -d codeshare -c "SELECT version();"
   ```

3. **Application Deployment**

   ```bash
   # Build and start all services
   docker compose up --build -d

   # Verify all services are running
   docker compose ps
   ```

### Rolling Updates

1. **Backend Updates**

   ```bash
   # Build new backend image
   docker compose build backend

   # Rolling update with zero downtime
   docker compose up -d --no-deps backend

   # Verify health
   curl http://localhost:8080/actuator/health
   ```

2. **Frontend Updates**

   ```bash
   # Build new frontend image
   docker compose build frontend

   # Update frontend
   docker compose up -d --no-deps frontend

   # Verify deployment
   curl http://localhost:3000
   ```

## Monitoring and Health Checks

### Health Check Endpoints

- **Backend Health**: `GET /actuator/health`
- **Frontend Health**: `GET /api/health`
- **Database Health**: `GET /actuator/health/db`
- **Redis Health**: `GET /actuator/health/redis`

### Key Metrics to Monitor

#### Application Metrics

- `codeshare.rooms.active` - Number of active rooms
- `codeshare.websocket.connections.active` - Active WebSocket connections
- `codeshare.snapshots.written` - Total snapshots written
- `codeshare.rooms.created` - Total rooms created

#### System Metrics

- `jvm.memory.used` - JVM memory usage
- `http.server.requests` - HTTP request metrics
- `hikaricp.connections.active` - Database connection pool
- `redis.lettuce.commands` - Redis command metrics

### Alerting Rules

```yaml
# Prometheus Alerting Rules
groups:
  - name: codeshare
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighMemoryUsage
        expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"

      - alert: DatabaseConnectionPoolExhausted
        expr: hikaricp_connections_active / hikaricp_connections_max > 0.9
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
```

## Logging and Troubleshooting

### Log Locations

- **Application Logs**: `docker compose logs -f backend`
- **Database Logs**: `docker compose logs -f postgres`
- **Cache Logs**: `docker compose logs -f redis`
- **Message Broker Logs**: `docker compose logs -f kafka`

### Log Analysis

```bash
# Search for errors
docker compose logs backend | grep -i error

# Monitor real-time logs
docker compose logs -f --tail=100 backend

# Export logs for analysis
docker compose logs backend > backend.log
```

### Common Issues and Solutions

#### 1. WebSocket Connection Issues

**Symptoms**: Users can't connect to collaborative editing
**Diagnosis**:

```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" \
  http://localhost:8080/ws/editor
```

**Solutions**:

- Verify CORS configuration
- Check firewall rules
- Ensure WebSocket proxy configuration

#### 2. Database Connection Issues

**Symptoms**: Application fails to start or database errors
**Diagnosis**:

```bash
# Check database connectivity
docker compose exec backend ./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=test"
```

**Solutions**:

- Verify database credentials
- Check network connectivity
- Ensure database is running and accessible

#### 3. High Memory Usage

**Symptoms**: Application becomes slow or crashes
**Diagnosis**:

```bash
# Check memory usage
docker stats
curl http://localhost:8080/actuator/metrics/jvm.memory.used
```

**Solutions**:

- Increase container memory limits
- Optimize JVM settings
- Check for memory leaks

#### 4. Redis Connection Issues

**Symptoms**: Presence tracking not working
**Diagnosis**:

```bash
# Test Redis connectivity
docker compose exec redis redis-cli ping
```

**Solutions**:

- Verify Redis configuration
- Check network connectivity
- Restart Redis service

## Backup and Recovery

### Database Backup

```bash
# Create database backup
docker compose exec postgres pg_dump -U postgres codeshare > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose exec -T postgres psql -U postgres codeshare < backup_20240101_120000.sql
```

### S3 Snapshot Backup

```bash
# Backup S3 snapshots
aws s3 sync s3://your-bucket/snapshots/ ./snapshots-backup/

# Restore S3 snapshots
aws s3 sync ./snapshots-backup/ s3://your-bucket/snapshots/
```

### Configuration Backup

```bash
# Backup environment configuration
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Backup Docker Compose configuration
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
```

## Performance Tuning

### JVM Tuning

```bash
# Optimize JVM settings
export JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -Xmx2g -Xms1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Database Tuning

```sql
-- PostgreSQL performance settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### Redis Tuning

```bash
# Redis performance settings
docker compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Security Operations

### SSL/TLS Configuration

```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update environment for HTTPS
export COOKIE_SECURE="true"
export FRONTEND_ORIGIN="https://your-domain.com"
```

### Security Scanning

```bash
# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image codeshare-backend:latest

# Check for secrets in code
docker run --rm -v $(pwd):/src trufflesecurity/trufflehog git file:///src
```

### Access Control

```bash
# Review user access
docker compose exec postgres psql -U postgres -d codeshare -c \
  "SELECT email, role, created_at FROM users ORDER BY created_at DESC;"

# Monitor authentication attempts
docker compose logs backend | grep -i "authentication"
```

## Scaling Operations

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: "3.8"
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - SPRING_PROFILES_ACTIVE=prod
  frontend:
    deploy:
      replicas: 2
```

### Load Balancer Configuration

```nginx
# Nginx configuration for load balancing
upstream backend {
    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}

upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily

- Monitor application health and metrics
- Check error logs for issues
- Verify backup completion

#### Weekly

- Review performance metrics
- Update security patches
- Clean up old logs and temporary files

#### Monthly

- Database maintenance and optimization
- Security audit and vulnerability scan
- Capacity planning review

### Update Procedures

```bash
# Update application
git pull origin main
docker compose build
docker compose up -d

# Update dependencies
cd backend && ./mvnw versions:use-latest-versions
cd frontend && npm update

# Database migrations
docker compose exec backend ./mvnw flyway:migrate
```

## Emergency Procedures

### Incident Response

1. **Immediate Response**

   - Assess impact and severity
   - Notify stakeholders
   - Document incident details

2. **Investigation**

   - Check logs and metrics
   - Identify root cause
   - Implement temporary fix if needed

3. **Resolution**

   - Apply permanent fix
   - Verify system stability
   - Update monitoring and alerting

4. **Post-Incident**
   - Conduct post-mortem
   - Update runbooks
   - Implement preventive measures

### Rollback Procedures

```bash
# Rollback to previous version
git checkout previous-stable-tag
docker compose build
docker compose up -d

# Rollback database changes
docker compose exec postgres psql -U postgres -d codeshare -c \
  "SELECT flyway_schema_history.version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;"
```

## Contact Information

- **On-call Engineer**: [Contact Details]
- **Database Administrator**: [Contact Details]
- **Security Team**: [Contact Details]
- **Escalation Path**: [Contact Details]
