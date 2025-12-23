#!/bin/bash

# Postiz API Wrapper Setup Script

set -e

echo "🚀 Setting up Postiz API Wrapper..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if ! [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please upgrade to Node.js $REQUIRED_VERSION or higher."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running the application."
else
    echo "📝 .env file already exists."
fi

# Create logs directory
mkdir -p logs

echo "🔨 Building the application..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Edit .env file with your Postiz API configuration"
echo "2. Start the development server: npm run dev"
echo "3. Visit API documentation at: http://localhost:3001/api-docs"
echo ""
echo "📖 For more information, see README.md"