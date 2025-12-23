#!/bin/bash

echo "🔍 Unified AI Framework Status Check"
echo "===================================="
echo ""

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    echo -n "🔍 $name ($url): "
    
    if curl -s --connect-timeout 3 "$url" > /dev/null 2>&1; then
        echo "✅ ONLINE"
        return 0
    else
        echo "❌ OFFLINE"
        return 1
    fi
}

# Function to check port
check_port() {
    local name=$1
    local port=$2
    
    echo -n "🔍 $name (port $port): "
    
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ LISTENING"
        return 0
    else
        echo "❌ NOT LISTENING"
        return 1
    fi
}

echo "📊 WEB SERVICES"
echo "---------------"
check_service "Unified Dashboard" "http://localhost:3003" 3003
check_service "AIOS Mock Service" "http://localhost:8000/health" 8000
check_service "Factif-AI Service" "http://localhost:3002" 3002

echo ""
echo "🗄️  INFRASTRUCTURE SERVICES"
echo "---------------------------"
check_port "PostgreSQL Database" 5432
check_port "Redis Cache" 6379

echo ""
echo "🐳 DOCKER CONTAINERS"
echo "--------------------"
docker compose -f docker-compose.simple.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "❌ Docker Compose not available"

echo ""
echo "🌐 AVAILABLE INTERFACES"
echo "----------------------"
echo "📊 Unified Dashboard: http://localhost:3003"
echo "🧠 AIOS Health Check: http://localhost:8000/health"
echo "🧠 AIOS System Status: http://localhost:8000/status"
echo "🧠 AIOS Agents List: http://localhost:8000/agents"
echo "🎯 Factif-AI Service: http://localhost:3002"
echo "🗄️  PostgreSQL: localhost:5432 (user: postgres, db: unified_framework)"
echo "🔴 Redis: localhost:6379"

echo ""
echo "🚀 QUICK ACTIONS"
echo "----------------"
echo "• Start all services: docker compose -f docker-compose.simple.yml up -d"
echo "• Stop all services: docker compose -f docker-compose.simple.yml down"
echo "• View logs: docker compose -f docker-compose.simple.yml logs [service-name]"
echo "• Open interfaces: ./open-unified-interfaces.sh"

echo ""
echo "✨ Status check complete!"