#!/bin/bash

# Disaster Recovery Script
# Automated recovery from backups

set -e

# Configuration
BACKUP_ROOT="/opt/ai-ecosystem/backups"
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

# Function to list available backups
list_backups() {
    log_info "Available backups:"
    echo

    if [ ! -d "$BACKUP_ROOT" ]; then
        log_error "Backup directory not found: $BACKUP_ROOT"
        return 1
    fi

    local backup_dirs
    backup_dirs=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | sort -r)

    if [ -z "$backup_dirs" ]; then
        log_warn "No backups found"
        return 1
    fi

    local count=1
    echo "$backup_dirs" | while read -r dir; do
        local timestamp
        timestamp=$(basename "$dir")
        local size
        size=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "unknown")
        local date_str
        date_str=$(echo "$timestamp" | sed 's/_/ /;s/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')

        echo "  $count) $timestamp ($date_str) - $size"

        if [ -f "$dir/BACKUP_INFO.txt" ]; then
            echo "      $(head -3 "$dir/BACKUP_INFO.txt" | tail -1)"
        fi

        ((count++))
    done

    echo
    return 0
}

# Function to validate backup
validate_backup() {
    local backup_dir=$1

    log_info "Validating backup: $backup_dir"

    if [ ! -d "$backup_dir" ]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi

    if [ ! -f "$backup_dir/backup_manifest.txt" ]; then
        log_error "Backup manifest not found"
        return 1
    fi

    local missing_files=0
    while IFS= read -r line; do
        if [[ $line == *":"* ]]; then
            local file_path
            file_path=$(echo "$line" | cut -d':' -f2)
            if [ ! -f "$file_path" ]; then
                log_error "Missing backup file: $file_path"
                ((missing_files++))
            fi
        fi
    done < "$backup_dir/backup_manifest.txt"

    if [ $missing_files -gt 0 ]; then
        log_error "Backup validation failed: $missing_files missing files"
        return 1
    fi

    log_success "Backup validation passed"
    return 0
}

# Function to stop current services
stop_services() {
    log_info "Stopping current services..."

    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --timeout 60
        log_success "Services stopped"
    else
        log_warn "No running services found"
    fi
}

# Function to restore PostgreSQL database
restore_postgres() {
    local backup_dir=$1

    log_info "Restoring PostgreSQL database..."

    local backup_file
    backup_file=$(grep "^postgres:" "$backup_dir/backup_manifest.txt" | cut -d':' -f2)

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_error "PostgreSQL backup file not found"
        return 1
    fi

    # Start PostgreSQL container temporarily
    log_info "Starting PostgreSQL for restore..."
    docker-compose -f "$COMPOSE_FILE" -p "${PROJECT_NAME}_restore" up -d postgres

    # Wait for PostgreSQL to be ready
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" -p "${PROJECT_NAME}_restore" exec -T postgres pg_isready -U admin >/dev/null 2>&1; then
            break
        fi
        log_info "Waiting for PostgreSQL... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "PostgreSQL failed to start"
        return 1
    fi

    # Restore database
    log_info "Restoring database from backup..."
    gunzip -c "$backup_file" | docker-compose -f "$COMPOSE_FILE" -p "${PROJECT_NAME}_restore" exec -T postgres psql -U admin -d postgres

    # Stop temporary PostgreSQL
    docker-compose -f "$COMPOSE_FILE" -p "${PROJECT_NAME}_restore" down

    log_success "PostgreSQL restore completed"
}

# Function to restore Redis data
restore_redis() {
    local backup_dir=$1

    log_info "Restoring Redis data..."

    local backup_file
    backup_file=$(grep "^redis:" "$backup_dir/backup_manifest.txt" | cut -d':' -f2)

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_warn "Redis backup file not found, skipping Redis restore"
        return 0
    fi

    # Copy backup file to Redis volume
    local redis_container="${PROJECT_NAME}_redis_1"
    docker cp "$backup_file" "$redis_container:/data/dump.rdb"

    log_success "Redis restore completed"
}

# Function to restore volumes
restore_volumes() {
    local backup_dir=$1

    log_info "Restoring Docker volumes..."

    grep "^volume:" "$backup_dir/backup_manifest.txt" | while IFS= read -r line; do
        local volume_name
        local backup_file
        volume_name=$(echo "$line" | cut -d':' -f2)
        backup_file=$(echo "$line" | cut -d':' -f3)

        if [ ! -f "$backup_file" ]; then
            log_error "Volume backup file not found: $backup_file"
            continue
        fi

        log_info "Restoring volume: $volume_name"

        # Create temporary container to restore volume
        local temp_container="restore_temp_$(date +%s)"
        docker run --rm -d --name "$temp_container" \
            -v "${PROJECT_NAME}_${volume_name}:/data" \
            alpine sleep 30 >/dev/null

        # Wait for container to start
        sleep 2

        # Extract backup
        docker exec -i "$temp_container" tar xzf - -C /data < "$backup_file"

        # Clean up
        docker stop "$temp_container" >/dev/null

        log_success "Volume $volume_name restored"
    done
}

