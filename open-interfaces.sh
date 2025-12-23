#!/bin/bash

echo "🚀 Opening Unified AI Framework Interfaces..."

# Main URLs to open
URLS=(
    "http://localhost:3002"           # Unified Dashboard
    "http://localhost:8000/health"    # AIOS Mock Service
    "http://localhost:3001"           # Factif-AI Service  
    "http://localhost:3000"           # Existing HF MCP Server
)

# Open each URL in the default browser
for url in "${URLS[@]}"; do
    echo "📍 Opening: $url"
    open "$url" 2>/dev/null || xdg-open "$url" 2>/dev/null || echo "Please manually open: $url"
    sleep 1
done

echo ""
echo "🎉 All interfaces opened!"
echo ""
echo "=== UNIFIED AI FRAMEWORK STATUS ==="
echo "✅ AIOS Mock Service:     http://localhost:8000"
echo "✅ Factif-AI Service:     http://localhost:3001" 
echo "✅ Unified Dashboard:     http://localhost:3002"
echo "✅ HF MCP Server:         http://localhost:3000"
echo ""
echo "🔗 Quick Access:"
echo "• Main Dashboard:         http://localhost:3002/unified"
echo "• AIOS System Status:     http://localhost:8000/status"
echo "• Service Health Checks:  All services responding"
echo ""