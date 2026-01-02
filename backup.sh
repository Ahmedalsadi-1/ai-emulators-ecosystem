#!/bin/bash

# Production Backup Script
# Comprehensive backup system for AI Ecosystem

set -e

# Configuration
BACKUP_ROOT="/opt/ai-ecosystem/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="ai-ecosystem-prod"

# Retention settings
RETENTION_DAYS=30
MAX_BACKUPS=10

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

# Function to create backup directory
create_backup_dir() {
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"

    # Create subdirectories
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/volumes"
    mkdir -p "$BACKUP_DIR/config"
    mkdir -p "$BACKUP_DIR/logs"
}

# Function to backup PostgreSQL database
backup_postgres() {
    log_info "Starting PostgreSQL backup..."

    local container_name="${PROJECT_NAME}_postgres_1"
    local backup_file="$BACKUP_DIR/database/postgres_$TIMESTAMP.sql.gz"

    # Check if container is running
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        log_error "PostgreSQL container not running"
        return 1
    fi

    # Create backup using pg_dumpall for all databases
    log_info "Creating database dump..."
    docker exec "$container_name" pg_dumpall -U admin | gzip > "$backup_file"

    local size
    size=$(du -h "$backup_file" | cut -f1)
    log_success "PostgreSQL backup completed: $size"

    echo "postgres:$backup_file" >> "$BACKUP_DIR/backup_manifest.txt"
}

# Function to backup Redis data
backup_redis() {
    log_info "Starting Redis backup..."

    local container_name="${PROJECT_NAME}_redis_1"
    local backup_file="$BACKUP_DIR/database/redis_$TIMESTAMP.rdb"

    # Check if container is running
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        log_warn "Redis container not running, skipping Redis backup"
        return 0
    fi

    # Copy Redis RDB file
    docker cp "$container_name:/data/dump.rdb" "$backup_file" 2>/dev/null || {
        log_warn "Could not copy Redis RDB file (may not exist)"
        return 0
    }

    local size
    size=$(du -h "$backup_file" | cut -f1)
    log_success "Redis backup completed: $size"

    echo "redis:$backup_file" >> "$BACKUP_DIR/backup_manifest.txt"
}

# Function to backup Docker volumes
backup_volumes() {
    log_info "Starting volume backups..."

    # List of volumes to backup
    local volumes=(
        "postgres_data"
        "redis_data"
        "bytebot_desktop_data"
        "bytebot_agent_data"
        "orchestrator_data"
        "prometheus_data"
        "grafana_data"
        "loki_data"
    )

    for volume in "${volumes[@]}"; do
        local volume_backup="$BACKUP_DIR/volumes/${volume}_$TIMESTAMP.tar.gz"

        log_info "Backing up volume: $volume"

        # Check if volume exists
        if ! docker volume ls --format "{{.Name}}" | grep -q "^${PROJECT_NAME}_${volume}$"; then
            log_warn "Volume $volume not found, skipping"
            continue
        fi

        # Create temporary container to backup volume
        local temp_container="backup_temp_$TIMESTAMP"
        docker run --rm -d --name "$temp_container" \
            -v "${PROJECT_NAME}_${volume}:/data:ro" \
            alpine sleep 30 >/dev/null

        # Wait for container to start
        sleep 2

        # Create tar archive
        docker exec "$temp_container" tar czf - -C /data . > "$volume_backup"

        # Clean up
        docker stop "$temp_container" >/dev/null

        local size
        size=$(du -h "$volume_backup" | cut -f1)
        log_success "Volume $volume backup completed: $size"

        echo "volume:$volume:$volume_backup" >> "$BACKUP_DIR/backup_manifest.txt"
    done
}

# Function to backup configuration files
backup_config() {
    log_info "Starting configuration backup..."

    local config_files=(
        "docker-compose.prod.yml"
        ".env.prod"
        "nginx/nginx.conf"
        "monitoring/prometheus.yml"
        "monitoring/grafana/provisioning"
        "monitoring/loki-config.yml"
        "monitoring/promtail-config.yml"
    )

    local config_backup="$BACKUP_DIR/config/config_$TIMESTAMP.tar.gz"

    # Create temporary directory for config files
    local temp_dir
    temp_dir=$(mktemp -d)

    for config in "${config_files[@]}"; do
        if [ -e "$config" ]; then
            mkdir -p "$temp_dir/$(dirname "$config")"
            cp -r "$config" "$temp_dir/$(dirname "$config")/"
        fi
    done

    # Create archive
    tar czf "$config_backup" -C "$temp_dir" .

    # Clean up
    rm -rf "$temp_dir"

    local size
    size=$(du -h "$config_backup" | cut -f1)
    log_success "Configuration backup completed: $size"

    echo "config:$config_backup" >> "$BACKUP_DIR/backup_manifest.txt"
}

