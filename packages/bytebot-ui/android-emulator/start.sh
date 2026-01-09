#!/bin/bash
#
# KRONOS-OS Android Controller - Multi-Mode Startup Script
#
# Supports three Android control methods:
#   1. DOCKER   - budtmo/docker-android container (Linux with KVM)
#   2. STUDIO   - Android Studio AVD (local emulator)
#   3. PHYSICAL - Physical Android device via ADB TCPIP
#
# Usage:
#   ./start.sh                    # Interactive mode selection
#   ./start.sh --docker           # Start Docker emulator
#   ./start.sh --studio           # Connect Android Studio AVD
#   ./start.sh --physical [ip]    # Connect physical device
#   ./start.sh --status           # Check all connections
#   ./start.sh --stop             # Stop Docker containers
#   ./start.sh --help             # Show help
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
CONTAINER_PREFIX="kronos-"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()   { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success(){ echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()  { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()   { echo -e "${CYAN}[STEP]${NC} $1"; }

# Check if ADB is installed
check_adb() {
    if ! command -v adb &> /dev/null; then
        log_error "ADB not found. Install Android SDK or Android Studio."
        exit 1
    fi
    log_success "ADB: $(adb version | head -1)"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
}

# ============================================================
# MODE 1: Docker Android Emulator
# ============================================================
start_docker() {
    log_step "Starting Docker Android Emulator..."
    
    check_docker
    
    # Build if requested
    if [ "$1" = "--build" ]; then
        log_info "Building images..."
        docker compose -f "$COMPOSE_FILE" build --no-cache
    fi
    
    # Start services
    docker compose -f "$COMPOSE_FILE" up -d
    
    log_success "Docker emulator starting..."
    
    # Wait for readiness
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec kronos-android-emulator curl -s http://localhost:8000/status > /dev/null 2>&1; then
            log_success "Android emulator ready!"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        log_warn "Emulator may not be ready. Check: $0 --logs"
    fi
    
    # Connect ADB
    log_info "Connecting ADB..."
    adb connect localhost:5555
    
    echo ""
    log_success "Docker Android Emulator running!"
    echo "  VNC:      http://localhost:6083"
    echo "  HTTP API: http://localhost:8000"
    echo "  ADB:      localhost:5555"
    echo "  MCP:      localhost:3001"
}

stop_docker() {
    log_info "Stopping Docker Android..."
    cd "$SCRIPT_DIR"
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    log_success "Stopped"
}

# ============================================================
# MODE 2: Android Studio AVD
# ============================================================
start_studio_avd() {
    log_step "Connecting to Android Studio AVD..."
    
    check_adb
    
    # Check for running emulator
    RUNNING=$(adb devices | grep "emulator" | grep "device$" | head -1)
    
    if [ -n "$RUNNING" ]; then
        SERIAL=$(echo "$RUNNING" | awk '{print $1}')
        log_success "AVD already connected: $SERIAL"
    else
        # Try to start AVD if emulator command exists
        if command -v emulator &> /dev/null; then
            AVDS=$(emulator -list-avds 2>/dev/null || true)
            if [ -n "$AVDS" ]; then
                FIRST_AVD=$(echo "$AVDS" | head -1)
                log_info "Starting AVD: $FIRST_AVD"
                emulator -avd "$FIRST_AVD" -no-window &
                log_success "AVD started (waiting for boot...)"
                
                # Wait for boot
                for i in {1..60}; do
                    BOOTED=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
                    if [ "$BOOTED" = "1" ]; then
                        break
                    fi
                    sleep 2
                done
            else
                log_warn "No AVDs found. Create one in Android Studio."
            fi
        else
            log_warn "Android Studio SDK not in PATH"
        fi
    fi
    
    # Show connection
    echo ""
    show_devices
}

# ============================================================
# MODE 3: Physical Device
# ============================================================
start_physical() {
    log_step "Connecting to Physical Android Device..."
    
    check_adb
    
    local device_ip="${1:-${ANDROID_DEVICE_IP:-}}"
    local device_port="${2:-${ANDROID_DEVICE_PORT:-5555}}"
    
    if [ -n "$device_ip" ]; then
        log_info "Connecting to $device_ip:$device_port..."
        adb connect "$device_ip:$device_port"
    else
        log_info "Options:"
        echo "  ./start.sh --physical 192.168.1.100"
        echo "  export ANDROID_DEVICE_IP=192.168.1.100"
        echo "  ./start.sh --physical"
        echo ""
        
        # Check USB connections
        USB_DEVICES=$(adb devices | grep "device$" | grep -v "emulator" || true)
        if [ -n "$USB_DEVICES" ]; then
            log_success "USB devices connected:"
            echo "$USB_DEVICES"
        else
            log_warn "No USB devices found. Enable USB debugging on device."
        fi
    fi
    
    echo ""
    show_devices
}

# ============================================================
# Status & Utilities
# ============================================================
show_devices() {
    echo "Connected Android Devices:"
    echo "=========================="
    adb devices
    
    # Get details
    while IFS= read -r line; do
        SERIAL=$(echo "$line" | awk '{print $1}')
        STATE=$(echo "$line" | awk '{print $2}')
        if [ "$STATE" = "device" ]; then
            MODEL=$(adb -s "$SERIAL" shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "Unknown")
            VERSION=$(adb -s "$SERIAL" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r' || echo "?")
            echo "  → $SERIAL: $MODEL (Android $VERSION)"
        fi
    done < <(adb devices | grep "device$")
}

show_status() {
    echo "Android Connection Status:"
    echo "=========================="
    echo ""
    
    # Check ADB
    echo "ADB Devices:"
    adb devices 2>/dev/null || echo "  (ADB not available)"
    echo ""
    
    # Check Docker
    echo "Docker Containers:"
    if docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null | grep -E "android|mobile" || true; then
        echo "  Android: running"
        echo "  Mobile-MCP: running"
    else
        echo "  No Android containers running"
    fi
}

show_help() {
    echo "KRONOS-OS Android Controller v1.1.0"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  (interactive)  Show mode selection menu"
    echo "  --docker       Start Docker Android emulator"
    echo "  --studio       Connect Android Studio AVD"
    echo "  --physical [ip] Connect physical Android device"
    echo "  --status       Show all connections"
    echo "  --devices      Show connected devices"
    echo "  --stop         Stop Docker containers"
    echo "  --connect      Connect ADB to Docker emulator"
    echo "  --logs [svc]   View logs (android-emulator, mobile-mcp)"
    echo "  --help         Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  ANDROID_MODE          auto | docker | studio | physical"
    echo "  ANDROID_DEVICE_IP     IP for physical device"
    echo "  ADB_HOST              ADB host (default: localhost)"
    echo "  ADB_PORT              ADB port (default: 5555)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Interactive mode selection"
    echo "  $0 --docker --build   # Rebuild and start Docker emulator"
    echo "  $0 --studio           # Connect local AVD"
    echo "  $0 --physical 192.168.1.100  # Connect device by IP"
    echo "  $0 --status           # Check all connections"
    echo "  $0 --stop             # Stop Docker containers"
}

interactive_menu() {
    echo "KRONOS-OS Android Controller"
    echo ""
    echo "Select Android control mode:"
    echo ""
    echo "  1) Docker Emulator    - Full Android in container (Linux KVM)"
    echo "  2) Android Studio AVD - Local emulator via ADB"
    echo "  3) Physical Device    - Real Android device via ADB"
    echo "  4) Status             - Check all connections"
    echo "  5) Exit"
    echo ""
    read -p "Select (1-5): " choice
    echo ""
    
    case "$choice" in
        1) start_docker ;;
        2) start_studio_avd ;;
        3) 
            read -p "Device IP [localhost:5555]: " ip_port
            if [ -z "$ip_port" ]; then
                start_physical
            else
                IP=$(echo "$ip_port" | cut -d: -f1)
                PORT=$(echo "$ip_port" | cut -d: -f2)
                start_physical "${IP:-localhost}" "${PORT:-5555}"
            fi
            ;;
        4) show_status ;;
        5) exit 0 ;;
        *) echo "Invalid choice"; exit 1 ;;
    esac
}

# Main
main() {
    check_adb
    
    case "${1:-}" in
        --docker)
            start_docker "${2:-}"
            ;;
        --studio)
            start_studio_avd
            ;;
        --physical)
            start_physical "$2" "$3"
            ;;
        --status)
            show_status
            ;;
        --devices|devices)
            show_devices
            ;;
        --stop)
            stop_docker
            ;;
        --connect)
            adb connect localhost:5555 2>/dev/null || adb connect android-emulator:5555
            show_devices
            ;;
        --logs)
            cd "$SCRIPT_DIR"
            docker compose -f "$COMPOSE_FILE" logs -f "${2:-}"
            ;;
        --help|--|-h)
            show_help
            ;;
        "")
            interactive_menu
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Run $0 --help for usage"
            exit 1
            ;;
    esac
}

main "$@"
