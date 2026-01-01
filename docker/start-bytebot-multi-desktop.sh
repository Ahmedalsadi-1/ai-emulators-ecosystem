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
PORTS=(5432 9990 9991 9992 9993)

FRESH_START=0
SKIP_PULL=0

usage() {
    echo "Usage: $0 [--fresh] [--skip-pull] [--help]"
    echo ""
    echo "  --fresh       Stop existing containers, pull latest images, and recreate."
    echo "  --skip-pull   Skip pulling images (use local cache)."
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
echo -e "${BLUE}   Starting Debian desktop...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS bytebot-desktop-debian

echo -e "${BLUE}   Starting Kali desktop...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS bytebot-desktop-kali

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
echo -e "${BLUE}   Starting Bytebot UI...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up $UP_FLAGS bytebot-ui

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
    echo -e "${GREEN}✅ Debian VNC (port 9990): Reachable${NC}"
else
    echo -e "${RED}❌ Debian VNC (port 9990): Not reachable${NC}"
fi

# Test Kali VNC
if curl -sf --max-time 5 "http://localhost:9993" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kali VNC (port 9993): Reachable${NC}"
else
    echo -e "${RED}❌ Kali VNC (port 9993): Not reachable${NC}"
fi

# Test UI
if curl -sf --max-time 5 "http://localhost:9992" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bytebot UI (port 9992): Reachable${NC}"
else
    echo -e "${RED}❌ Bytebot UI (port 9992): Not reachable${NC}"
fi

# Test Agent API
if curl -sf --max-time 5 "http://localhost:9991/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bytebot Agent (port 9991): Reachable${NC}"
else
    echo -e "${YELLOW}⚠️  Bytebot Agent (port 9991): Not responding to health check (may still be initializing)${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Startup Complete!                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Access Points:"
echo "  🌐 UI:           http://localhost:9992"
echo "  🖥️  Debian VNC:  http://localhost:9990/vnc.html"
echo "  🔪 Kali VNC:     http://localhost:9993/vnc.html"
echo "  🤖 Agent API:    http://localhost:9991"
echo ""
echo "Useful Commands:"
echo "  View logs:       $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
echo "  Stop services:   $COMPOSE_CMD -f $COMPOSE_FILE down"
echo "  Restart:         $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "  Fresh start:     $0 --fresh"
echo ""
