#!/bin/bash

# Unified Application Framework Activation Script
# Starts all services in the correct order: AIOS -> ByteBot -> Factif-AI -> UI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/pids"

# Service ports
AIOS_PORT=8000
BYTEBOT_AGENT_PORT=9991
FACTIF_AI_PORT=3001
BYTEBOT_UI_PORT=3000
API_GATEWAY_PORT=8080

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if port is available
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "Port $port is already in use (required for $service)"
        log_info "To free the port, run: lsof -ti:$port | xargs kill -9"
        return 1
    fi
    return 0
}

# Wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=60
    local attempt=1
    
    log_info "Waiting for $service_name to be ready at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            log_info "Still waiting for $service_name... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$service_name failed to start within expected time"
    return 1
}

# Kill existing processes
cleanup_existing() {
    log_info "Cleaning up existing processes..."
    
    # Kill processes by port
    for port in $AIOS_PORT $BYTEBOT_AGENT_PORT $FACTIF_AI_PORT $BYTEBOT_UI_PORT $API_GATEWAY_PORT; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Killing process on port $port"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Clean up PID files
    rm -f "$PID_DIR"/*.pid
    
    sleep 2
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required (current: $(node --version))"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    # Copy .env.example to .env if it doesn't exist
    if [ ! -f "$ROOT_DIR/.env" ]; then
        log_info "Creating .env file from .env.example"
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    fi
    
    # Export environment variables
    export NODE_ENV=development
    export UNIFIED_CONFIG_PATH="$ROOT_DIR/config/unified.development.yaml"
    export LOG_LEVEL=info
    export API_GATEWAY_PORT=$API_GATEWAY_PORT
    export BYTEBOT_AGENT_PORT=$BYTEBOT_AGENT_PORT
    export FACTIF_AI_PORT=$FACTIF_AI_PORT
    export AIOS_PORT=$AIOS_PORT
    export BYTEBOT_UI_PORT=$BYTEBOT_UI_PORT
    
    log_success "Environment setup complete"
}

# Start services using Docker Compose
start_with_docker() {
    log_info "Starting services with Docker Compose..."
    
    cd "$ROOT_DIR"
    
    # Build and start all services
    docker-compose -f docker-compose.ecosystem.yml up --build -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Check service health
    services=(
        "AIOS:$AIOS_PORT:http://localhost:$AIOS_PORT/health"
        "API Gateway:$API_GATEWAY_PORT:http://localhost:$API_GATEWAY_PORT/health"
        "Factif-AI:$FACTIF_AI_PORT:http://localhost:$FACTIF_AI_PORT/health"
        "ByteBot UI:$BYTEBOT_UI_PORT:http://localhost:$BYTEBOT_UI_PORT"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name port url <<< "$service_info"
        
        if wait_for_service "$url" "$name"; then
            log_success "✓ $name is running on port $port"
        else
            log_error "✗ $name failed to start on port $port"
        fi
    done
}

# Start services locally (development mode)
start_locally() {
    log_info "Starting services locally..."
    
    # Check ports availability
    log_info "Checking port availability..."
    check_port $AIOS_PORT "AIOS" || exit 1
    check_port $BYTEBOT_AGENT_PORT "ByteBot Agent" || exit 1
    check_port $API_GATEWAY_PORT "API Gateway" || exit 1
    check_port $FACTIF_AI_PORT "Factif-AI" || exit 1
    check_port $BYTEBOT_UI_PORT "ByteBot UI" || exit 1
    
    # Start AIOS (if directory exists)
    if [ -d "$ROOT_DIR/AIOS" ]; then
        log_info "Starting AIOS service..."
        cd "$ROOT_DIR/AIOS"
        python3 -m aios.server --port $AIOS_PORT > "$LOG_DIR/aios.log" 2>&1 &
        echo $! > "$PID_DIR/aios.pid"
        wait_for_service "http://localhost:$AIOS_PORT/health" "AIOS"
    fi
    
    # Start ByteBot Agent (if directory exists)
    if [ -d "$ROOT_DIR/bytebot/packages/bytebot-agent" ]; then
        log_info "Starting ByteBot Agent service..."
        cd "$ROOT_DIR/bytebot/packages/bytebot-agent"
        npm install --silent
        PORT=$BYTEBOT_AGENT_PORT npm run start:dev > "$LOG_DIR/bytebot-agent.log" 2>&1 &
        echo $! > "$PID_DIR/bytebot-agent.pid"
        wait_for_service "http://localhost:$API_GATEWAY_PORT/health" "ByteBot Agent"
    fi
    
    # Start Factif-AI (if directory exists)
    if [ -d "$ROOT_DIR/factif-ai/backend" ]; then
        log_info "Starting Factif-AI service..."
        cd "$ROOT_DIR/factif-ai/backend"
        npm install --silent
        PORT=$FACTIF_AI_PORT npm run dev > "$LOG_DIR/factif-ai.log" 2>&1 &
        echo $! > "$PID_DIR/factif-ai.pid"
        wait_for_service "http://localhost:$FACTIF_AI_PORT/health" "Factif-AI"
    fi
    
    # Start ByteBot UI (if directory exists)
    if [ -d "$ROOT_DIR/bytebot/packages/bytebot-ui" ]; then
        log_info "Starting ByteBot UI service..."
        cd "$ROOT_DIR/bytebot/packages/bytebot-ui"
        npm install --silent
        PORT=$BYTEBOT_UI_PORT npm run dev > "$LOG_DIR/bytebot-ui.log" 2>&1 &
        echo $! > "$PID_DIR/bytebot-ui.pid"
        wait_for_service "http://localhost:$BYTEBOT_UI_PORT" "ByteBot UI"
    fi
}

# Display service status
show_status() {
    echo
    log_info "=== Unified Application Framework Status ==="
    echo
    
    # Check each service
    services=(
        "AIOS:$AIOS_PORT:http://localhost:$AIOS_PORT/health"
        "ByteBot Agent:$BYTEBOT_AGENT_PORT:http://localhost:$BYTEBOT_AGENT_PORT/health"
        "API Gateway:$API_GATEWAY_PORT:http://localhost:$API_GATEWAY_PORT/health"
        "Factif-AI:$FACTIF_AI_PORT:http://localhost:$FACTIF_AI_PORT/health"
        "ByteBot UI:$BYTEBOT_UI_PORT:http://localhost:$BYTEBOT_UI_PORT"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name port url <<< "$service_info"
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "✓ $name is running on port $port"
        else
            log_error "✗ $name is not responding on port $port"
        fi
    done
    
    echo
    log_info "=== Access URLs ==="
    echo "• Unified Dashboard: http://localhost:$BYTEBOT_UI_PORT/unified"
    echo "• API Gateway: http://localhost:$API_GATEWAY_PORT"
    echo "• API Documentation: http://localhost:$API_GATEWAY_PORT/api/docs"
    echo "• AIOS Service: http://localhost:$AIOS_PORT"
    echo "• Factif-AI Service: http://localhost:$FACTIF_AI_PORT"
    echo
    
    log_info "=== Log Files ==="
    echo "• AIOS: $LOG_DIR/aios.log"
    echo "• ByteBot Agent: $LOG_DIR/bytebot-agent.log"
    echo "• Factif-AI: $LOG_DIR/factif-ai.log"
    echo "• ByteBot UI: $LOG_DIR/bytebot-ui.log"
    echo
}

# Main execution
main() {
    log_info "Starting Unified Application Framework activation..."
    echo
    
    # Check if we should clean up first
    if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
        cleanup_existing
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment
    
    # Choose startup method
    if [ "$1" = "--docker" ] || [ "$1" = "-d" ]; then
        start_with_docker
    else
        start_locally
    fi
    
    # Show final status
    show_status
    
    log_success "Unified Application Framework is now running!"
    log_info "Press Ctrl+C to stop all services"
    
    # Keep script running and handle cleanup on exit
    trap 'log_info "Shutting down services..."; cleanup_existing; exit 0' INT TERM
    
    # Monitor services
    while true; do
        sleep 30
        
        # Check if all services are still running
        all_running=true
        for pid_file in "$PID_DIR"/*.pid; do
            if [ -f "$pid_file" ]; then
                pid=$(cat "$pid_file")
                if ! kill -0 "$pid" 2>/dev/null; then
                    service_name=$(basename "$pid_file" .pid)
                    log_warning "Service $service_name (PID $pid) has stopped"
                    all_running=false
                fi
            fi
        done
        
        if [ "$all_running" = false ]; then
            log_error "Some services have stopped. Check log files for details."
            break
        fi
    done
}

# Handle command line arguments
case "$1" in
    "--help" | "-h")
        echo "Unified Application Framework Activation Script"
        echo
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --docker, -d   Start services using Docker Compose"
        echo "  --clean, -c    Clean up existing processes before starting"
        echo "  --help, -h     Show this help message"
        echo "  --status, -s   Show current service status"
        echo
        exit 0
        ;;
    "--status" | "-s")
        setup_environment
        show_status
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac