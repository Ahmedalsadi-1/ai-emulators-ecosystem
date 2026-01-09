#!/bin/bash
# KRONOS-OS Android Control - Connection Helper Scripts
# Supports: Docker Emulator, Android Studio AVD, Physical Device

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}!${NC} $1"; }
print_info() { echo -e "${BLUE}→${NC} $1"; }

# Check if ADB is installed
check_adb() {
    if ! command -v adb &> /dev/null; then
        print_error "ADB not found. Install Android SDK or Android Studio."
        exit 1
    fi
    print_success "ADB found: $(adb version | head -1)"
}

# ============================================================
# OPTION 1: Physical Device via ADB over WiFi
# ============================================================
connect_physical_device() {
    print_header "Physical Android Device Connection"
    
    print_info "Requirements:"
    echo "  1. Android device with USB debugging enabled"
    echo "  2. Device connected via USB (for initial setup)"
    echo "  3. Or device IP address (for WiFi connection)"
    echo ""
    
    # Check for device IP from env or args
    DEVICE_IP="${1:-${ANDROID_DEVICE_IP:-}}"
    DEVICE_PORT="${2:-${ANDROID_DEVICE_PORT:-5555}}"
    
    if [ -n "$DEVICE_IP" ]; then
        print_info "Connecting to $DEVICE_IP:$DEVICE_PORT via WiFi..."
        
        # First connect via USB to get IP (optional)
        if adb devices | grep -q "device$"; then
            print_info "Getting device IP..."
            DEVICE_IP_ACTUAL=$(adb shell ip route | awk '{print $9}' | head -1)
            if [ -n "$DEVICE_IP_ACTUAL" ]; then
                print_info "Device IP: $DEVICE_IP_ACTUAL"
            fi
        fi
        
        # Connect via TCPIP
        adb connect "$DEVICE_IP:$DEVICE_PORT"
        print_success "Connected!"
    else
        print_info "Usage: ./connect-physical.sh <device-ip> [port]"
        echo ""
        print_info "Options:"
        echo "  export ANDROID_DEVICE_IP=192.168.1.100"
        echo "  ./connect-physical.sh"
        echo ""
        print_info "Or specify IP directly:"
        echo "  ./connect-physical.sh 192.168.1.100"
        
        # Show connected devices
        echo ""
        print_info "Currently connected devices:"
        adb devices
    fi
}

# ============================================================
# OPTION 2: Android Studio AVD (Local Emulator)
# ============================================================
connect_studio_avd() {
    print_header "Android Studio AVD Connection"
    
    print_info "Starting Android Studio AVD..."
    
    # Check if AVD is already running
    RUNNING_AVD=$(adb devices | grep "emulator" | grep "device$" | head -1 | awk '{print $1}')
    
    if [ -n "$RUNNING_AVD" ]; then
        print_success "AVD already running: $RUNNING_AVD"
    else
        print_info "No AVD detected. Starting one..."
        
        # Try to start emulator
        if command -v emulator &> /dev/null; then
            # List available AVDs
            echo ""
            print_info "Available AVDs:"
            emulator -list-avds 2>/dev/null || echo "  (No AVDs found)"
            
            # Try to start first AVD
            AVD_NAME=$(emulator -list-avds 2>/dev/null | head -1)
            if [ -n "$AVD_NAME" ]; then
                print_info "Starting AVD: $AVD_NAME"
                emulator -avd "$AVD_NAME" -no-window &
                print_success "AVD started (may take 1-2 minutes)"
            else
                print_warning "No AVDs found. Create one in Android Studio:"
                echo "  Android Studio → AVD Manager → Create Virtual Device"
            fi
        else
            print_warning "Android Studio SDK not in PATH"
            print_info "Options:"
            echo "  1. Start Android Studio and run AVD manually"
            echo "  2. Add SDK to PATH: export ANDROID_HOME=~/Android/Sdk"
        fi
    fi
    
    # Show connected devices
    echo ""
    print_info "Connected devices:"
    adb devices
}

# ============================================================
# OPTION 3: Docker Android Emulator (Linux with KVM)
# ============================================================
connect_docker_emulator() {
    print_header "Docker Android Emulator Connection"
    
    print_info "This requires:"
    echo "  1. Linux host with KVM enabled"
    echo "  2. Docker with KVM passthrough"
    echo "  3. budtmo/docker-android container"
    echo ""
    
    print_info "To start the Docker emulator:"
    echo "  ./start.sh --build"
    echo ""
    
    print_info "Or connect to an existing emulator:"
    EMULATOR_HOST="${1:-${DOCKER_EMULATOR_HOST:-localhost}}"
    EMULATOR_PORT="${2:-${DOCKER_EMULATOR_PORT:-5555}}"
    
    print_info "Connecting to $EMULATOR_HOST:$EMULATOR_PORT..."
    adb connect "$EMULATOR_HOST:$EMULATOR_PORT"
    
    echo ""
    print_info "Connected devices:"
    adb devices
}

# ============================================================
# Main Menu
# ============================================================
show_menu() {
    print_header "KRONOS-OS Android Connection Helper"
    
    echo "Select connection method:"
    echo ""
    echo "  1) Physical Device (ADB over WiFi)"
    echo "  2) Android Studio AVD (Local Emulator)"
    echo "  3) Docker Android Emulator (Linux KVM)"
    echo "  4) Show connected devices"
    echo "  5) Exit"
    echo ""
}

show_devices() {
    print_header "Connected Android Devices"
    adb devices
    echo ""
    
    # Get details for each device
    while IFS= read -r line; do
        SERIAL=$(echo "$line" | awk '{print $1}')
        STATE=$(echo "$line" | awk '{print $2}')
        
        if [ "$STATE" = "device" ]; then
            MODEL=$(adb -s "$SERIAL" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
            VERSION=$(adb -s "$SERIAL" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
            print_info "$SERIAL: $MODEL (Android $VERSION)"
        fi
    done < <(adb devices | grep "device$")
}

# Main
check_adb

if [ -n "$1" ]; then
    case "$1" in
        physical|1)
            connect_physical_device "$2" "$3"
            ;;
        studio|2)
            connect_studio_avd
            ;;
        docker|3)
            connect_docker_emulator "$2" "$3"
            ;;
        devices|4)
            show_devices
            ;;
        help|--help|-h)
            echo "Usage: $0 [mode] [args]"
            echo ""
            echo "Modes:"
            echo "  physical [ip] [port]  - Connect physical device"
            echo "  studio                - Connect Android Studio AVD"
            echo "  docker [host] [port]  - Connect Docker emulator"
            echo "  devices               - Show connected devices"
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
else
    show_menu
    
    read -p "Select option (1-5): " choice
    
    case "$choice" in
        1)
            read -p "Device IP (or press Enter for USB): " ip
            read -p "Port [5555]: " port
            port=${port:-5555}
            connect_physical_device "$ip" "$port"
            ;;
        2)
            connect_studio_avd
            ;;
        3)
            read -p "Emulator host [localhost]: " host
            read -p "Port [5555]: " port
            host=${host:-localhost}
            port=${port:-5555}
            connect_docker_emulator "$host" "$port"
            ;;
        4)
            show_devices
            ;;
        5)
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
fi
