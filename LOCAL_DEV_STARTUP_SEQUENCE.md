# Local Dev Startup Sequence & Health Verification

## Port Map

| Port | Service | Protocol | Status | Health Check |
|------|---------|----------|--------|--------------|
| **9990** | bytebotd | HTTP/WS | ✅ Running | `GET /health` |
| **9991** | bytebot-agent | HTTP | ✅ Running | `GET /` (200 = ok) |
| **9992** | bytebot-ui | HTTP | ✅ Running | `GET /` (200 = ok) |
| **6080** | bytebot-desktop | HTTP/WS | ❌ Not running | Docker container |
| **6084** | kali-desktop | HTTP/WS | ✅ Running | Docker container |

---

## 1. Golden Path Startup Sequence

### Phase 1: Prerequisites (Run Once)

```bash
# Verify no conflicting processes
lsof -i -P -n | grep -E "(9990|9991|9992|6080|6084)"

# Kill any zombie processes
kill -9 $(lsof -t -i:9990) 2>/dev/null || true
kill -9 $(lsof -t -i:9991) 2>/dev/null || true
kill -9 $(lsof -t -i:9992) 2>/dev/null || true
```

### Phase 2: Build Shared Package (Critical Dependency)

```bash
cd /Users/albsheralsadi/future-app/bytebot/packages/shared
npm run build
```

**Verification:**
```bash
ls -la dist/  # Should show compiled .js files
```

### Phase 3: Start Backend Services (Order Matters!)

#### Step 3a: Start bytebotd (Port 9990)
```bash
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebotd
npm run start:dev
```

**Verification:**
```bash
# Must return JSON with status: "ok"
curl -s http://localhost:9990/health
# Expected: {"status":"ok","service":"bytebotd","timestamp":"..."}

# Check VNC proxy endpoint exists
curl -s -o /dev/null -w "%{http_code}" http://localhost:9990/websockify
# Expected: 200 or 101 (WebSocket upgrade)
```

#### Step 3b: Start bytebot-agent (Port 9991)
```bash/albsherals
cd /Usersadi/future-app/bytebot/packages/bytebot-agent
npm run start:dev
```

**Verification:**
```bash
# Root should return 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:9991/
# Expected: 200

# Models API should return JSON array
curl -s http://localhost:9991/tasks/models | head -c 100
# Expected: JSON array of model objects
```

### Phase 4: Start Frontend (Port 9992)

```bash
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebot-ui
npm run dev
```

**Verification:**
```bash
# Root should return 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:9992/
# Expected: 200

# Check Next.js is serving
curl -s http://localhost:9992/ | grep -o "next" || echo "Next.js not detected"
```

### Phase 5: Start Docker Services (Optional - for VNC)

```bash
# Start Kali desktop only (if bytebot-desktop not needed)
docker-compose -f docker-compose.bytebot-kali.yml up -d kali-desktop

# OR start bytebot-desktop only
docker-compose -f docker-compose.bytebot-kali.yml up -d bytebot-desktop
```

**Verification:**
```bash
# Check containers running
docker ps --format "{{.Names}}\t{{.Status}}" | grep -E "(kali|bytebot)"

# Test noVNC access (Kali)
curl -s -o /dev/null -w "%{http_code}" http://localhost:6084/
# Expected: 200

# Test noVNC access (Bytebot Desktop)
curl -s -o /dev/null -w "%{http_code}" http://localhost:6080/
# Expected: 200
```

---

## 2. Health Check Commands

### Quick Health Check (Single Command)
```bash
echo "=== Service Health Check ===" && \
echo "bytebotd (9990):   $(curl -s -o /dev/null -w '%{http_code}' http://localhost:9990/health 2>/dev/null || echo 'FAIL')" && \
echo "bytebot-agent (9991): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:9991/ 2>/dev/null || echo 'FAIL')" && \
echo "bytebot-ui (9992):   $(curl -s -o /dev/null -w '%{http_code}' http://localhost:9992/ 2>/dev/null || echo 'FAIL')" && \
echo "Kali VNC (6084):      $(curl -s -o /dev/null -w '%{http_code}' http://localhost:6084/ 2>/dev/null || echo 'FAIL')" && \
echo "Bytebot VNC (6080):   $(curl -s -o /dev/null -w '%{http_code}' http://localhost:6080/ 2>/dev/null || echo 'FAIL')"
```

### Detailed Health Checks

#### bytebotd (Port 9990)
```bash
# Health check
curl -s http://localhost:9990/health | jq .

# VNC proxy test (requires Docker running)
curl -s -o /dev/null -w '%{http_code}' http://localhost:9990/websockify
```

#### bytebot-agent (Port 9991)
```bash
# Basic connectivity
curl -s http://localhost:9991/

# Models API (returns available AI models)
curl -s http://localhost:9991/tasks/models | jq '. | length'  # Count models
curl -s http://localhost:9991/tasks/models | jq '.[0].name'   # First model name
```