# Function to backup secrets (encrypted)
backup_secrets() {
    log_info "Starting secrets backup..."

    if [ ! -d "secrets" ]; then
        log_warn "Secrets directory not found, skipping secrets backup"
        return 0
    fi

    local secrets_backup="$BACKUP_DIR/config/secrets_$TIMESTAMP.tar.gz.enc"

    # Create encrypted backup of secrets
    tar czf - secrets/ | openssl enc -aes-256-cbc -salt -out "$secrets_backup" -k "${BACKUP_ENCRYPTION_KEY:-default_backup_key}"

    local size
    size=$(du -h "$secrets_backup" | cut -f1)
    log_success "Secrets backup completed: $size"

    echo "secrets:$secrets_backup" >> "$BACKUP_DIR/backup_manifest.txt"
}

# Function to create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."

    {
        echo "Backup Information"
        echo "=================="
        echo "Timestamp: $TIMESTAMP"
        echo "Date: $(date)"
        echo "Backup Directory: $BACKUP_DIR"
        echo "System: AI Ecosystem Production"
        echo ""
        echo "Components Backed Up:"
        echo "- PostgreSQL Database"
        echo "- Redis Data"
        echo "- Docker Volumes"
        echo "- Configuration Files"
        echo "- Secrets (encrypted)"
        echo ""
        echo "File Manifest:"
    } > "$BACKUP_DIR/BACKUP_INFO.txt"
}

# Function to validate backup
validate_backup() {
    log_info "Validating backup integrity..."

    local errors=0

    # Check if all expected files exist
    while IFS= read -r line; do
        if [[ $line == *":"* ]]; then
            local file_path
            file_path=$(echo "$line" | cut -d':' -f2)
            if [ ! -f "$file_path" ]; then
                log_error "Missing backup file: $file_path"
                ((errors++))
            fi
        fi
    done < "$BACKUP_DIR/backup_manifest.txt"

    if [ $errors -eq 0 ]; then
        log_success "Backup validation passed"
        return 0
    else
        log_error "Backup validation failed: $errors errors found"
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."

    # Remove backups older than retention period
    find "$BACKUP_ROOT" -name "*" -type d -mtime +"$RETENTION_DAYS" -exec rm -rf {} + 2>/dev/null || true

    # Keep only the most recent backups
    local backup_count
    backup_count=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | wc -l)

    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        local excess=$((backup_count - MAX_BACKUPS))
        find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" -printf '%T@ %p\n' | sort -n | head -n "$excess" | cut -d' ' -f2- | xargs rm -rf
    fi

    log_success "Cleanup completed"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2

    # Send to Slack if webhook is configured
    if [ -f "secrets/slack_webhook_url.txt" ]; then
        local webhook_url=$(cat secrets/slack_webhook_url.txt)
        local backup_size
        backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "unknown")
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"🗄️ AI Ecosystem Backup: $status\\n$message\\nSize: $backup_size\\nLocation: $BACKUP_DIR\"}" \
             "$webhook_url" 2>/dev/null || true
    fi
}

# Function to show backup statistics
show_stats() {
    log_info "Backup Statistics:"
    echo "=================="
    echo "Backup Location: $BACKUP_DIR"
    echo "Total Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "Files Created: $(find "$BACKUP_DIR" -type f | wc -l)"
    echo "Duration: $SECONDS seconds"
    echo ""
    echo "Contents:"
    find "$BACKUP_DIR" -type f -exec ls -lh {} \; | awk '{print "  " $9 ": " $5}'
}

# Main backup function
main() {
    local start_time=$SECONDS

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                log_info "DRY RUN MODE - No actual backup will be performed"
                exit 0
                ;;
            --help)
                echo "Usage: $0 [--dry-run] [--help]"
                echo "  --dry-run    Show what would be backed up without doing it"
                echo "  --help       Show this help"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    log_info "AI Ecosystem Production Backup"
    log_info "=============================="

    # Pre-flight checks
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    # Create backup directory
    create_backup_dir

    # Perform backups
    send_notification "STARTED" "Backup process started"

    local failed_components=()

    if ! backup_postgres; then
        failed_components+=("PostgreSQL")
    fi

    if ! backup_redis; then
        failed_components+=("Redis")
    fi

    backup_volumes
    backup_config
    backup_secrets
    create_manifest

    # Validate backup
    if validate_backup && [ ${#failed_components[@]} -eq 0 ]; then
        send_notification "SUCCESS" "Backup completed successfully"
        log_success "🎉 Backup completed successfully!"

        # Show statistics
        show_stats

        # Cleanup old backups
        cleanup_old_backups

        exit 0
    else
        local failed_list
        failed_list=$(IFS=', '; echo "${failed_components[*]}")
        send_notification "FAILED" "Backup completed with failures: $failed_list"
        log_error "💥 Backup completed with failures: $failed_list"
        exit 1
    fi
}

# Trap to cleanup on error
trap 'log_error "Backup interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"