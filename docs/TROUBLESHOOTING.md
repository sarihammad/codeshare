# CodeShare Troubleshooting Guide

## Common Issues and Solutions

### 🚨 WebSocket Connection Issues

#### Problem: "WebSocket connection failed"
**Symptoms:**
- Real-time collaboration not working
- Users can't see each other's cursors
- Console shows WebSocket errors

**Solutions:**
```bash
# 1. Check if backend is running
curl http://localhost:8080/actuator/health

# 2. Verify WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:8080/ws/editor

# 3. Check firewall/proxy settings
# Ensure ports 8080 and 3000 are accessible

# 4. Restart services
docker compose restart backend frontend
```

#### Problem: "Authentication failed for WebSocket"
**Symptoms:**
- WebSocket connects but immediately disconnects
- 401 errors in browser console

**Solutions:**
```bash
# 1. Check JWT token in cookies
# Open browser dev tools > Application > Cookies
# Verify 'token' cookie exists and is not expired

# 2. Regenerate JWT secret
export JWT_SECRET=$(openssl rand -base64 32)
docker compose restart backend

# 3. Clear browser cookies and re-login
```

### 🗄️ Database Issues

#### Problem: "Database connection failed"
**Symptoms:**
- Backend fails to start
- "Connection refused" errors
- User registration/login fails

**Solutions:**
```bash
# 1. Check PostgreSQL container
docker compose logs postgres

# 2. Verify database credentials
echo $DB_URL
echo $DB_USER
echo $DB_PASSWORD

# 3. Reset database
docker compose down -v
docker compose up -d postgres
sleep 10
docker compose up backend

# 4. Check database connectivity
docker compose exec postgres psql -U postgres -d codeshare -c "SELECT 1;"
```

#### Problem: "Migration failed"
**Symptoms:**
- Backend starts but shows migration errors
- Tables not created properly

**Solutions:**
```bash
# 1. Check Flyway logs
docker compose logs backend | grep -i flyway

# 2. Manually run migrations
docker compose exec backend java -jar app.jar --spring.profiles.active=local

# 3. Reset and re-run migrations
docker compose down -v
docker compose up -d postgres
sleep 10
docker compose up backend
```

### 🌐 Frontend Issues

#### Problem: "Frontend not loading"
**Symptoms:**
- Blank page at localhost:3000
- 404 errors
- Build failures

**Solutions:**
```bash
# 1. Check frontend logs
docker compose logs frontend

# 2. Rebuild frontend
docker compose build frontend
docker compose up frontend

# 3. Check for build errors
cd frontend
npm install
npm run build

# 4. Clear Next.js cache
rm -rf frontend/.next
docker compose restart frontend
```

#### Problem: "API calls failing"
**Symptoms:**
- 404 errors for API endpoints
- CORS errors in browser console
- Authentication requests failing

**Solutions:**
```bash
# 1. Check API base URL
echo $NEXT_PUBLIC_BACKEND_URL

# 2. Verify backend is accessible
curl http://localhost:8080/api/auth/me

# 3. Check CORS configuration
# Verify FRONTEND_ORIGIN is set correctly
echo $FRONTEND_ORIGIN

# 4. Test API endpoints directly
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 🔐 Authentication Issues

#### Problem: "Login not working"
**Symptoms:**
- Login form submits but user stays on login page
- "Invalid credentials" error
- Redirect loops

**Solutions:**
```bash
# 1. Check user exists in database
docker compose exec postgres psql -U postgres -d codeshare \
  -c "SELECT email FROM users WHERE email = 'test@example.com';"

# 2. Verify password hashing
# Check if password is properly hashed in database

# 3. Check JWT configuration
echo $JWT_SECRET
echo $JWT_EXPIRATION

# 4. Clear browser storage
# Open dev tools > Application > Storage > Clear All
```

#### Problem: "Cookie not being set"
**Symptoms:**
- Login succeeds but user not authenticated
- Cookie not visible in browser dev tools

**Solutions:**
```bash
# 1. Check cookie configuration
echo $COOKIE_SECURE
# Should be 'false' for local development

# 2. Verify CORS settings
# Check if credentials are allowed

# 3. Test cookie setting manually
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v
```

### 🐳 Docker Issues

#### Problem: "Container won't start"
**Symptoms:**
- Docker containers exit immediately
- Port conflicts
- Resource issues

**Solutions:**
```bash
# 1. Check container logs
docker compose logs [service-name]

# 2. Check port conflicts
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080
netstat -tulpn | grep :5432

# 3. Free up resources
docker system prune -a
docker volume prune

# 4. Restart Docker daemon
sudo systemctl restart docker
```

#### Problem: "Volume mounting issues"
**Symptoms:**
- File changes not reflected in container
- Permission denied errors

**Solutions:**
```bash
# 1. Check volume mounts
docker compose config

# 2. Fix permissions
sudo chown -R $USER:$USER .

# 3. Recreate volumes
docker compose down -v
docker compose up
```

### 📊 Performance Issues

#### Problem: "Slow response times"
**Symptoms:**
- High latency for API calls
- Slow WebSocket message delivery
- UI feels sluggish

**Solutions:**
```bash
# 1. Check resource usage
docker stats

# 2. Monitor database performance
docker compose exec postgres psql -U postgres -d codeshare \
  -c "SELECT * FROM pg_stat_activity;"

# 3. Check connection pool settings
# Verify HikariCP configuration in application.yml

# 4. Monitor logs for errors
docker compose logs backend | grep -i error
```

#### Problem: "Memory issues"
**Symptoms:**
- Out of memory errors
- Containers being killed
- Slow garbage collection

**Solutions:**
```bash
# 1. Increase memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G

# 2. Tune JVM settings
export JAVA_OPTS="-Xmx1g -Xms512m"

# 3. Monitor memory usage
docker stats --no-stream
```

### 🔍 Debugging Commands

#### Health Checks
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Database connectivity
docker compose exec postgres pg_isready -U postgres

# Redis connectivity
docker compose exec redis redis-cli ping

# Frontend accessibility
curl -I http://localhost:3000
```

#### Log Analysis
```bash
# Follow all logs
docker compose logs -f

# Backend logs only
docker compose logs -f backend

# Database logs
docker compose logs -f postgres

# Search for errors
docker compose logs backend | grep -i error
docker compose logs frontend | grep -i error
```

#### Network Debugging
```bash
# Test internal connectivity
docker compose exec backend curl http://postgres:5432
docker compose exec backend curl http://redis:6379

# Check port bindings
docker compose port backend 8080
docker compose port frontend 3000
```

### 🆘 Getting Help

If you're still experiencing issues:

1. **Check the logs**: `docker compose logs`
2. **Verify environment variables**: `docker compose config`
3. **Test individual services**: Start services one by one
4. **Check GitHub issues**: Search for similar problems
5. **Create a new issue**: Provide logs and environment details

### 📝 Issue Template

When reporting issues, include:

```markdown
**Environment:**
- OS: [e.g., macOS 12.0, Ubuntu 20.04]
- Docker version: [e.g., 20.10.8]
- Browser: [e.g., Chrome 95, Firefox 94]

**Steps to reproduce:**
1. 
2. 
3. 

**Expected behavior:**
[What should happen]

**Actual behavior:**
[What actually happens]

**Logs:**
```
[Paste relevant logs here]
```

**Additional context:**
[Any other relevant information]
```

---

*For more help, check the [Operations Guide](OPERATIONS.md) or open an issue on GitHub.*