#### bytebot-ui (Port 9992)
```bash
# Basic connectivity
curl -s http://localhost:9992/ | head -c 500

# Check for static assets
curl -s -o /dev/null -w '%{http_code}' http://localhost:9992/_next/static/css/app/layout.css
```

#### Docker VNC Services
```bash
# Kali noVNC
curl -s -o /dev/null -w '%{http_code}' http://localhost:6084/
curl -s http://localhost:6084/ | grep -o "noVNC" && echo "Kali noVNC OK"

# Bytebot Desktop noVNC
curl -s -o /dev/null -w '%{http_code}' http://localhost:6080/
curl -s http://localhost:6080/ | grep -o "noVNC" && echo "Bytebot Desktop noVNC OK"
```

---

## 3. Diagnosis Tree

### Problem: "Failed to fetch" in browser but curl works

```
IF browser shows "Failed to fetch"
├── Check 1: Is the service actually running?
│   └── curl -v http://localhost:{port}/
│       └── IF curl fails: Service not running → Start service
├── Check 2: CORS issues?
│   └── curl -I http://localhost:{port}/ | grep -i access-control
│       └── IF missing: Add CORS headers to service
├── Check 3: Service on wrong interface?
│   └── lsof -i :{port} | grep LISTEN
│       └── IF bound to 127.0.0.1 only: Check host binding config
└── Check 4: Browser cache/corruption?
    └── Hard refresh: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows)
```

### Problem: VNC blank screen

```
IF VNC shows blank/black screen
├── Check 1: Is Docker container running?
│   └── docker ps | grep bytebot-desktop
│       └── IF not running: docker-compose up bytebot-desktop
├── Check 2: Is noVNC serving?
│   └── curl http://localhost:6080/ | grep noVNC
│       └── IF 404: Container started but noVNC not ready → wait 10s
├── Check 3: Is Xvnc running inside container?
│   └── docker exec bytebot-desktop ps aux | grep Xvnc
│       └── IF missing: Container may have failed → docker logs bytebot-desktop
├── Check 4: WebSocket proxy failing?
│   └── curl -s -o /dev/null -w '%{http_code}' http://localhost:9990/websockify
│       └── IF error: bytebotd not proxying → Check bytebotd logs
└── Check 5: Wrong VNC URL in UI?
    └── Verify UI uses: ws://localhost:9990/websockify (NOT /novnc directly)
```

### Problem: EADDRINUSE (Port already in use)

```
IF Error: EADDRINUSE
├── Find process on port
│   └── lsof -i :{port}
├── Get PID from output
│   └── Example: node      4458 ... *:9991 (LISTEN)
├── Check if process is zombie/hung
│   └── ps aux | grep {PID}
├── IF safe to kill:
│   └── kill -9 {PID}
└── IF process won't die:
    └── sudo lsof -i :{port}  # Check for root-owned process
```

### Problem: ECONNREFUSED (Connection refused)

```
IF Error: ECONNREFUSED
├── Check service is running
│   └── ps aux | grep -E "(bytebot|nest|next)" | grep -v grep
├── Check correct port
│   └── lsof -i -P -n | grep LISTEN | grep {port}
├── Check firewall/antivirus
│   └── sudo /usr/libexec/ApplicationFirewall/socketfilterfw --get globalstate  # macOS
└── Check localhost resolution
    └── curl -v http://127.0.0.1:{port}/
```

### Problem: ECONNRESET (Connection reset by peer)

```
IF Error: ECONNRESET
├── Service crashed during request
│   └── Check service logs for errors
├── Keep-alive issues
│   └── curl --no-keepalive http://localhost:{port}/
└── Proxy issues
    └── Check upstream services are healthy
```

---

## 4. Recovery Steps for Common Failures

### Recovery 1: Port Conflict (EADDRINUSE)

```bash
# Step 1: Identify conflicting process
echo "=== Port Conflict Detection ==="
for port in 9990 9991 9992 6080 6084; do
    conflict=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$conflict" ]; then
        echo "Port $port in use by PID: $conflict"
        echo "  Process: $(ps -p $conflict -o comm= 2>/dev/null || echo 'unknown')"
    else
        echo "Port $port: FREE"
    fi
done

# Step 2: Kill conflicting process
kill -9 $(lsof -ti :9990) 2>/dev/null || echo "No process on 9990"
kill -9 $(lsof -ti :9991) 2>/dev/null || echo "No process on 9991"
kill -9 $(lsof -ti :9992) 2>/dev/null || echo "No process on 9992"

# Step 3: Verify ports are free
lsof -i -P -n | grep -E "(9990|9991|9992)" | grep LISTEN
```

### Recovery 2: Service Won't Start

```bash
# Step 1: Clear any lock files
rm -f /Users/albsheralsadi/future-app/bytebot/packages/*/dist/*.lock 2>/dev/null

# Step 2: Rebuild shared package
cd /Users/albsheralsadi/future-app/bytebot/packages/shared
npm run clean && npm run build

# Step 3: Clear node_modules cache
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebotd
rm -rf node_modules/.cache
npm run build

# Step 4: Check for syntax errors
npm run build 2>&1 | grep -E "(ERROR|error:)" || echo "Build succeeded"
```

