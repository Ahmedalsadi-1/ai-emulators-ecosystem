#!/bin/bash

# Bytebot Multi-Desktop Startup Script
# Ensures proper startup sequence and port conflict prevention

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compose command selection (prefer v2 if available)
COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

# Configuration
COMPOSE_FILE="docker-compose.full.yml"
PROJECT_NAME="bytebot"
PORTS=(5432 9990 9991 9993 9994 9995)

FRESH_START=0
SKIP_PULL=0
START_UI=0
START_OS_AI=0

usage() {
    echo "Usage: $0 [--fresh] [--skip-pull] [--help]"
    echo ""
    echo "  --fresh       Stop existing containers, pull latest images, and recreate."
    echo "  --skip-pull   Skip pulling images (use local cache)."
    echo "  --with-ui     Start the dockerized bytebot-ui service (default: off)."
    echo "  --with-os-ai  Start the OS AI backend if available (default: off)."
    echo "  --help        Show this help message."
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --fresh)
            FRESH_START=1
            shift
            ;;
        --skip-pull)
            SKIP_PULL=1
            shift
            ;;
        --with-ui)
            START_UI=1
            shift
            ;;
        --with-os-ai)
            START_OS_AI=1
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown argument: $1"
            usage
            exit 1
            ;;
    esac
done

if [ $START_UI -eq 1 ]; then
    PORTS+=(9992)
fi
if [ $START_OS_AI -eq 1 ]; then
    PORTS+=(8765)
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Bytebot Multi-Desktop Startup Script              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1 || netstat -tuln | grep -q :$port 2>/dev/null; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to get process using port
get_port_process() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i :$port 2>/dev/null | grep -v COMMAND | awk '{print $2}' | head -1
    elif command -v netstat &> /dev/null; then
        netstat -tulpn 2>/dev/null | grep :$port | awk '{print $7}' | cut -d'/' -f1 | head -1
    fi
}

# Check for port conflicts
echo -e "${YELLOW}🔍 Checking for port conflicts...${NC}"
echo ""
PORT_CONFLICTS=0

for port in "${PORTS[@]}"; do
    if check_port $port; then
        pid=$(get_port_process $port)
        echo -e "${RED}❌ Port $port is in use (PID: $pid)${NC}"
        
        # Provide helpful information
        if [ -n "$pid" ]; then
            process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "Unknown")
            echo -e "${YELLOW}   Process: $process_name${NC}"
            
            # Check if it's a Docker process
            if docker ps -q --filter "ancestor=ghcr.io/bytebot-ai/bytebot" --format "{{.ID}}" | grep -q $pid 2>/dev/null; then
                echo -e "${YELLOW}   This appears to be a Bytebot Docker container. Stop it first with:${NC}"
                echo -e "${YELLOW}   $COMPOSE_CMD -f $COMPOSE_FILE down${NC}"
            fi
        fi
        PORT_CONFLICTS=$((PORT_CONFLICTS + 1))
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
done

echo ""

if [ $PORT_CONFLICTS -gt 0 ]; then
    echo -e "${RED}⚠️  Found $PORT_CONFLICTS port conflict(s)${NC}"
    echo -e "${YELLOW}Please stop the conflicting services before continuing.${NC}"
    echo ""
    echo "Common solutions:"
    echo "  1. Stop existing Docker containers: docker-compose -f $COMPOSE_FILE down"
    echo "  2. Kill process on port: kill \$(lsof -t -i:$PORT)"
    echo "  3. Use different ports by modifying the compose file"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ No port conflicts detected${NC}"
echo ""

# Check Docker daemon
echo -e "${YELLOW}🐳 Checking Docker daemon...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker daemon is running${NC}"
echo ""

if [ $FRESH_START -eq 1 ]; then
    echo -e "${YELLOW}Stopping existing containers (preserving volumes)...${NC}"
    $COMPOSE_CMD -f $COMPOSE_FILE down --remove-orphans
    echo ""
fi

# Pull latest images
if [ $SKIP_PULL -eq 0 ]; then
    echo -e "${YELLOW}Pulling latest images...${NC}"
    $COMPOSE_CMD -f $COMPOSE_FILE pull
    echo ""
else
    echo -e "${YELLOW}Skipping image pull (using local cache).${NC}"
    echo ""
fi

# Build BrowserOS image fresh when requested
if [ $FRESH_START -eq 1 ]; then
    echo -e "${YELLOW}Building BrowserOS desktop image (no cache)...${NC}"
    $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache browseros-desktop
    echo ""
fi

# Start services with proper health check dependencies
echo -e "${YELLOW}🚀 Starting Bytebot services...${NC}"
echo ""

UP_FLAGS="-d"
if [ $FRESH_START -eq 1 ]; then
    UP_FLAGS="-d --force-recreate"
fi

# Start postgres first (independent)
echo -e "${BLUE}   Starting PostgreSQL...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS postgres

# Wait for postgres to be healthy
echo -e "${BLUE}   Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Start desktop containers
echo -e "${BLUE}   Starting Bytebot desktop...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS bytebot-desktop

echo -e "${BLUE}   Starting Debian desktop...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS bytebot-desktop-debian

echo -e "${BLUE}   Starting Kali desktop...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS bytebot-desktop-kali

echo -e "${BLUE}   Starting BrowserOS desktop...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS browseros-desktop

# Wait for desktops to be healthy
echo -e "${BLUE}   Waiting for desktops to be ready...${NC}"
echo -e "${YELLOW}   (This may take up to 60 seconds)${NC}"
sleep 30