# Function to restore configuration
restore_config() {
    local backup_dir=$1

    log_info "Restoring configuration files..."

    local config_backup
    config_backup=$(grep "^config:" "$backup_dir/backup_manifest.txt" | grep -v "secrets" | cut -d':' -f2)

    if [ -n "$config_backup" ] && [ -f "$config_backup" ]; then
        log_info "Restoring configuration files..."
        tar xzf "$config_backup" -C .
        log_success "Configuration files restored"
    else
        log_warn "Configuration backup not found"
    fi
}

# Function to start services
start_services() {
    log_info "Starting services..."

    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    local max_attempts=60
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        local healthy_count
        healthy_count=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps | grep -c "Up")

        if [ "$healthy_count" -ge 3 ]; then  # At least core services should be up
            log_success "Services are healthy ($healthy_count containers running)"
            return 0
        fi

        log_info "Waiting for services... ($healthy_count healthy, attempt $attempt/$max_attempts)"
        sleep 15
        ((attempt++))
    done

    log_error "Services failed to become healthy"
    return 1
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    local backup_name=${3:-"unknown"}

    # Send to Slack if webhook is configured
    if [ -f "secrets/slack_webhook_url.txt" ]; then
        local webhook_url=$(cat secrets/slack_webhook_url.txt)
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"🔄 AI Ecosystem Disaster Recovery: $status\\n$message\\nBackup: $backup_name\"}" \
             "$webhook_url" 2>/dev/null || true
    fi
}

# Function to show recovery statistics
show_recovery_stats() {
    local backup_dir=$1
    local duration=$2

    log_info "Recovery Statistics:"
    echo "==================="
    echo "Backup Source: $backup_dir"
    echo "Duration: $duration seconds"
    echo "Services Restored:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps --services --filter "status=running"
    echo
}

# Main recovery function
main() {
    local selected_backup=""
    local auto_select=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --list)
                list_backups
                exit 0
                ;;
            --auto)
                auto_select=true
                shift
                ;;
            --backup=*)
                selected_backup="${1#*=}"
                shift
                ;;
            --help)
                echo "Usage: $0 [--list] [--auto] [--backup=TIMESTAMP] [--help]"
                echo "  --list          List available backups"
                echo "  --auto          Automatically select latest backup"
                echo "  --backup=TS     Use specific backup timestamp"
                echo "  --help          Show this help"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    log_info "AI Ecosystem Disaster Recovery"
    log_info "=============================="

    # Pre-flight checks
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    # Determine backup to use
    if [ -n "$selected_backup" ]; then
        selected_backup="$BACKUP_ROOT/$selected_backup"
    elif [ "$auto_select" = true ]; then
        selected_backup=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | sort | tail -n1)
    else
        list_backups

        echo
        read -p "Select backup number (or 'q' to quit): " choice

        if [ "$choice" = "q" ] || [ -z "$choice" ]; then
            log_info "Recovery cancelled"
            exit 0
        fi

        selected_backup=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | sort -r | sed -n "${choice}p")
    fi

    if [ -z "$selected_backup" ]; then
        log_error "No backup selected"
        exit 1
    fi

    local backup_name
    backup_name=$(basename "$selected_backup")

    log_info "Selected backup: $backup_name"

    # Validate backup
    if ! validate_backup "$selected_backup"; then
        exit 1
    fi

    # Confirm recovery
    if [ "$auto_select" = false ]; then
        echo
        read -p "⚠️  This will STOP current services and RESTORE from backup. Continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Recovery cancelled"
            exit 0
        fi
    fi

    # Start recovery
    local start_time=$SECONDS
    send_notification "STARTED" "Disaster recovery started" "$backup_name"

    # Stop current services
    stop_services

    # Perform recovery
    local failed_components=()

    if ! restore_postgres "$selected_backup"; then
        failed_components+=("PostgreSQL")
    fi

    if ! restore_redis "$selected_backup"; then
        failed_components+=("Redis")
    fi

    restore_volumes "$selected_backup"
    restore_config "$selected_backup"

    # Start services
    if start_services && [ ${#failed_components[@]} -eq 0 ]; then
        local duration=$((SECONDS - start_time))
        send_notification "SUCCESS" "Disaster recovery completed successfully" "$backup_name"
        log_success "🎉 Disaster recovery completed successfully!"

        show_recovery_stats "$selected_backup" "$duration"
        exit 0
    else
        local failed_list
        failed_list=$(IFS=', '; echo "${failed_components[*]}")
        send_notification "FAILED" "Disaster recovery completed with failures: $failed_list" "$backup_name"
        log_error "💥 Recovery completed with failures: $failed_list"
        exit 1
    fi
}

# Run main function
main "$@"