### Recovery 3: Docker Container Failed

```bash
# Step 1: Check container status
docker ps -a | grep -E "(kali|bytebot)"

# Step 2: Check logs
docker logs kali-desktop --tail 50
docker logs bytebot-desktop --tail 50

# Step 3: Rebuild container (if build failed)
docker-compose -f docker-compose.bytebot-kali.yml build --no-cache bytebot-desktop

# Step 4: Restart container
docker-compose -f docker-compose.bytebot-kali.yml up -d bytebot-desktop

# Step 5: Wait for health check
sleep 10
docker inspect --format='{{.State.Health.Status}}' bytebot-desktop
```

### Recovery 4: VNC Proxy Not Working

```bash
# Step 1: Check if bytebotd is running
curl -s http://localhost:9990/health || echo "bytebotd not responding"

# Step 2: Check if Docker container is running
docker ps | grep bytebot-desktop || echo "bytebot-desktop not running"

# Step 3: Check VNC proxy configuration
curl -s http://localhost:9990/websockify 2>&1 | head -5

# Step 4: Restart bytebotd
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebotd
# Stop current: Ctrl+C or kill
npm run start:dev

# Step 5: Test with WebSocket
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     http://localhost:9990/websockify 2>&1 | head -10
```

### Recovery 5: Full System Reset

```bash
#!/bin/bash
# Full system reset script

echo "=== Full System Reset ==="

# 1. Kill all local Node processes
echo "[1/6] Killing Node processes on ports 9990, 9991, 9992..."
for port in 9990 9991 9992; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null && echo "  Killed PID $pid on port $port" || true
    fi
done

# 2. Stop Docker containers
echo "[2/6] Stopping Docker containers..."
docker-compose -f docker-compose.bytebot-kali.yml down 2>/dev/null || true

# 3. Clear build artifacts
echo "[3/6] Clearing build artifacts..."
cd /Users/albsheralsadi/future-app/bytebot/packages
rm -rf shared/dist
rm -rf bytebotd/dist
rm -rf bytebot-agent/dist
rm -rf bytebotd/node_modules/.cache
rm -rf bytebot-agent/node_modules/.cache

# 4. Rebuild shared package
echo "[4/6] Rebuilding shared package..."
cd /Users/albsheralsadi/future-app/bytebot/packages/shared
npm run clean && npm run build && echo "  Shared package built successfully"

# 5. Rebuild bytebotd
echo "[5/6] Rebuilding bytebotd..."
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebotd
npm run build && echo "  bytebotd built successfully"

# 6. Verify ports
echo "[6/6] Verifying ports are free..."
for port in 9990 9991 9992 6080 6084; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "  WARNING: Port $port still in use"
    else
        echo "  Port $port: FREE"
    fi
done

echo "=== Reset Complete ==="
echo "Start services with:"
echo "  1. cd bytebot/packages/bytebotd && npm run start:dev"
echo "  2. cd bytebot/packages/bytebot-agent && npm run start:dev"
echo "  3. cd bytebot/packages/bytebot-ui && npm run dev"
```

---

## 5. Quick Reference

### Start All Services
```bash
# Terminal 1
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebotd && npm run start:dev

# Terminal 2
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebot-agent && npm run start:dev

# Terminal 3
cd /Users/albsheralsadi/future-app/bytebot/packages/bytebot-ui && npm run dev
```

### Access Points
| Service | URL | Purpose |
|---------|-----|---------|
| bytebot-ui | http://localhost:9992 | Main UI |
| bytebot-agent API | http://localhost:9991 | Agent API |
| bytebotd | http://localhost:9990 | Desktop controller |
| VNC Proxy | ws://localhost:9990/websockify | VNC WebSocket |
| Kali VNC | http://localhost:6084 | Kali desktop (if Docker running) |
| Bytebot VNC | http://localhost:6080 | Bytebot desktop (if Docker running) |

### Key Endpoints
| Endpoint | Service | Description |
|----------|---------|-------------|
| `GET /health` | bytebotd (9990) | Health check |
| `GET /tasks/models` | bytebot-agent (9991) | Available AI models |
| `GET /` | bytebot-agent (9991) | Root (200 = running) |
| `GET /vnc` | bytebotd (9990) | Redirect to noVNC |
| `ws://host:9990/websockify` | bytebotd (9990) | VNC WebSocket proxy |

### Troubleshooting Commands
```bash
# Check all relevant ports
lsof -i -P -n | grep -E "(9990|9991|9992|6080|6084)"

# Check running Node services
ps aux | grep -E "(node|nest)" | grep -v grep

# Check Docker containers
docker ps -a --format "{{.Names}}\t{{.Status}}"

# Quick health check
curl -s http://localhost:9990/health
curl -s http://localhost:9991/tasks/models | jq '. | length'
```
