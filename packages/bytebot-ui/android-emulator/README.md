# KRONOS-OS Android Emulator

This directory contains the Android emulator setup for KRONOS-OS, enabling AI agents to control an Android device via mobile-mcp.

## Overview

The system uses **budtmo/docker-android** - a well-maintained Docker image that provides:
- Full Android emulator (Android 13)
- noVNC web interface for viewing
- ADB access for device control
- HTTP API for automation
- WebSocket support for real-time communication

## Quick Start

### Prerequisites

1. **Docker & Docker Compose** installed
2. **KVM support** enabled (required for Android emulation)
3. At least **4GB RAM** available

### Starting the Emulator

```bash
cd android-emulator

# Start the emulator (builds images if needed)
./start.sh

# Or rebuild images first
./start.sh --build
```

### Checking Status

```bash
./start.sh --status
```

### Stopping the Emulator

```bash
./start.sh --stop
```

## Access Points

Once running, the following services are available:

| Service | URL | Description |
|---------|-----|-------------|
| **VNC Web** | http://localhost:6083 | View and interact with Android screen |
| **HTTP API** | http://localhost:8000 | REST API for automation |
| **WebSocket** | ws://localhost:8001 | Real-time communication |
| **ADB** | localhost:5555 | Android Debug Bridge |
| **MCP Server** | localhost:3001 | Model Context Protocol for agents |

## Agent Integration

### MCP Tools Available

The mobile-mcp server provides these tools for AI agents:

- `android_take_screenshot` - Capture screen
- `android_tap` - Tap at coordinates (x, y)
- `android_type` - Type text input
- `android_swipe` - Swipe in direction
- `android_press_button` - Press hardware button
- `android_install_app` - Install APK
- `android_open_app` - Launch app by package name
- `android_get_screen_size` - Get screen dimensions
- `android_list_apps` - List installed apps

### Example Usage

```typescript
// Agent can call these tools:
await mcp.callTool("android_tap", { x: 500, y: 800 });
await mcp.callTool("android_type", { text: "Hello Android!" });
await mcp.callTool("android_swipe", { direction: "up" });
await mcp.callTool("android_open_app", { packageName: "com.android.settings" });
```

## Connecting to the Emulator

### From Host Machine

```bash
# Connect ADB
adb connect localhost:5555

# List devices
adb devices

# Install APK
adb install app.apk

# Take screenshot
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

### From Other Containers

```bash
# The mobile-mcp container connects automatically
adb connect android-emulator:5555
```

## Environment Variables

### Android Emulator Container

| Variable | Default | Description |
|----------|---------|-------------|
| `DEVICE` | `emulator_only` | Device type |
| `ANDROID_VERSION` | `13` | Android version |
| `SCREEN_WIDTH` | `1920` | Screen width |
| `SCREEN_HEIGHT` | `1080` | Screen height |
| `SCREEN_DENSITY` | `420` | Screen density (DPI) |
| `WEBRTC` | `1` | Enable WebRTC for VNC |
| `AUTO_START_EMULATOR` | `true` | Auto-start emulator |
| `DISABLE_AUDIO` | `true` | Disable audio output |

### Mobile-MCP Container

| Variable | Default | Description |
|----------|---------|-------------|
| `ADB_HOST` | `android-emulator` | ADB connection host |
| `ADB_PORT` | `5555` | ADB connection port |

## Troubleshooting

### KVM Not Found

```
ERROR: KVM is not supported on this machine
```

**Fix:** Enable virtualization in BIOS and ensure Docker has access to `/dev/kvm`.

### Emulator Won't Start

```bash
# Check logs
./start.sh --logs android-emulator

# Common issues:
# - Not enough RAM (needs 4GB+)
# - KVM not enabled
# - Port already in use
```

### ADB Not Connecting

```bash
# Check if emulator is running
./start.sh --status

# Connect manually
./start.sh --connect

# Restart ADB server
adb kill-server
adb start-server
```

### VNC Not Loading

```bash
# Check if noVNC service is running
curl http://localhost:6083

# View emulator logs
./start.sh --logs android-emulator
```

## File Structure

```
android-emulator/
├── docker-compose.yml      # Main Docker Compose configuration
├── start.sh               # Startup/management script
├── mobile-mcp/            # MCP server for agent control
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts       # MCP server implementation
└── README.md              # This file
```

## Security Notes

- The emulator runs with privileged access (required for KVM)
- ADB is exposed on port 5555 - only expose to trusted networks
- VNC access has no authentication by default
- For production, add authentication and TLS encryption

## Performance Tips

1. Allocate at least 4GB RAM to Docker
2. Use SSD storage for emulator images
3. Disable audio (`DISABLE_AUDIO=true`) to reduce resource usage
4. Adjust screen resolution if needed for better performance

## References

- **budtmo/docker-android**: https://github.com/budtmo/docker-android
- **Android Emulator**: https://developer.android.com/studio/run/emulator
- **ADB**: https://developer.android.com/studio/command-line/adb
- **noVNC**: https://github.com/novnc/noVNC

---

**KRONOS-OS** - AI-Powered Desktop Automation Platform
