#!/bin/bash

# Open-Interface Integration Setup Script
# This script helps set up the Open-Interface integration for Bytebot

set -e

echo "🚀 Open-Interface Integration Setup"
echo "===================================="

# Check if we're in the right directory
if [ ! -d "bytebot-desktop-container" ]; then
    echo "❌ Error: Please run this script from the future-app directory"
    exit 1
fi

# Check if Open-Interface exists
if [ ! -d "Open-Interface" ]; then
    echo "❌ Error: Open-Interface directory not found at ../Open-Interface"
    echo "Please clone the Open-Interface repository:"
    echo "git clone https://github.com/AmberSahdev/Open-Interface.git Open-Interface"
    exit 1
fi

echo "✅ Found Open-Interface directory"

# Check Python installation
echo ""
echo "🔍 Checking Python installation..."

if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "✅ Found python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "✅ Found python"
else
    echo "❌ Error: Python not found. Please install Python 3.8+"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | grep -oP '\d+\.\d+')
if [[ $(echo "$PYTHON_VERSION < 3.8" | bc -l) -eq 1 ]]; then
    echo "❌ Error: Python $PYTHON_VERSION found, but 3.8+ is required"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION is compatible"

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."

cd Open-Interface

if [ -f "requirements.txt" ]; then
    echo "Installing requirements.txt..."
    $PYTHON_CMD -m pip install -r requirements.txt
    echo "✅ Python dependencies installed"
else
    echo "⚠️  requirements.txt not found, installing basic dependencies..."
    $PYTHON_CMD -m pip install flask flask-cors pillow opencv-python pyautogui
fi

# Check if installation was successful
echo ""
echo "🔍 Verifying Python environment..."
$PYTHON_CMD -c "
import flask
import PIL
import cv2
import pyautogui
print('✅ All required packages are available')
"

cd ..

# Check API key
echo ""
echo "🔑 Checking API configuration..."

if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Warning: No API key found in environment variables"
    echo ""
    echo "Please set one of the following environment variables:"
    echo "export OPENAI_API_KEY='your-openai-key'"
    echo "export GEMINI_API_KEY='your-gemini-key'"
    echo ""
    echo "Or configure it later in the Bytebot settings UI"
else
    echo "✅ API key found in environment"
fi

# Create config directory
echo ""
echo "📁 Setting up configuration..."

mkdir -p config

if [ ! -f "config/open-interface-settings.json" ]; then
    cat > config/open-interface-settings.json << 'EOF'
{
  "model": "gpt-4o",
  "base_url": "https://api.openai.com/v1",
  "theme": "superhero",
  "default_browser": "Safari",
  "play_ding_on_completion": true,
  "temperature": 0.1,
  "max_tokens": 1000,
  "screenshot_quality": 85,
  "screenshot_format": "png",
  "enable_voice_input": false,
  "screenshot_before_actions": true,
  "action_confirmation": false,
  "debug_mode": false
}
EOF
    echo "✅ Created default settings file"
else
    echo "✅ Settings file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set your API key:"
echo "   export OPENAI_API_KEY='your-key-here'"
echo ""
echo "2. Start Bytebot:"
echo "   cd bytebot-desktop-container"
echo "   npm run dev"
echo ""
echo "3. Select 'Open-Interface AI Controller' from the screen controller dropdown"
echo "4. Configure your API key in the settings"
echo ""
echo "📖 For more information, see:"
echo "   bytebot-desktop-container/packages/bytebotd/src/screen-controllers/open-interface/INTEGRATION_GUIDE.md"