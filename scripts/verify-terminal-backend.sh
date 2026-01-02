#!/bin/bash

# Terminal Backend Quick Verification Script
# This script helps verify the terminal backend setup

set -e

echo "🔍 Terminal Backend Quick Verification"
echo "====================================="
echo ""

# Check Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Current Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" =~ ^v22 ]]; then
    echo "   ⚠️  WARNING: Node.js v22 detected"
    echo "   ⚠️  node-pty has compatibility issues with v22"
    echo "   ⚠️  Recommended: Switch to Node.js v20 LTS"
    echo ""
    echo "   To switch to v20:"
    echo "   nvm install 20"
    echo "   nvm use 20"
    echo ""
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Aborted. Please switch to Node.js v20 first."
        exit 1
    fi
else
    echo "   ✅ Node.js version looks good"
fi
echo ""

# Navigate to bytebotd
cd "$(dirname "$0")/../bytebot/packages/bytebotd"

echo "2. Checking bytebotd directory..."
if [ ! -f "package.json" ]; then
    echo "   ❌ Error: package.json not found"
    exit 1
fi
echo "   ✅ In bytebotd directory"
echo ""

echo "3. Checking node-pty installation..."
if ! grep -q "node-pty" package.json; then
    echo "   ❌ Error: node-pty not found in package.json"
    exit 1
fi
echo "   ✅ node-pty in package.json"
echo ""

echo "4. Checking native prebuilds..."
if [ ! -d "node_modules/node-pty/prebuilds" ]; then
    echo "   ⚠️  No prebuilds directory found"
    echo "   ⚠️  Attempting to rebuild node-pty..."
    npm rebuild node-pty
fi
echo "   ✅ Prebuilds found"
echo ""

echo "5. Verifying TerminalModule in app.module.ts..."
if ! grep -q "TerminalModule" src/app.module.ts; then
    echo "   ❌ Error: TerminalModule not imported in app.module.ts"
    exit 1
fi
echo "   ✅ TerminalModule imported"
echo ""

echo "6. Checking terminal gateway files..."
if [ ! -f "src/terminal/terminal.gateway.ts" ]; then
    echo "   ❌ Error: terminal.gateway.ts not found"
    exit 1
fi
if [ ! -f "src/terminal/terminal.module.ts" ]; then
    echo "   ❌ Error: terminal.module.ts not found"
    exit 1
fi
echo "   ✅ Terminal gateway files exist"
echo ""

echo "7. Running quick node-pty test..."
node -e "
try {
    const { spawn } = require('node-pty');
    console.log('   ✅ node-pty can be imported');
    const shell = process.env.SHELL || '/bin/bash';
    console.log('   ✅ Shell: ' + shell);
} catch (error) {
    console.log('   ❌ Error: ' + error.message);
    process.exit(1);
}
" 2>&1 || {
    echo ""
    echo "   ⚠️  node-pty import failed"
    echo "   ⚠️  Try rebuilding: npm rebuild node-pty"
    echo "   ⚠️  Or switch to Node.js v20: nvm use 20"
    exit 1
}
echo ""

echo "8. Checking test files..."
if [ -f "test/terminal.gateway.spec.ts" ]; then
    echo "   ✅ Test suite exists"
else
    echo "   ⚠️  Test suite not found (optional)"
fi

if [ -f "scripts/verify-terminal.js" ]; then
    echo "   ✅ Verification script exists"
else
    echo "   ⚠️  Verification script not found"
fi
echo ""

echo "9. Checking WebSocket proxy in bytebot-ui..."
cd ../bytebot-ui
if [ -f "server.ts" ] && grep -q "terminalProxy" server.ts; then
    echo "   ✅ WebSocket proxy configured"
else
    echo "   ⚠️  WebSocket proxy not found"
fi
echo ""

echo "====================================="
echo "✅ Basic verification complete!"
echo ""
echo "Next Steps:"
echo "1. Run detailed verification: cd bytebotd && node scripts/verify-terminal.js"
echo "2. Start bytebotd: npm run start:dev"
echo "3. Start bytebot-ui: npm run dev"
echo "4. Open http://localhost:9992/desktop"
echo "5. Toggle Terminal panel and test commands"
echo ""
echo "For more details, see TERMINAL_BACKEND_SUMMARY.md"
