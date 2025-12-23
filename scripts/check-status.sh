#!/bin/bash

# Quick Status Check Script for Unified Application Framework

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service URLs and ports (portable arrays for macOS bash 3.2)
SERVICE_NAMES=(
  "AIOS"
  "API_Gateway"
  "Factif_AI"
  "ByteBot_UI"
  "Prometheus"
  "Grafana"
  "MCP_Registry"
)
SERVICE_URLS=(
  "http://localhost:8000/health"
  "http://localhost:8080/health"
  "http://localhost:3001/api/health"
  "http://localhost:3000"
  "http://localhost:9090"
  "http://localhost:3020/api/health"
  "http://localhost:8012/health"
)

echo -e "${BLUE}=== Unified Application Framework Status Check ===${NC}"
echo

# Check each service
for idx in "${!SERVICE_NAMES[@]}"; do
  service="${SERVICE_NAMES[$idx]}"
  url="${SERVICE_URLS[$idx]}"

  if curl -s -f "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $service is ${GREEN}running${NC} ($url)"
  else
    echo -e "${RED}✗${NC} $service is ${RED}not responding${NC} ($url)"
  fi
done

echo
echo -e "${BLUE}=== Quick Access URLs ===${NC}"
echo "• Unified Dashboard: http://localhost:3000/unified"
echo "• API Gateway: http://localhost:8080"
echo "• API Docs: http://localhost:8080/api/docs"
echo "• Prometheus: http://localhost:9090"
echo "• Grafana: http://localhost:3020"
echo "• MCP Registry: http://localhost:8012"
echo

# Check Docker containers if Docker is available
if command -v docker &> /dev/null; then
    echo -e "${BLUE}=== Docker Containers ===${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(unified|bytebot|aios|factif)" || echo "No unified framework containers running"
    echo
fi

# Check processes
echo -e "${BLUE}=== Running Processes ===${NC}"
for port in 8000 8080 3000 3001 3020 8012 9991; do
    process=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$process" ]; then
        echo "Port $port: PID $process"
    fi
done