# Start agent
echo -e "${BLUE}   Starting Bytebot Agent...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS bytebot-agent

# Wait for agent to be healthy
echo -e "${BLUE}   Waiting for agent to be ready...${NC}"
sleep 10

# Start UI
if [ $START_UI -eq 1 ]; then
    echo -e "${BLUE}   Starting Bytebot UI...${NC}"
    $COMPOSE_CMD -f $COMPOSE_FILE --profile ui up $UP_FLAGS bytebot-ui
else
    echo -e "${YELLOW}   Skipping Bytebot UI container (using local UI)${NC}"
fi

if [ $START_OS_AI -eq 1 ]; then
    echo -e "${BLUE}   Starting OS AI backend...${NC}"
    ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
    OS_AI_DIR="${ROOT_DIR}/os-ai-computer-use"
    OS_AI_LOG="${OS_AI_DIR}/os-ai-backend.log"

    if [ ! -d "$OS_AI_DIR" ] || [ ! -f "${OS_AI_DIR}/main.py" ]; then
        echo -e "${YELLOW}⚠️  OS AI backend not found at ${OS_AI_DIR}${NC}"
    elif check_port 8765; then
        echo -e "${YELLOW}⚠️  OS AI backend already running on port 8765${NC}"
    else
        if [ -x "${OS_AI_DIR}/.venv/bin/python" ]; then
            PYTHON_BIN="${OS_AI_DIR}/.venv/bin/python"
        else
            PYTHON_BIN="$(command -v python3 || true)"
        fi

        if [ -z "$PYTHON_BIN" ]; then
            echo -e "${RED}❌ Python not found; cannot start OS AI backend${NC}"
        else
            (cd "$OS_AI_DIR" && nohup "$PYTHON_BIN" main.py > "$OS_AI_LOG" 2>&1 &)
            sleep 2
            if check_port 8765; then
                echo -e "${GREEN}✅ OS AI backend started (ws://127.0.0.1:8765/ws?token=secret)${NC}"
            else
                echo -e "${RED}❌ OS AI backend failed to start (see ${OS_AI_LOG})${NC}"
            fi
        fi
    fi
fi

echo ""
echo -e "${GREEN}✅ All services started${NC}"
echo ""

# Verify services
echo -e "${YELLOW}🔍 Verifying services...${NC}"
echo ""

# Check container statuses
echo "Container Status:"
$COMPOSE_CMD -f $COMPOSE_FILE ps
echo ""

# Test endpoints
echo "Endpoint Tests:"
echo ""

# Test Debian VNC
if curl -sf --max-time 5 "http://localhost:9990" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bytebot VNC (port 9990): Reachable${NC}"
else
    echo -e "${RED}❌ Bytebot VNC (port 9990): Not reachable${NC}"
fi

# Test Debian VNC
if curl -sf --max-time 5 "http://localhost:9995" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Debian VNC (port 9995): Reachable${NC}"
else
    echo -e "${RED}❌ Debian VNC (port 9995): Not reachable${NC}"
fi

# Test Kali VNC
if curl -sf --max-time 5 "http://localhost:9993" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kali VNC (port 9993): Reachable${NC}"
else
    echo -e "${RED}❌ Kali VNC (port 9993): Not reachable${NC}"
fi

# Test BrowserOS VNC
if curl -sf --max-time 5 "http://localhost:9994" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ BrowserOS VNC (port 9994): Reachable${NC}"
else
    echo -e "${RED}❌ BrowserOS VNC (port 9994): Not reachable${NC}"
fi

# Test UI
if [ $START_UI -eq 1 ]; then
    if curl -sf --max-time 5 "http://localhost:9992" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Bytebot UI (port 9992): Reachable${NC}"
    else
        echo -e "${RED}❌ Bytebot UI (port 9992): Not reachable${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Bytebot UI (port 9992): Skipped (local UI expected)${NC}"
fi

# Test Agent API
if curl -sf --max-time 5 "http://localhost:9991/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bytebot Agent (port 9991): Reachable${NC}"
else
    echo -e "${YELLOW}⚠️  Bytebot Agent (port 9991): Not responding to health check (may still be initializing)${NC}"
fi

if [ $START_OS_AI -eq 1 ]; then
    if check_port 8765; then
        echo -e "${GREEN}✅ OS AI backend (port 8765): Reachable${NC}"
    else
        echo -e "${RED}❌ OS AI backend (port 8765): Not reachable${NC}"
    fi
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Startup Complete!                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Access Points:"
echo "  🌐 UI:           http://localhost:9992 (local)"
echo "  🖥️  Bytebot VNC: http://localhost:9990/vnc.html"
echo "  🖥️  Debian VNC:  http://localhost:9995/vnc.html"
echo "  🔪 Kali VNC:     http://localhost:9993/vnc.html"
echo "  🌐 BrowserOS:    http://localhost:9994/vnc.html"
echo "  🤖 Agent API:    http://localhost:9991"
if [ $START_OS_AI -eq 1 ]; then
    echo "  🧠 OS AI WS:     ws://127.0.0.1:8765/ws?token=secret"
fi
echo ""
echo "Useful Commands:"
echo "  View logs:       $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
echo "  Stop services:   $COMPOSE_CMD -f $COMPOSE_FILE down"
echo "  Restart:         $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "  Fresh start:     $0 --fresh"
echo ""
