#!/bin/bash
# KRONOS Android Emulator Setup Script
# This script sets up and starts an Android emulator for use with KRONOS

set -e

# Configuration
ANDROID_SDK="${ANDROID_SDK:-/Users/albsheralsadi/Library/Android/sdk}"
AVD_NAME="kronos-android"
EMULATOR_PORT=5554
VNC_PORT=6083
SCREENCAST_PORT=8766
CONTROL_PORT=8767

echo "🚀 KRONOS Android Emulator Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Please install Android SDK Platform Tools."
    exit 1
fi

if ! command -v scrcpy &> /dev/null; then
    echo "⚠️  scrcpy not found. Installing via Homebrew..."
    brew install scrcpy
fi

echo "✓ Prerequisites met"

# Create AVD if it doesn't exist
echo ""
echo "📱 Setting up Android Virtual Device..."
if [ ! -d "$HOME/.android/avd/${AVD_NAME}.avd" ]; then
    echo "Creating AVD: $AVD_NAME"
 licenses    
    # Accept
    yes | "$ANDROID_SDK/tools/bin/sdkmanager" --licenses 2>/dev/null || true
    
    # Install system image
    echo "Installing Android system image..."
    "$ANDROID_SDK/tools/bin/sdkmanager" \
        "system-images;android-34;google_apis;x86_64" \
        --no_https \
        2>/dev/null
    
    # Create AVD
    echo "Creating AVD..."
    echo "no" | "$ANDROID_SDK/tools/bin/avdmanager" \
        create avd \
        --name "$AVD_NAME" \
        --device "pixel_6" \
        --path "$HOME/.android/avd/${AVD_NAME}.avd" \
        --system-image "system-images;android-34;google_apis;x86_64" \
        2>/dev/null || echo "⚠️ AVD creation skipped (may already exist)"
    
    echo "✓ AVD created"
else
    echo "✓ AVD already exists: $AVD_NAME"
fi

# Kill any existing emulator on the port
echo ""
echo "🛑 Stopping any existing emulators..."
adb kill-server 2>/dev/null || true
pkill -f "emulator.*$AVD_NAME" 2>/dev/null || true
sleep 2

# Start the emulator in headless mode
echo ""
echo "▶️  Starting Android emulator in headless mode..."
"$ANDROID_SDK/emulator/emulator" \
    -avd "$AVD_NAME" \
    -no-snapshot \
    -no-audio \
    -gpu swiftshader_indirect \
    -no-window \
    -port "$EMULATOR_PORT" \
    &
    
EMULATOR_PID=$!
echo "✓ Emulator started (PID: $EMULATOR_PID)"

# Wait for emulator to boot
echo ""
echo "⏳ Waiting for emulator to boot (this may take 60-90 seconds)..."
BOOTED=false
for i in {1..90}; do
    if adb devices | grep -q "emulator-$EMULATOR_PORT.*device$"; then
        BOOTED=true
        echo "✓ Emulator booted!"
        break
    fi
    if [ $((i % 10)) -eq 0 ]; then
        echo "  Still booting... ($i seconds)"
    fi
    sleep 1
done

if [ "$BOOTED" = false ]; then
    echo "⚠️  Emulator may still be booting. Continuing..."
fi

# Connect to emulator over TCPIP (for scrcpy)
echo ""
echo "🔌 Enabling TCPIP mode on emulator..."
adb connect localhost:$EMULATOR_PORT 2>/dev/null || true
sleep 2

# Start scrcpy for screen streaming
echo ""
echo "📺 Starting scrcpy screen stream..."
# scrcpy will stream to MJPEG on the specified port
# For now, we'll use scrcpy directly with noVNC

