#!/bin/bash

# Rollback Deployment Script
# Quick recovery from failed deployments

set -e

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="ai-ecosystem-prod"

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

# Function to find latest rollback file
find_latest_rollback() {
    local latest_rollback=$(find . -name ".rollback_*" -type f | sort | tail -n1)

    if [ -z "$latest_rollback" ]; then
        log_error "No rollback files found"
        return 1
    fi

    echo "$latest_rollback"
    return 0
}

# Function to check if services are healthy
check_services_health() {
    local max_attempts=20
    local attempt=1

    log_info "Checking services health..."

    while [ $attempt -le $max_attempts ]; do
        local healthy_count=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps | grep -c "Up")

        if [ "$healthy_count" -ge 3 ]; then  # At least core services should be up
            log_success "Services are healthy"
            return 0
        fi

        log_warn "Health check attempt $attempt/$max_attempts - $healthy_count services healthy"
        sleep 15
        ((attempt++))
    done

    log_error "Services failed health check"
    return 1
}

# Function to perform rollback
perform_rollback() {
    local rollback_file=$1

    log_info "Starting rollback using: $rollback_file"

    # Read the rollback information
    if [ ! -f "$rollback_file" ]; then
        log_error "Rollback file not found: $rollback_file"
        return 1
    fi

    # Extract backup timestamp from filename
    local backup_timestamp=$(echo "$rollback_file" | sed 's/.rollback_//')

    # Find corresponding compose backup
    local compose_backup="${COMPOSE_FILE}.backup_$backup_timestamp"

    if [ ! -f "$compose_backup" ]; then
        log_error "Compose backup not found: $compose_backup"
        return 1
    fi

    log_info "Using compose backup: $compose_backup"

    # Stop current services gracefully
    log_info "Stopping current services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --timeout 30

    # Start services from backup
    log_info "Starting services from backup..."
    docker-compose -f "$compose_backup" -p "${PROJECT_NAME}_restored" up -d

    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 45

    # Check health
    if check_services_health; then
        log_success "Rollback completed successfully"

        # Clean up failed deployment
        log_info "Cleaning up failed deployment..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v 2>/dev/null || true

        # Rename restored project to main project
        log_info "Switching to restored deployment..."
        docker-compose -f "$compose_backup" -p "${PROJECT_NAME}_restored" down
        docker-compose -f "$compose_backup" -p "$PROJECT_NAME" up -d

        return 0
    else
        log_error "Rollback failed - services not healthy"
        return 1
    fi
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2

    # Send to Slack if webhook is configured
    if [ -f "secrets/slack_webhook_url.txt" ]; then
        local webhook_url=$(cat secrets/slack_webhook_url.txt)
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"🔄 AI Ecosystem Rollback: $status\\n$message\"}" \
             "$webhook_url" 2>/dev/null || true
    fi
}

# Function to show rollback options
show_rollback_options() {
    log_info "Available rollback options:"

    local rollback_files=$(find . -name ".rollback_*" -type f | sort -r)

    if [ -z "$rollback_files" ]; then
        log_warn "No rollback files found"
        return 1
    fi

    local count=1
    echo "$rollback_files" | while read -r file; do
        local timestamp=$(echo "$file" | sed 's/.rollback_//' | sed 's/_/ /')
        local compose_backup="${COMPOSE_FILE}.backup_$timestamp"

        if [ -f "$compose_backup" ]; then
            echo "  $count) $timestamp"
            ((count++))
        fi
    done

    return 0
}

# Main rollback function
main() {
    local auto_select=false
    local selected_backup=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                auto_select=true
                shift
                ;;
            --list)
                show_rollback_options
                exit 0
                ;;
            --help)
                echo "Usage: $0 [--auto] [--list] [--help]"
                echo "  --auto    Automatically select latest rollback"
                echo "  --list    List available rollback options"
                echo "  --help    Show this help"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    log_info "AI Ecosystem Rollback Script"
    log_info "============================"

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    # Find rollback file
    if [ "$auto_select" = true ]; then
        selected_backup=$(find_latest_rollback)
        if [ $? -ne 0 ]; then
            exit 1
        fi
    else
        if ! show_rollback_options; then
            exit 1
        fi

        echo
        read -p "Select rollback number (or 'q' to quit): " choice

        if [ "$choice" = "q" ] || [ -z "$choice" ]; then
            log_info "Rollback cancelled"
            exit 0
        fi

        selected_backup=$(find . -name ".rollback_*" -type f | sort -r | sed -n "${choice}p")

        if [ -z "$selected_backup" ]; then
            log_error "Invalid selection"
            exit 1
        fi
    fi

    log_info "Selected rollback: $selected_backup"

    # Confirm rollback
    if [ "$auto_select" = false ]; then
        echo
        read -p "Are you sure you want to rollback? This will stop current services. (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            log_info "Rollback cancelled"
            exit 0
        fi
    fi

    # Perform rollback
    send_notification "STARTED" "Rollback started"

    if perform_rollback "$selected_backup"; then
        send_notification "SUCCESS" "Rollback completed successfully"
        log_success "🎉 Rollback completed successfully!"
        exit 0
    else
        send_notification "FAILED" "Rollback failed"
        log_error "💥 Rollback failed"
        exit 1
    fi
}

# Run main function
main "$@"