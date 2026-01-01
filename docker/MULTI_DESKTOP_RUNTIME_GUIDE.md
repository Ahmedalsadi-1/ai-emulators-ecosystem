# Bytebot Multi-Desktop Runtime Configuration Guide

## Overview
This document describes the correct runtime configuration for Kali and Debian VNC desktops in the Bytebot ecosystem.

## Architecture Summary

### Port Allocation
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| **bytebot-desktop** | 9990 | WebSocket | bytebotd/websockify for Bytebot desktop |
| **bytebot-desktop-debian** | 9995 | WebSocket | bytebotd/websockify for Debian desktop |
| **bytebot-desktop-kali** | 9993 | WebSocket | bytebotd/websockify for Kali desktop |
| **browseros-desktop** | 9994 | WebSocket | noVNC/websockify for BrowserOS desktop |
| **bytebot-agent** | 9991 | HTTP | AI agent API |
| **bytebot-ui** | 9992 | HTTP | Next.js UI |
| **postgres** | 5432 | TCP | PostgreSQL database |

### Proxy Routes
The UI server (`bytebot-ui/server.ts`) handles VNC proxying:

- **`/api/proxy/websockify`** → `ws://host.docker.internal:9990/websockify` (Bytebot)
- **`/api/proxy/debian-websockify`** → `ws://host.docker.internal:9995/websockify` (Debian)
- **`/api/proxy/kali-websockify`** → `ws://host.docker.internal:9993/websockify` (Kali)
- **`/api/proxy/browseros-websockify`** → `ws://host.docker.internal:9994/websockify` (BrowserOS)

### Environment Variables
```bash
# Bytebot Desktop
BYTEBOT_DESKTOP_VNC_URL=ws://host.docker.internal:9990/websockify

# Debian Desktop
DEBIAN_DESKTOP_VNC_URL=ws://host.docker.internal:9995/websockify

# Kali Desktop  
BYTEBOT_DESKTOP_KALI_VNC_URL=ws://host.docker.internal:9993/websockify

# BrowserOS Desktop
BROWSEROS_DESKTOP_VNC_URL=ws://host.docker.internal:9994/websockify
NEXT_PUBLIC_BROWSEROS_WEBSOCKIFY_PATH=/api/proxy/browseros-websockify

# Agent
BYTEBOT_AGENT_BASE_URL=http://bytebot-agent:9991
```

## Deployment Approaches

### ✅ Option A: Dockerized Only (Recommended)

**All services run in Docker containers:**
- Same desktop image used for both Debian and Kali: `ghcr.io/bytebot-ai/bytebot-desktop:edge`
- Configuration via environment variables and port mappings
- No local service spawning
- Consistent across development and production

**Benefits:**
- ✅ Consistent environment
- ✅ Easy cleanup (`docker-compose down`)
- ✅ No port conflicts with local services
- ✅ Production-ready

### ❌ Option B: DMG App with Service Spawning (Not Supported)

The current architecture does **NOT** support:
- Desktop app (DMG) that spawns services
- Local binary installations
- Mixed Docker + local services

## Startup Sequence

### 1. Prerequisites Check
```bash
# Check for port conflicts
./bytebot/docker/start-bytebot-multi-desktop.sh

# Or manually check ports
lsof -i :9990  # Should be free
lsof -i :9993  # Should be free
lsof -i :9991  # Should be free
lsof -i :9992  # Should be free
```

### 2. Start Services
```bash
# Use the automated startup script
cd bytebot/docker
./start-bytebot-multi-desktop.sh

# OR manually with Docker Compose
docker-compose -f docker-compose.full.yml up -d
```

To start the Dockerized UI explicitly (optional):
```bash
./start-bytebot-multi-desktop.sh --with-ui
# or
docker compose -f docker-compose.full.yml --profile ui up -d bytebot-ui
```

#### Fresh Images (Recommended if you suspect stale containers)
```bash
# Pull latest images and recreate containers
cd bytebot/docker
./start-bytebot-multi-desktop.sh --fresh
```

### 3. Startup Order (Automatic with Health Checks)
1. **PostgreSQL** (independent, ~5s startup)
2. **Desktop Containers** (Bytebot + Debian + Kali + BrowserOS, ~30s startup each)
3. **Bytebot Agent** (~10s startup)
4. **Bytebot UI** (~5s startup, optional when using local UI)

