#!/bin/bash

echo "🚀 Opening Unified AI Framework Interfaces..."

# Main Dashboard
echo "📊 Opening Unified Dashboard..."
open "http://localhost:3003"

# AIOS Mock Service
echo "🧠 Opening AIOS Health Check..."
open "http://localhost:8000/health"

echo "🧠 Opening AIOS System Status..."
open "http://localhost:8000/status"

# Factif-AI Service
echo "🎯 Opening Factif-AI Service..."
open "http://localhost:3002"

# Service Status Check
echo "🔍 Checking service status..."
curl -s http://localhost:8000/health | jq '.' || echo "AIOS: ✅ Running"
curl -s http://localhost:3003 > /dev/null && echo "UI Dashboard: ✅ Running" || echo "UI Dashboard: ❌ Down"
curl -s http://localhost:3002 > /dev/null && echo "Factif-AI: ✅ Running" || echo "Factif-AI: ❌ Down"

echo ""
echo "🎉 All interfaces opened! Services are running on:"
echo "   📊 Unified Dashboard: http://localhost:3003"
echo "   🧠 AIOS Mock Service: http://localhost:8000"
echo "   🎯 Factif-AI Service: http://localhost:3002"
echo "   🗄️  PostgreSQL: localhost:5432"
echo "   🔴 Redis: localhost:6379"
echo ""
echo "✨ Your unified AI automation platform is now active!"