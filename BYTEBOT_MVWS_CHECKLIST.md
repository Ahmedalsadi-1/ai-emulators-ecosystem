# Bytebot/Kronos Minimum Viable Working System (MVWS) Checklist

## Overview
This checklist defines the minimum requirements and verification steps to achieve a working Bytebot/Kronos system. Items are prioritized by phase and criticality.

---

## Phase 1: Foundation (Core Services)

### 1.1 Prerequisites
- [ ] **Node.js 20+** installed
  ```bash
  node --version  # Verify v20.x
  ```
- [ ] **npm** or **pnpm** package manager
- [ ] **Docker** and **Docker Compose** v2
- [ ] **PostgreSQL** client tools (optional, for debugging)

### 1.2 Environment Setup
- [ ] Clone the repository
  ```bash
  cd /Users/albsheralsadi/future-app
  ```
- [ ] Create required secrets directory
  ```bash
  mkdir -p ./secrets
  ```
- [ ] Create secret files (minimum required)
  ```bash
  echo "secure_password" > ./secrets/postgres_password.txt
  echo "your_jwt_secret" > ./secrets/jwt_secret.txt
  echo "sk-ant-api03-..." > ./secrets/anthropic_api_key.txt
  ```
- [ ] Configure environment files
  ```bash
  cp bytebot/packages/bytebot-agent/.env.example bytebot/packages/bytebot-agent/.env
  cp bytebot/packages/bytebotd/.env.example bytebot/packages/bytebotd/.env
  cp bytebot/packages/bytebot-ui/.env.example bytebot/packages/bytebot-ui/.env
  ```

### 1.3 Build Shared Package (CRITICAL - Build Order)
```bash
cd bytebot/packages/shared
npm install
npm run build
```
- [ ] Verify build success: `dist/` directory exists
- [ ] Verify `package.json` has correct version

### 1.4 Build Core Services
```bash
# In parallel or sequential order (shared must be built first)
cd bytebot/packages/bytebotd && npm install && npm run build
cd bytebot/packages/bytebot-agent && npm install && npm run build
cd bytebot/packages/bytebot-ui && npm install && npm run build
```
- [ ] bytebotd build success
- [ ] bytebot-agent build success
- [ ] bytebot-ui build success

---

## Phase 2: Database Setup

### 2.1 Start PostgreSQL
```bash
# Option A: Using Docker Compose
docker-compose -f docker-compose.bytebot-kali.yml up -d postgres

# Option B: Using ecosystem compose
docker-compose -f docker-compose.ecosystem.yml up -d postgres
```
- [ ] Verify PostgreSQL is healthy
  ```bash
  docker exec -it kali-docker-postgres-1 pg_isready -U bytebot
  ```

### 2.2 Run Migrations
```bash
cd bytebot/packages/bytebot-agent
npm run prisma:dev
```
- [ ] Migrations applied successfully
- [ ] Prisma client generated

---

## Phase 3: Service Startup

### 3.1 Start bytebotd (Desktop Automation)
```bash
cd bytebot/packages/bytebotd
npm run start:dev
```
- [ ] Service starts on port 9990
- [ ] Health endpoint responds: `curl http://localhost:9990/health`
- [ ] VNC server initializes (check logs for "noVNC" or "X11")

### 3.2 Start bytebot-agent (Task Management)
```bash
cd bytebot/packages/bytebot-agent
npm run start:dev
```
- [ ] Service starts on port 9991
- [ ] Health endpoint responds: `curl http://localhost:9991/health`
- [ ] Database connection established
- [ ] Models endpoint accessible: `curl http://localhost:9991/tasks/models`

### 3.3 Start bytebot-ui (Frontend)
```bash
cd bytebot/packages/bytebot-ui
npm run dev
```
- [ ] Service starts on port 9992
- [ ] UI accessible: http://localhost:9992
- [ ] API proxy working: `curl http://localhost:9992/api` → bytebot-agent:9991

### 3.4 Verify Desktop Container (VNC)
```bash
# Using Docker Compose
docker-compose -f bytebot-desktop-container/docker-compose.yml up -d
```
- [ ] bytebotd API accessible: http://localhost:9990
- [ ] noVNC web interface: http://localhost:6080
- [ ] Direct VNC: `vnc://localhost:5900`

---

## Phase 4: Verification Tests

### 4.1 Core Functionality Tests
```bash
# Test 1: bytebotd health
curl -s http://localhost:9990/health | jq .

# Test 2: bytebot-agent health
curl -s http://localhost:9991/health | jq .

# Test 3: bytebot-agent models endpoint
curl -s http://localhost:9991/tasks/models | jq '. | length'  # Should return > 0 models

# Test 4: bytebot-ui health
curl -s http://localhost:9992/api/health | jq .
```

### 4.2 Desktop Automation Tests
```bash
# Test screenshot capability
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "screenshot"}' | jq '.success'

# Test cursor position
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "cursor_position"}' | jq '.coordinates'

# Test mouse move
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "move_mouse", "coordinates": {"x": 100, "y": 100}}' | jq '.success'
```

