#!/bin/bash

# AI Emulators Ecosystem Startup Script

echo "Starting AI Emulators Ecosystem..."

# 1. Databases
echo "Starting Databases..."
docker-compose -f docker-compose.ecosystem.yml up -d postgres redis

# 2. AIOS
echo "Starting AIOS..."
cd AIOS
nohup ./venv/bin/python3.11 -m uvicorn runtime.launch:app --host 0.0.0.0 --port 8000 > aios.log 2>&1 &
cd ..

# 3. ByteBot Agent
echo "Starting ByteBot Agent..."
cd bytebot/packages/bytebot-agent-cc
nohup npm run start:dev > bytebot-agent.log 2>&1 &
cd ../../..

# 4. Factif-AI Backend
echo "Starting Factif-AI Backend..."
cd factif-ai/backend
nohup npm run dev > backend.log 2>&1 &
cd ../..

echo "Ecosystem starting up. Use scripts/validate-env.sh to check status."