### 4. Verify Services
```bash
# Check container status
docker-compose -f docker-compose.full.yml ps

# Test endpoints
curl http://localhost:9990  # Bytebot VNC
curl http://localhost:9995  # Debian VNC
curl http://localhost:9993  # Kali VNC
curl http://localhost:9994  # BrowserOS VNC
curl http://localhost:9992  # UI
curl http://localhost:9991/health  # Agent
```

## Port Conflict Prevention

### Common Conflict Scenarios

1. **Running Multiple Compose Files**
   ```bash
   # ❌ WRONG - Don't run both
   docker-compose -f docker-compose.full.yml up -d
   docker-compose -f docker-compose.yml up -d  # Conflicts!
   ```

2. **Local bytebotd Running**
   ```bash
   # ❌ WRONG - Local process conflicts with Docker
   cd bytebot/packages/bytebotd && npm run start:dev
   # And also running Docker containers on same ports
   ```

3. **Leftover Containers**
   ```bash
   # ❌ WRONG - Previous run still using ports
   docker ps  # Shows old containers
   ```

### Prevention Strategies

1. **Health Checks**
   All compose files now include health checks:
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:9990/health"]
     interval: 30s
     timeout: 10s
     retries: 3
     start_period: 40s
   ```

2. **Proper Dependencies**
   ```yaml
   depends_on:
     bytebot-desktop-debian:
       condition: service_healthy
   ```

3. **Port Conflict Detection**
   The startup script checks all required ports before starting.

4. **Fresh Image Startup**
   Use `./start-bytebot-multi-desktop.sh --fresh` to pull the latest images and
   recreate containers when updates are not reflected.

## Files Modified

### 1. `docker-compose.full.yml`
- ✅ Added health checks to desktop containers
- ✅ Updated depends_on to use health check conditions

### 2. `docker-compose.yml`
- ✅ Added health check to bytebot-desktop

### 3. `docker-compose.development.yml`
- ✅ Added health check to bytebot-desktop

### 4. `start-bytebot-multi-desktop.sh` (NEW)
- ✅ Port conflict detection
- ✅ Sequential startup with verification
- ✅ Health check validation
- ✅ Colored output for easy reading

## Troubleshooting

### EADDRINUSE Errors

**Symptom:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:9990: bind: address already in use
```

**Solution:**
```bash
# Find and stop conflicting process
lsof -i :9990
kill <PID>

# Or stop all Docker containers first
docker-compose -f docker-compose.full.yml down

# Then restart
docker-compose -f docker-compose.full.yml up -d
```

### Desktop Containers Not Starting

**Symptom:**
```
Container keeps restarting or not reaching healthy state
```

**Solution:**
```bash
# Check logs
docker-compose -f docker-compose.full.yml logs bytebot-desktop-debian

# Check resource usage
docker stats

# Increase shared memory if needed (already set to 2g)
```

### VNC Connection Failures

**Symptom:**
```
VNC connection timeout - unable to reach websockify server
```

**Solution:**
```bash
# Verify container is running
docker ps | grep desktop

# Check websockify is running in container
docker exec bytebot-desktop-debian ps aux | grep websockify

# Test internal connectivity
docker exec bytebot-desktop-debian curl http://localhost:9990
```

## Access Points

After successful startup:

| Service | URL | Description |
|---------|-----|-------------|
| **UI** | http://localhost:9992 | Next.js dashboard |
| **Bytebot VNC** | http://localhost:9990/vnc.html | noVNC interface for Bytebot |
| **Debian VNC** | http://localhost:9995/vnc.html | noVNC interface for Debian |
| **Kali VNC** | http://localhost:9993/vnc.html | noVNC interface for Kali |
| **BrowserOS VNC** | http://localhost:9994/vnc.html | noVNC interface for BrowserOS |
| **Agent API** | http://localhost:9991 | REST API |

## Maintenance Commands

```bash
# View all logs
docker-compose -f docker-compose.full.yml logs -f

# Restart specific service
docker-compose -f docker-compose.full.yml restart bytebot-desktop-debian

# Update and restart
docker-compose -f docker-compose.full.yml pull
docker-compose -f docker-compose.full.yml up -d

# Full cleanup
docker-compose -f docker-compose.full.yml down -v
```

## Security Notes

- ⚠️ CORS is currently open (`origin: '*'`) - restrict in production
- ⚠️ No authentication on VNC endpoints - consider adding for production
- ⚠️ No rate limiting - vulnerable to DoS attacks
- ✅ Health checks added for better reliability
- ✅ Port conflict prevention implemented

---

**Last Updated:** December 29, 2025
**Maintained By:** Agent D - Runtime Specialist
