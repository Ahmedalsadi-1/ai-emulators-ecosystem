#!/bin/bash

# TuriX Unified App Deployment Script
# Deploys the complete AI Emulators Ecosystem with TuriX unified interface

set -e

echo "🚀 Starting TuriX Unified Ecosystem Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."

    # Check available memory
    local mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local mem_gb=$((mem_kb / 1024 / 1024))

    if [ $mem_gb -lt 16 ]; then
        print_warning "System has ${mem_gb}GB RAM. Recommended: 16GB+ for full ecosystem"
    else
        print_success "Memory check passed: ${mem_gb}GB RAM available"
    fi

    # Check available disk space
    local disk_gb=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ $disk_gb -lt 50 ]; then
        print_warning "Low disk space: ${disk_gb}GB available. Recommended: 50GB+"
    else
        print_success "Disk space check passed: ${disk_gb}GB available"
    fi
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."

    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env

        print_warning "Please edit .env file with your API keys before continuing"
        print_warning "Required: OPENAI_API_KEY, HUGGINGFACE_TOKEN, POSTGRES_PASSWORD, GRAFANA_PASSWORD"
        read -p "Press Enter after updating .env file..."
    fi

    # Source environment variables
    set -a
    source .env
    set +a

    print_success "Environment setup complete"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    # Install root dependencies
    if [ -f "package.json" ]; then
        npm install --legacy-peer-deps
        print_success "Root dependencies installed"
    fi

    # Install AIOS Python dependencies
    if [ -d "AIOS" ]; then
        cd AIOS
        uv pip install -r requirements.txt
        cd ..
        print_success "AIOS dependencies installed"
    fi

    # Install bytebot dependencies
    if [ -d "bytebot" ]; then
        cd bytebot
        pnpm install
        cd ..
        print_success "Bytebot dependencies installed"
    fi

    print_success "All dependencies installed"
}

# Build services
build_services() {
    print_status "Building services..."

    # Build bytebot
    if [ -d "bytebot" ]; then
        cd bytebot
        pnpm run build
        cd ..
        print_success "Bytebot built"
    fi

    # Build factif-ai
    if [ -d "factif-ai" ]; then
        cd factif-ai
        npm run build
        cd ..
        print_success "Factif-ai built"
    fi

    # Build postiz-app
    if [ -d "postiz-app" ]; then
        cd postiz-app
        pnpm run build
        cd ..
        print_success "Postiz-app built"
    fi

    print_success "All services built"
}

# Start the ecosystem
start_ecosystem() {
    print_status "Starting AI Emulators Ecosystem..."

    # Start with docker-compose
    if [ -f "docker-compose.ecosystem.yml" ]; then
        docker-compose -f docker-compose.ecosystem.yml up -d
        print_success "Ecosystem started with Docker Compose"
    else
        print_error "docker-compose.ecosystem.yml not found"
        exit 1
    fi

    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30

    # Check service health
    check_service_health
}

# Check service health
check_service_health() {
    print_status "Checking service health..."

    local services=("aios:8000" "bytebot:4000" "postiz-app:9000" "postgres:5432" "redis:6379")
    local failed_services=()

    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)

        if curl -f http://localhost:$port/health > /dev/null 2>&1; then
            print_success "$name is healthy"
        else
            print_warning "$name health check failed"
            failed_services+=("$name")
        fi
    done

    if [ ${#failed_services[@]} -gt 0 ]; then
        print_warning "Some services failed health checks: ${failed_services[*]}"
        print_warning "This is normal during initial startup. Services may take longer to initialize."
    else
        print_success "All services passed health checks"
    fi
}

# Start TuriX unified app
start_turix() {
    print_status "Starting TuriX unified app..."

    if [ -d "turix-app" ]; then
        cd turix-app

        # Install dependencies
        npm install

        # Build the app
        npm run build

        # Start the app
        npm start &
        TURIX_PID=$!

        cd ..
        print_success "TuriX app started (PID: $TURIX_PID)"

        # Wait a bit for the app to start
        sleep 5

        print_success "🎉 TuriX Unified Ecosystem deployment complete!"
        print_success ""
        print_success "Access points:"
        print_success "  • TuriX App: Cmd/Ctrl + Shift + T (global shortcut)"
        print_success "  • Grafana Dashboard: http://localhost:3000"
        print_success "  • AIOS API: http://localhost:8000"
        print_success "  • Bytebot UI: http://localhost:4000"
        print_success "  • Postiz App: http://localhost:9000"
        print_success ""
        print_success "To stop the ecosystem: docker-compose -f docker-compose.ecosystem.yml down"

    else
        print_error "turix-app directory not found"
        exit 1
    fi
}

# Main deployment flow
main() {
    print_status "=== TuriX Unified Ecosystem Deployment ==="

    check_docker
    check_requirements
    setup_environment
    install_dependencies
    build_services
    start_ecosystem
    start_turix

    print_success "Deployment completed successfully! 🎉"
}

# Handle command line arguments
case "${1:-}" in
    "stop")
        print_status "Stopping TuriX ecosystem..."
        docker-compose -f docker-compose.ecosystem.yml down
        pkill -f "electron"
        print_success "Ecosystem stopped"
        ;;
    "restart")
        print_status "Restarting TuriX ecosystem..."
        docker-compose -f docker-compose.ecosystem.yml restart
        print_success "Ecosystem restarted"
        ;;
    "status")
        print_status "Checking ecosystem status..."
        docker-compose -f docker-compose.ecosystem.yml ps
        ;;
    "logs")
        print_status "Showing ecosystem logs..."
        docker-compose -f docker-compose.ecosystem.yml logs -f
        ;;
    "clean")
        print_status "Cleaning up ecosystem..."
        docker-compose -f docker-compose.ecosystem.yml down -v
        docker system prune -f
        rm -rf turix-app/node_modules
        print_success "Cleanup complete"
        ;;
    *)
        main
        ;;
esac