#!/bin/bash
#
# KRONOS-OS Android Emulator Startup Script
# 
# This script sets up and starts the Android emulator for agent control via mobile-mcp.
#
# Prerequisites:
# - Docker and Docker Compose installed
# - KVM virtualization support (for Android emulator)
#
# Usage:
#   ./start-android-emulator.sh           # Start the emulator
#   ./start-android-emulator.sh --build   # Rebuild and start
#   ./start-android-emulator.sh --stop    # Stop the emulator
#   ./start-android-emulator.sh --logs    # View logs
#   ./start-android-emulator.sh --status  # Check status
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
CONTAINER_PREFIX="kronos-"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check for KVM support
check_kvm() {
    if [ ! -e /dev/kvm ]; then
        log_warn "KVM not found. Android emulator may not work properly."
        log_warn "To enable KVM, add --device=/dev/kvm:/dev/kvm to your Docker run command"
    fi
}

# Start the emulator
start_emulator() {
    log_info "Starting Android emulator..."
    
    cd "$SCRIPT_DIR"
    
    # Build images if requested
    if [ "$1" = "--build" ]; then
        log_info "Building images (this may take a while)..."
        docker compose -f "$COMPOSE_FILE" build --no-cache
    fi
    
    # Start services
    docker compose -f "$COMPOSE_FILE" up -d
    
    log_success "Android emulator started!"
    log_info "Waiting for services to be ready..."
    
    # Wait for Android emulator to be ready
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec kronos-android-emulator curl -s http://localhost:8000/status > /dev/null 2>&1; then
            log_success "Android emulator is ready!"
            break
        fi
        
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        log_warn "Android emulator may not be fully ready. Check logs with: $0 --logs"
    fi
    
    # Print connection info
    echo ""
    log_success "Android emulator is running!"
    echo ""
    echo "Access points:"
    echo "  - VNC Web Interface: http://localhost:6083"
    echo "  - HTTP API:          http://localhost:8000"
    echo "  - WebSocket:         ws://localhost:8001"
    echo "  - ADB:               localhost:5555"
    echo ""
    echo "Mobile MCP Server:"
    echo "  - MCP Server:        localhost:3001"
    echo ""
}

# Stop the emulator
stop_emulator() {
    log_info "Stopping Android emulator..."
    
    cd "$SCRIPT_DIR"
    docker compose -f "$COMPOSE_FILE" down
    
    log_success "Android emulator stopped!"
}

# View logs
view_logs() {
    cd "$SCRIPT_DIR"
    
    if [ -n "$1" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f "$1"
    else
        docker compose -f "$COMPOSE_FILE" logs -f
    fi
}

# Check status
check_status() {
    cd "$SCRIPT_DIR"
    
    echo "Android Emulator Status:"
    echo "========================"
    echo ""
    
    local status=$(docker inspect -f '{{.State.Status}}' kronos-android-emulator 2>/dev/null || echo "not running")
    
    if [ "$status" = "running" ]; then
        log_success "Android Emulator: RUNNING"
        
        echo ""
        echo "Container details:"
        docker inspect kronos-android-emulator --format '  Image: {{.Config.Image}}'
        docker inspect kronos-android-emulator --format '  Ports: {{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{range $conf}}{{.HostPort}}{{end}} {{end}}'
        
        echo ""
        echo "Quick checks:"
        
        # Check VNC
        if curl -s http://localhost:6083 > /dev/null 2>&1; then
            echo "  ✓ VNC (6083): Responding"
        else
            echo "  ✗ VNC (6083): Not responding"
        fi
        
        # Check HTTP API
        if curl -s http://localhost:8000/status > /dev/null 2>&1; then
            echo "  ✓ HTTP API (8000): Responding"
        else
            echo "  ✗ HTTP API (8000): Not responding"
        fi
        
        # Check ADB
        if docker exec kronos-android-emulator adb devices | grep -q "emulator-5554"; then
            echo "  ✓ ADB (5555): Connected"
        else
            echo "  ✗ ADB (5555): Not connected"
        fi
        
        # Check MCP
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            echo "  ✓ MCP Server (3001): Responding"
        else
            echo "  ✗ MCP Server (3001): Not responding"
        fi
        
    else
        log_error "Android Emulator: NOT RUNNING"
        echo ""
        echo "Start it with: $0"
    fi
}

# Connect ADB
connect_adb() {
    log_info "Connecting to Android emulator via ADB..."
    docker exec kronos-android-emulator adb connect android-emulator:5555
    docker exec kronos-android-emulator adb devices
}

# Install APK
install_apk() {
    if [ -z "$1" ]; then
        log_error "Please specify an APK file path"
        echo "Usage: $0 --install /path/to/app.apk"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        log_error "File not found: $1"
        exit 1
    fi
    
    log_info "Installing APK: $1"
    docker cp "$1" kronos-android-emulator:/data/app.apk
    docker exec kronos-android-emulator adb install -r /data/app.apk
}

# Show help
show_help() {
    echo "KRONOS-OS Android Emulator Controller"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  (no command)    Start the Android emulator"
    echo "  --build         Rebuild Docker images before starting"
    echo "  --stop          Stop the emulator"
    echo "  --logs          View container logs (use [service] for specific)"
    echo "  --status        Check emulator status"
    echo "  --connect       Connect ADB to emulator"
    echo "  --install <file> Install APK file"
    echo "  --help          Show this help message"
    echo ""
    echo "Services:"
    echo "  android-emulator  The Android emulator container"
    echo "  mobile-mcp        The MCP server for agent control"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start emulator"
    echo "  $0 --build            # Rebuild and start"
    echo "  $0 --logs android-emulator  # View emulator logs"
    echo "  $0 --status           # Check if everything is running"
    echo "  $0 --install app.apk  # Install an APK"
    echo "  $0 --stop             # Stop everything"
}

# Main
main() {
    check_docker
    check_kvm
    
    case "${1:-}" in
        --stop)
            stop_emulator
            ;;
        --logs)
            view_logs "$2"
            ;;
        --status)
            check_status
            ;;
        --connect)
            connect_adb
            ;;
        --install)
            install_apk "$2"
            ;;
        --help|--|-h)
            show_help
            ;;
        --build)
            start_emulator "--build"
            ;;
        "")
            start_emulator
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