### 4.3 Task Management Tests
```bash
# Create a task
curl -X POST http://localhost:9991/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "MVWS verification"}' | jq '.id'

# List tasks
curl -s "http://localhost:9991/tasks?limit=5" | jq '.tasks | length'

# Get task details
curl -s http://localhost:9991/tasks/{task_id} | jq '.status'
```

### 4.4 VNC Access Test
- [ ] Access http://localhost:6080 in browser
- [ ] Connection established
- [ ] Can see desktop environment
- [ ] Keyboard/mouse interaction works

---

## Phase 5: Controller Integration

### 5.1 TuriX (Optional for MVWS)
```bash
# Launch TuriX app
open -a "TuriX" /Users/albsheralsadi/future-app/TuriX
```
- [ ] TuriX application launches
- [ ] Service registry initializes
- [ ] Bytebot service registered

### 5.2 AIOS (Optional for MVWS)
```bash
# Start AIOS (if needed)
cd AIOS && npm start
```
- [ ] AIOS accessible on port 8010
- [ ] MCP server available on port 8011

### 5.3 Open-Interface (Optional for MVWS)
```bash
# Start Open-Interface (if needed)
cd Open-Interface && python main.py
```
- [ ] Open-Interface accessible on port 5000
- [ ] Execute endpoint responds

---

## Phase 6: Docker Compose Verification

### 6.1 Full Stack with Docker
```bash
# Using Kali configuration (includes bytebot + VNC)
docker-compose -f docker-compose.bytebot-kali.yml up -d

# Wait for services
sleep 60

# Check all containers
docker-compose -f docker-compose.bytebot-kali.yml ps
```

### 6.2 Expected Container Status
| Container | Status | Health |
|-----------|--------|--------|
| postgres | running | healthy |
| redis | running | healthy |
| bytebot-desktop | running | healthy |
| bytebot-agent | running | healthy |
| bytebot-ui | running | healthy |
| kali-desktop | running | (if enabled) |

### 6.3 Docker Network Verification
```bash
docker network ls | grep -E 'automation|database'

# Check network connectivity
docker exec bytebot-agent ping -c 1 bytebot-desktop
docker exec bytebot-agent ping -c 1 postgres
```

---

## Phase 7: Production Readiness (Optional)

### 7.1 Security Checks
- [ ] Authentication enabled (`BYTEBOT_AUTH_ENABLED=true`)
- [ ] CORS origins restricted to production domains
- [ ] API keys stored in secrets, not env files
- [ ] Rate limiting configured

### 7.2 Monitoring Setup
```bash
# Start monitoring stack
docker-compose -f docker-compose.ecosystem.yml up -d prometheus grafana
```
- [ ] Prometheus accessible: http://localhost:9090
- [ ] Grafana accessible: http://localhost:3020
- [ ] Dashboards configured

### 7.3 Performance Verification
```bash
# Check response times
time curl -s http://localhost:9991/tasks/models > /dev/null
time curl -s http://localhost:9990/health > /dev/null

# Target: < 500ms for all endpoints
```

---

## Quick Start Commands Summary

### Development (Local)
```bash
# 1. Build shared
cd bytebot/packages/shared && npm run build

# 2. Start services in separate terminals
cd bytebot/packages/bytebotd && npm run start:dev
cd bytebot/packages/bytebot-agent && npm run start:dev
cd bytebot/packages/bytebot-ui && npm run dev

# 3. Verify
curl http://localhost:9990/health
curl http://localhost:9991/tasks/models
curl http://localhost:9992
```

### Docker (Full Stack)
```bash
# With Kali Linux desktop
docker-compose -f docker-compose.bytebot-kali.yml up -d

# Wait 60 seconds, then verify
docker-compose -f docker-compose.bytebot-kali.yml ps
curl http://localhost:9990/health
curl http://localhost:9991/tasks/models
curl http://localhost:9992
```

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Port already in use | Stop conflicting service or change port in .env |
| Database connection failed | Verify PostgreSQL is running and URL is correct |
| VNC not connecting | Check DISPLAY environment variable |
| Models endpoint 500 | Check LLM API keys are set |
| CORS errors | Add origin to CORS_ORIGINS env var |
| Shared package not found | Build shared package first |

---

## Minimum Success Criteria

A system is considered "Minimum Viable Working" when:

1. ✅ All 3 core services start without errors
2. ✅ bytebotd health endpoint responds (9990)
3. ✅ bytebot-agent health endpoint responds (9991)
4. ✅ bytebot-agent /tasks/models returns model list
5. ✅ bytebot-ui accessible in browser (9992)
6. ✅ VNC web interface accessible (6080)
7. ✅ Desktop automation (screenshot, mouse move) works

**Time to MVWS (estimated):** 15-30 minutes with pre-configured environment
