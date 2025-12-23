#!/bin/bash

echo "🤖 Setting up Local AI Models for Unified Framework"
echo "=================================================="

# Function to check if a service is running
check_service() {
    local name=$1
    local port=$2
    
    echo -n "🔍 Checking $name (port $port): "
    
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ RUNNING"
        return 0
    else
        echo "❌ NOT RUNNING"
        return 1
    fi
}

echo ""
echo "📋 Checking Local AI Model Servers..."
echo "-------------------------------------"

# Check for Ollama
if check_service "Ollama" 11434; then
    echo "   📝 Ollama API: http://localhost:11434"
    echo "   🔧 Configure apps to use: OPENAI_API_BASE=http://localhost:11434/v1"
fi

# Check for LM Studio
if check_service "LM Studio" 1234; then
    echo "   📝 LM Studio API: http://localhost:1234"
    echo "   🔧 Configure apps to use: OPENAI_API_BASE=http://localhost:1234/v1"
fi

# Check for Jan.ai
if check_service "Jan.ai" 1337; then
    echo "   📝 Jan.ai API: http://localhost:1337"
    echo "   🔧 Configure apps to use: OPENAI_API_BASE=http://localhost:1337/v1"
fi

echo ""
echo "📁 Configuration Files Created:"
echo "------------------------------"
echo "✅ factif-ai/backend/.env"
echo "✅ AIOS/.env"
echo "✅ bytebot/packages/bytebot-agent/.env"
echo "✅ bytebot/packages/bytebot-ui/.env"
echo "✅ .env (updated)"

echo ""
echo "🚀 Quick Setup Instructions:"
echo "----------------------------"

echo ""
echo "1️⃣  Install Ollama (Recommended):"
echo "   • Download: https://ollama.ai/download"
echo "   • Install and run: ollama run llama3.1:8b"
echo "   • Verify: curl http://localhost:11434/api/tags"

echo ""
echo "2️⃣  Alternative: LM Studio:"
echo "   • Download: https://lmstudio.ai/"
echo "   • Load a model and start local server on port 1234"
echo "   • Enable API server in settings"

echo ""
echo "3️⃣  Alternative: Jan.ai:"
echo "   • Download: https://jan.ai/"
echo "   • Load a model and enable API server on port 1337"

echo ""
echo "🔧 Configuration Options:"
echo "------------------------"
echo "All apps are configured to use Ollama by default (localhost:11434)"
echo "To switch to LM Studio or Jan.ai, edit the .env files and uncomment the appropriate lines"

echo ""
echo "📝 Available Models (Ollama):"
echo "----------------------------"
if command -v ollama &> /dev/null; then
    echo "Installed models:"
    ollama list 2>/dev/null || echo "   Run 'ollama list' to see installed models"
    echo ""
    echo "Popular models to install:"
    echo "   • ollama run llama3.1:8b     (8B parameters, fast)"
    echo "   • ollama run llama3.1:70b    (70B parameters, more capable)"
    echo "   • ollama run codellama:13b   (Code-focused model)"
    echo "   • ollama run mistral:7b      (Alternative 7B model)"
else
    echo "   Ollama not installed. Install from https://ollama.ai/download"
fi

echo ""
echo "✨ Next Steps:"
echo "-------------"
echo "1. Start your preferred local AI server (Ollama, LM Studio, or Jan.ai)"
echo "2. Verify the server is running on the expected port"
echo "3. Start your applications - they will now use local models!"
echo "4. Test with: curl -X POST http://localhost:11434/v1/chat/completions \\"
echo "   -H 'Content-Type: application/json' \\"
echo "   -d '{\"model\":\"llama3.1:8b\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"

echo ""
echo "🎉 Local AI setup complete!"