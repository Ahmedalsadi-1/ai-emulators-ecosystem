#!/bin/bash
# Local Dev Health Check Script for Bytebot
# Quick health verification for local development

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== Bytebot Local Dev Health Check ==="
echo "Timestamp: $(date)"
echo ""

# Check ports
echo "=== Port Status ==="
for port in 9990 9991 9992; do
    if lsof -i :$port >/dev/null 2>&1; then
        status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:$port/ 2>/dev/null || echo "000")
        if [ "$status" = "200" ] || [ "$status" = "404" ]; then
            echo -e "${GREEN}✓${NC} Port $port: LISTENING (HTTP $status)"
        else
            echo -e "${YELLOW}○${NC} Port $port: LISTENING (HTTP $status - unexpected)"
        fi
    else
        echo -e "${RED}✗${NC} Port $port: NOT LISTENING"
    fi
done

echo ""
echo "=== Service Health ==="

# bytebotd health
echo -n "bytebotd (9990): "
if curl -s --connect-timeout 2 http://localhost:9990/health 2>/dev/null | grep -q '"status":"ok"'; then
    echo -e "${GREEN}HEALTHY${NC}"
else
    echo -e "${RED}UNHEALTHY${NC} (health check failed)"
fi

# bytebot-agent
echo -n "bytebot-agent (9991): "
agent_status=$(curl -s --connect-timeout 2 http://localhost:9991/ 2>/dev/null)
if [ -n "$agent_status" ]; then
    echo -e "${GREEN}HEALTHY${NC}"
else
    echo -e "${RED}UNHEALTHY${NC}"
fi

# bytebot-agent models
echo -n "  └─ Models API: "
model_count=$(curl -s --connect-timeout 5 http://localhost:9991/tasks/models 2>/dev/null | grep -o '"provider"' | wc -l || echo "0")
if [ "$model_count" -gt 0 ]; then
    echo -e "${GREEN}$model_count models available${NC}"
else
    echo -e "${RED}Failed to fetch models${NC}"
fi

# bytebot-ui
echo -n "bytebot-ui (9992): "
if curl -s --connect-timeout 2 http://localhost:9992/ 2>/dev/null | grep -qi "html\|next\|react"; then
    echo -e "${GREEN}HEALTHY${NC}"
else
    echo -e "${YELLOW}Respond but may not be UI${NC}"
fi

echo ""
echo "=== Docker Containers ==="
if command -v docker &> /dev/null; then
    for container in bytebot-desktop kali-desktop; do
        if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^${container}$"; then
            echo -e "${GREEN}✓${NC} $container: RUNNING"
        else
            if docker ps -a --format "{{.Names}}" 2>/dev/null | grep -q "^${container}$"; then
                echo -e "${YELLOW}○${NC} $container: STOPPED"
            else
                echo -e "${GRAY}○${NC} $container: NOT FOUND"
            fi
        fi
    done
else
    echo "Docker not available"
fi

echo ""
echo "=== Quick Commands ==="
echo "  Restart bytebotd:      cd bytebot/packages/bytebotd && npm run start:dev"
echo "  Restart bytebot-agent: cd bytebot/packages/bytebot-agent && npm run start:dev"
echo "  Restart bytebot-ui:    cd bytebot/packages/bytebot-ui && npm run dev"
echo "  Full reset:            ./health-check.sh --reset"
echo ""