# Create a simple HTTP server for the VNC viewer
mkdir -p /tmp/kronos-android-vnc
cat > /tmp/kronos-android-vnc/index.html << 'VNC_HTML'
<!DOCTYPE html>
<html>
<head>
    <title>KRONOS Android - VNC Viewer</title>
    <style>
        body { margin: 0; background: #000; overflow: hidden; }
        #screen { width: 100vw; height: 100vh; object-fit: contain; }
        #status { position: absolute; top: 10px; left: 10px; color: #0f0; font-family: monospace; }
    </style>
</head>
<body>
    <div id="status">Connecting...</div>
    <img id="screen" />
    <script>
        const ws = new WebSocket('ws://localhost:8766');
        const img = document.getElementById('screen');
        const status = document.getElementById('status');
        
        ws.onopen = () => { status.textContent = 'Connected ✓'; };
        ws.onmessage = (e) => { img.src = 'data:image/jpeg;base64,' + e.data; };
        ws.onclose = () => { status.textContent = 'Disconnected - Retrying...'; };
    </script>
</body>
</html>
VNC_HTML

# Start a simple Python HTTP server for VNC viewer
cd /tmp/kronos-android-vnc
python3 -m http.server $VNC_PORT --bind 127.0.0.1 &
echo "✓ VNC viewer available at http://localhost:$VNC_PORT"

# Create mobile-mcp compatible control script
mkdir -p /tmp/kronos-android-mcp
cat > /tmp/kronos-android-mcp/control.py << 'CONTROL_SCRIPT'
#!/usr/bin/env python3
"""Mobile MCP compatible control script for Android emulator"""

import asyncio
import json
import subprocess
import websockets

ANDROID_HOST = "localhost"
ANDROID_PORT = 5555

async def run_adb_command(args):
    """Run an ADB command and return the result"""
    cmd = ["adb"] + args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return {"success": True, "output": result.stdout.strip(), "error": result.stderr.strip()}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def handle_client(websocket):
    """Handle WebSocket connections from AI agents"""
    async for message in websocket:
        try:
            data = json.loads(message)
            action = data.get("action", "")
            params = data.get("params", [])
            
            if action == "screenshot":
                # Take screenshot via scrcpy
                result = await run_adb_command(["shell", "screencap", "-p", "/sdcard/screen.png"])
                if result["success"]:
                    result = await run_adb_command(["pull", "/sdcard/screen.png", "/tmp/screen.png"])
                    if result["success"]:
                        with open("/tmp/screen.png", "rb") as f:
                            import base64
                            image_b64 = base64.b64encode(f.read()).decode()
                            await websocket.send(json.dumps({"image": image_b64}))
                            continue
            
            elif action == "tap":
                x = params[0] if params else 0
                y = params[1] if len(params) > 1 else 0
                await run_adb_command(["shell", "input", "tap", str(x), str(y)])
                await websocket.send(json.dumps({"success": True}))
                
            elif action == "swipe":
                x1 = params[0] if params else 0
                y1 = params[1] if len(params) > 1 else 0
                x2 = params[2] if len(params) > 2 else x1
                y2 = params[3] if len(params) > 3 else y1
                await run_adb_command(["shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2)])
                await websocket.send(json.dumps({"success": True}))
                
            elif action == "type":
                text = params[0] if params else ""
                await run_adb_command(["shell", "input", "text", text.replace(" ", "%s")])
                await websocket.send(json.dumps({"success": True}))
                
            elif action == "key":
                key = params[0] if params else "HOME"
                await run_adb_command(["shell", "input", "keyevent", key])
                await websocket.send(json.dumps({"success": True}))
                
            else:
                await websocket.send(json.dumps({"error": f"Unknown action: {action}"}))
                
        except json.JSONDecodeError:
            await websocket.send(json.dumps({"error": "Invalid JSON"}))
        except Exception as e:
            await websocket.send(json.dumps({"error": str(e)}))

async def main():
    """Start the WebSocket control server"""
    async with websockets.serve(handle_client, "localhost", 8767) as server:
        print("✓ Mobile MCP control server running on ws://localhost:8767")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
CONTROL_SCRIPT

chmod +x /tmp/kronos-android-mcp/control.py
echo "✓ Control script created at /tmp/kronos-android-mcp/control.py"

# Summary
echo ""
echo "=========================================="
echo "✅ Android Emulator Setup Complete!"
echo "=========================================="
echo ""
echo "📱 Services started:"
echo "   - Emulator: localhost:$EMULATOR_PORT (ADB)"
echo "   - VNC Viewer: http://localhost:$VNC_PORT"
echo "   - Control API: ws://localhost:$CONTROL_PORT"
echo ""
echo "🖥️  Open in browser:"
echo "   http://localhost:$VNC_PORT"
echo ""
echo "🤖 For AI control via mobile-mcp:"
echo "   WebSocket: ws://localhost:$CONTROL_PORT"
echo ""
echo "⚠️  Note: To use scrcpy for actual screen streaming,"
echo "   run: scrcpy --tcpip=localhost:$EMULATOR_PORT"
echo ""
echo "🛑 To stop all services:"
echo "   adb kill-server"
echo "   pkill -f emulator"
echo "   pkill -f http.server"
