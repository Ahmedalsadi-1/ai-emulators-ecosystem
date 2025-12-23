#!/bin/bash

echo "Checking Environment Configuration..."

# Check API Keys
keys=("OPENAI_API_KEY" "ANTHROPIC_API_KEY" "GOOGLE_API_KEY")

for key in "${keys[@]}"; do
  if [ -z "${!key}" ]; then
    echo "⚠️  $key is not set in environment"
  else
    echo "✅ $key is set"
  fi
done

# Check Databases
echo "Checking Databases..."
if docker exec future-app-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
  echo "✅ PostgreSQL is running"
else
  echo "❌ PostgreSQL is NOT running"
fi

if redis-cli ping | grep PONG > /dev/null 2>&1; then
  echo "✅ Redis is running"
else
  echo "❌ Redis is NOT running"
fi

# Check Services
echo "Checking Services..."
services=("8000:AIOS" "8080:ByteBot Agent")

for s in "${services[@]}"; do
  port="${s%%:*}"
  name="${s#*:}"
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ $name is running on port $port"
  else
    echo "❌ $name is NOT running on port $port"
  fi
done
