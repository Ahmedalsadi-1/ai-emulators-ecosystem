# Real Services Status

## Current System Status (as of Tue Dec 30 20:29 CST 2025)

### ✅ Local Development Services (ALL HEALTHY)

| Service | Port | Status | Health Check |
|---------|------|--------|--------------|
| **bytebotd** | 9990 | RUNNING | `GET /health` → `{"status":"ok"}` |
| **bytebot-agent** | 9991 | RUNNING | `GET /` → HTTP 200, 75 models |
| **bytebot-ui** | 9992 | RUNNING | `GET /` → HTTP 200 |
| **bytebot-desktop** (Docker) | 6080 | NOT RUNNING | Container not started |
| **kali-desktop** (Docker) | 6084 | CHECK TIMEOUT | Docker may need restart |

### Verified Endpoints

**bytebotd (Port 9990)**
- `GET /health` → `{"status":"ok","service":"bytebotd","timestamp":"..."}`
- `GET /` → HTTP 404 (expected, no root route)
- `/websockify` → WebSocket proxy for VNC (requires Docker)

**bytebot-agent (Port 9991)**
- `GET /` → HTTP 200 (connectivity OK)
- `GET /tasks/models` → 75 models from 6 providers:
  - Anthropic (2), Google (2), Groq (23), Routeway (26), Ollama Local (22), OpenCode Local (1)

**bytebot-ui (Port 9992)**
- `GET /` → HTTP 200 (Next.js serving)

### Docker Containers
```bash
# To start VNC services:
docker-compose -f docker-compose.bytebot-kali.yml up -d kali-desktop
docker-compose -f docker-compose.bytebot-kali.yml up -d bytebot-desktop
```

## Files Created/Updated

| File | Purpose |
|------|---------|
| `LOCAL_DEV_STARTUP_SEQUENCE.md` | Complete startup sequence, health checks, diagnosis tree |
| `health-check-local.sh` | Quick health verification script (executable) |

## Quick Commands

```bash
# Health check
./health-check-local.sh

# Kill all local services
kill -9 $(lsof -ti :9990) $(lsof -ti :9991) $(lsof -ti :9992)

# Rebuild shared package (required before others)
cd bytebot/packages/shared && npm run build

# Start services (order matters)
cd ../bytebotd && npm run start:dev     # Port 9990
cd ../bytebot-agent && npm run start:dev # Port 9991
cd ../bytebot-ui && npm run dev          # Port 9992
```

## Notes

- Models API endpoint is `/tasks/models` (NOT `/api/tasks/models`)
- bytebotd has dedicated `/health` endpoint
- VNC access via WebSocket at `ws://localhost:9990/websockify`
- Docker containers (6080, 6084) are optional for VNC features
