#!/bin/bash

# Production Deployment Script
# Zero-downtime deployment with health checks and rollback capability

set -e

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_SUFFIX=$(date +%Y%m%d_%H%M%S)
PROJECT_NAME="ai-ecosystem-prod"
HEALTH_TIMEOUT=300
ROLLBACK_FILE=".rollback_$BACKUP_SUFFIX"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to check if services are healthy
check_health() {
    local service=$1
    local max_attempts=30
    local attempt=1

    log_info "Checking health for service: $service"

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T "$service" curl -f -k http://localhost/health 2>/dev/null; then
            log_success "Service $service is healthy"
            return 0
        fi

        log_warn "Health check attempt $attempt/$max_attempts failed for $service"
        sleep 10
        ((attempt++))
    done

    log_error "Service $service failed health check after $max_attempts attempts"
    return 1
}

# Function to check all services health
check_all_services_health() {
    local services=("orchestrator" "bytebot-agent" "bytebot-desktop" "bytebot-ui" "nginx")

    for service in "${services[@]}"; do
        if ! check_health "$service"; then
            return 1
        fi
    done

    return 0
}

# Function to backup current deployment
backup_current_deployment() {
    log_info "Creating deployment backup..."

    # Create backup of current compose file
    cp "$COMPOSE_FILE" "${COMPOSE_FILE}.backup_$BACKUP_SUFFIX"

    # Save current docker-compose ps output
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps > "${ROLLBACK_FILE}"

    # Save environment file if exists
    if [ -f ".env.prod" ]; then
        cp .env.prod ".env.prod.backup_$BACKUP_SUFFIX"
    fi

    log_success "Backup created: $ROLLBACK_FILE"
}

# Function to perform deployment
perform_deployment() {
    log_info "Starting deployment..."

    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" pull

    # Start services with rolling update
    log_info "Starting services with rolling update..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --scale nginx=2

    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30

    # Check health of new services
    if check_all_services_health; then
        # Scale back to normal if we scaled up
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --scale nginx=1
        log_success "Deployment completed successfully"
        return 0
    else
        log_error "Deployment failed - services not healthy"
        return 1
    fi
}

# Function to rollback deployment
rollback_deployment() {
    log_warn "Starting rollback..."

    # Stop current services
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down

    # Restore from backup
    if [ -f "$ROLLBACK_FILE" ]; then
        log_info "Restoring from backup..."
        docker-compose -f "${COMPOSE_FILE}.backup_$BACKUP_SUFFIX" -p "${PROJECT_NAME}_backup" up -d
        log_success "Rollback completed"
        return 0
    else
        log_error "No rollback file found"
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."

    # Keep only last 5 backups
    find . -name "*.backup_*" -type f | head -n -5 | xargs -r rm -f
    find . -name ".rollback_*" -type f | head -n -5 | xargs -r rm -f

    log_success "Cleanup completed"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2

    # Send to Slack if webhook is configured
    if [ -f "secrets/slack_webhook_url.txt" ]; then
        local webhook_url=$(cat secrets/slack_webhook_url.txt)
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"🚀 AI Ecosystem Deployment: $status\\n$message\"}" \
             "$webhook_url" 2>/dev/null || true
    fi
}

# Main deployment function
main() {
    local force_rollback=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rollback)
                force_rollback=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Usage: $0 [--rollback]"
                exit 1
                ;;
        esac
    done

    log_info "AI Ecosystem Production Deployment"
    log_info "=================================="

    # Pre-deployment checks
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    if [ ! -d "secrets" ]; then
        log_error "Secrets directory not found. Run setup-secrets.sh first"
        exit 1
    fi

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    # Force rollback if requested
    if [ "$force_rollback" = true ]; then
        if rollback_deployment; then
            send_notification "ROLLBACK" "Manual rollback completed successfully"
            exit 0
        else
            send_notification "ROLLBACK_FAILED" "Manual rollback failed"
            exit 1
        fi
    fi

    # Normal deployment
    send_notification "STARTED" "Deployment started"

    if backup_current_deployment && perform_deployment; then
        send_notification "SUCCESS" "Deployment completed successfully"
        cleanup_old_backups
        log_success "🎉 Deployment completed successfully!"
        exit 0
    else
        log_error "Deployment failed, attempting rollback..."
        if rollback_deployment; then
            send_notification "ROLLBACK_SUCCESS" "Deployment failed, rollback completed"
            log_warn "⚠️  Deployment failed but rollback was successful"
            exit 1
        else
            send_notification "CRITICAL" "Deployment and rollback both failed!"
            log_error "💥 Critical failure: deployment and rollback both failed"
            exit 1
        fi
    fi
}

# Run main function
main "$@"