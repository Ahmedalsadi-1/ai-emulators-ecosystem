# KRONOS-OS Android Control - Multi-Mode Setup

**Complete Android automation infrastructure supporting three connection methods:**

| Mode | Description | Best For |
|------|-------------|----------|
| **Docker** | Full Android in container | Linux servers with KVM |
| **Studio** | Android Studio AVD | Local development |
| **Physical** | Real Android device | Testing on real hardware |

---

## Quick Start

```bash
cd android-emulator

# Interactive mode selection
./start.sh

# Or use specific mode
./start.sh --docker --build   # Build & start Docker emulator
./start.sh --studio           # Connect Android Studio AVD
./start.sh --physical 192.168.1.100  # Connect physical device
./start.sh --status           # Check all connections
./start.sh --help             # Show help
```

---

## Option 1: Docker Emulator (Linux with KVM)

### Prerequisites
- Linux host with KVM enabled
- Docker with KVM passthrough
- 4GB+ RAM available

### Setup

```bash
# Add KVM device to Docker
docker run --device /dev/kvm:/dev/kvm ...

# Or in docker-compose (already configured)
devices:
  - /dev/kvm:/dev/kvm
```

### Start

```bash
./start.sh --docker --build
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| VNC | http://localhost:6083 | View Android screen |
| HTTP API | http://localhost:8000/status | REST API |
| ADB | localhost:5555 | Android Debug Bridge |
| MCP | localhost:3001 | MCP Server |

### Troubleshooting

```bash
# Check KVM
ls -la /dev/kvm

# If KVM missing
sudo modprobe kvm_intel  # or kvm_amd

# Check emulator logs
./start.sh --logs android-emulator
```

---

## Option 2: Android Studio AVD (Local)

### Prerequisites
- Android Studio installed
- AVD created in Android Studio
- OR `emulator` command available in PATH

### Setup AVD (if needed)

1. Open Android Studio
2. Tools → AVD Manager
3. Create Virtual Device (Pixel 5 recommended)
4. Start the AVD

### Connect

```bash
# Option A: Auto-detect and connect
./start.sh --studio

# Option B: Manual
adb devices  # Check if AVD is running
emulator -avd <avd_name> -no-window  # Start AVD
```

### Working with AVD

```bash
# List available AVDs
emulator -list-avds

# Start specific AVD
emulator -avd Pixel_5_API_33 -no-window

# Check boot status
adb shell getprop sys.boot_completed

# Take screenshot
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png

# Install APK
adb install app.apk

# Record screen
adb shell screenrecord /sdcard/video.mp4
adb pull /sdcard/video.mp4
```

---

## Option 3: Physical Device (Real Android)

### Prerequisites
- Android device (phone/tablet)
- USB debugging enabled
- Developer options unlocked

### Enable USB Debugging

1. Settings → About Phone → Tap "Build Number" 7 times
2. Settings → System → Developer Options
3. Enable "USB Debugging"
4. Enable "Install via USB" (for APK installation)

### Connect via USB

```bash
# Connect device via USB
./start.sh --status

# Authorize on device (if prompted)
adb devices
# Should show: <serial>    device
```

### Connect via WiFi

```bash
# First connect via USB
adb tcpip 5555

# Get device IP
adb shell ip route | awk '{print $9}'

# Disconnect USB and connect via WiFi
adb connect <device-ip>:5555

# Example
adb connect 192.168.1.100:5555
./start.sh --physical 192.168.1.100
```

### Environment Variables

```bash
# Set device IP
export ANDROID_DEVICE_IP=192.168.1.100
export ANDROID_DEVICE_PORT=5555

# Then connect
./start.sh --physical
```

---

## MCP Tools Available

The mobile-mcp server provides these tools for AI agents:

### Basic Controls
- `android_tap` - Tap at coordinates (x, y)
- `android_swipe` - Swipe in direction
- `android_type` - Type text input
- `android_press_button` - Press hardware button

### Screen & Media
- `android_take_screenshot` - Save screenshot to file
- `android_screenshot_base64` - Return base64 image
- `android_get_screen_size` - Get screen dimensions

### App Management
- `android_install_app` - Install APK
- `android_uninstall_app` - Remove app
- `android_open_app` - Launch app by package
- `android_list_apps` - List installed apps

### Device Info
- `android_get_device_info` - Model, Android version
- `android_shell` - Execute shell command

### File Operations
- `android_pull` - Download file from device
- `android_push` - Upload file to device

### Clipboard
- `android_get_clipboard` - Read clipboard
- `android_set_clipboard` - Set clipboard text

### System
- `android_wake` - Wake device (turn on screen)

---

## Usage Examples

### Docker Mode

```bash
# Start Docker emulator
./start.sh --docker --build

# Install app
./start.sh --install app.apk

# View logs
./start.sh --logs android-emulator

# Stop
./start.sh --stop
```

### Studio Mode

```bash
# Start AVD (in another terminal)
emulator -avd Pixel_5_API_33 -no-window

# Connect
./start.sh --studio

# Verify
./start.sh --devices
```

### Physical Mode

```bash
# Connect by IP
./start.sh --physical 192.168.1.100:5555

# Or with environment
export ANDROID_DEVICE_IP=192.168.1.100
./start.sh --physical

# Check connection
./start.sh --devices
```

---

## File Structure

```
android-emulator/
├── docker-compose.yml      # Docker configuration
├── start.sh               # Multi-mode controller
├── connect-android.sh     # Connection helper script
├── mobile-mcp/            # MCP server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts       # MCP tools (v1.1.0)
└── README.md              # This file
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANDROID_MODE` | auto | Connection mode |
| `ADB_HOST` | localhost | ADB server host |
| `ADB_PORT` | 5555 | ADB server port |
| `ANDROID_DEVICE_IP` | - | Physical device IP |
| `ANDROID_DEVICE_PORT` | 5555 | Physical device port |
| `MCP_SERVER_NAME` | kronos-android | MCP server name |

### Docker Compose

The `docker-compose.yml` configures:
- `android-emulator` - budtmo/docker-android container
- `mobile-mcp` - MCP server for agent control

---

## Troubleshooting

### ADB Issues

```bash
# Restart ADB server
adb kill-server
adb start-server

# Check devices
adb devices

# USB authorization
adb revoke <device_serial>
adb reconnect
```

### Docker Issues

```bash
# Check Docker status
docker ps

# View logs
./start.sh --logs

# Restart containers
./start.sh --stop
./start.sh --docker --build
```

### Performance Issues

```bash
# Reduce AVD RAM usage
emulator -avd <name> -memory 2048 -no-window

# Or in Docker
environment:
  - MEMORY=2GB
```

---

## Security Notes

- ADB exposes device control - only connect trusted devices
- VNC has no authentication by default
- For production: add authentication and TLS
- Physical devices: revoke USB debugging when not in use

---

## References

- **budtmo/docker-android**: https://github.com/budtmo/docker-android
- **Android Studio AVD**: https://developer.android.com/studio/run/emulator
- **ADB**: https://developer.android.com/studio/command-line/adb
- **MCP SDK**: https://github.com/modelcontextprotocol/sdk

---

**KRONOS-OS** - AI-Powered Desktop Automation Platform
