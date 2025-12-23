#!/bin/bash

# AI Emulators Ecosystem - Automated Backup Script
# Handles database backups, configuration backups, and volume snapshots

set -e

# Configuration
BACKUP_ROOT="/opt/ai-ecosystem/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
RETENTION_DAYS=30

# Database credentials (from environment)
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_USER=${POSTGRES_USER:-admin}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-secure_password}
REDIS_HOST=${REDIS_HOST:-redis}

# Create backup directory
mkdir -p "$BACKUP_DIR"/{databases,configs,volumes}

echo "Starting backup process at $(date)"
echo "Backup directory: $BACKUP_DIR"

# Function to backup PostgreSQL
backup_postgres() {
    echo "Backing up PostgreSQL databases..."

    # Create backup for each database
    databases=$(docker exec postgres psql -U $POSTGRES_USER -h $POSTGRES_HOST -lqt | cut -d\| -f1 | grep -v template | grep -v postgres | sed 's/ //g')

    for db in $databases; do
        echo "Backing up database: $db"
        docker exec postgres pg_dump -U $POSTGRES_USER -h $POSTGRES_HOST "$db" > "$BACKUP_DIR/databases/${db}_$TIMESTAMP.sql"

        # Compress the backup
        gzip "$BACKUP_DIR/databases/${db}_$TIMESTAMP.sql"
        echo "✓ Database $db backed up successfully"
    done
}

# Function to backup Redis
backup_redis() {
    echo "Backing up Redis data..."

    # Use Redis SAVE command for consistent backup
    docker exec redis redis-cli SAVE

    # Copy the dump file
    docker cp redis:/data/dump.rdb "$BACKUP_DIR/databases/redis_$TIMESTAMP.rdb"

    echo "✓ Redis backup completed"
}

# Function to backup configurations
backup_configs() {
    echo "Backing up configuration files..."

    # Backup docker-compose and monitoring configs
    cp docker-compose.ecosystem.yml "$BACKUP_DIR/configs/"
    cp -r monitoring/ "$BACKUP_DIR/configs/"
    cp -r config/ "$BACKUP_DIR/configs/" 2>/dev/null || true
    cp .env* "$BACKUP_DIR/configs/" 2>/dev/null || true

    # Backup nginx configs
    cp -r nginx/ "$BACKUP_DIR/configs/" 2>/dev/null || true

    echo "✓ Configuration files backed up"
}

# Function to backup Docker volumes
backup_volumes() {
    echo "Backing up Docker volumes..."

    # List of volumes to backup
    volumes=(
        "postgres_data"
        "redis_data"
        "prometheus_data"
        "grafana_data"
        "loki_data"
        "aios_data"
        "bytebot_data"
    )

    for volume in "${volumes[@]}"; do
        echo "Backing up volume: $volume"

        # Create a temporary container to backup the volume
        docker run --rm -v "$volume:/source" -v "$BACKUP_DIR/volumes:/backup" alpine \
            tar czf "/backup/${volume}_$TIMESTAMP.tar.gz" -C /source .

        echo "✓ Volume $volume backed up"
    done
}

# Function to cleanup old backups
cleanup_old_backups() {
    echo "Cleaning up backups older than $RETENTION_DAYS days..."

    # Remove old backup directories
    find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

    echo "✓ Old backups cleaned up"
}

# Function to verify backups
verify_backups() {
    echo "Verifying backup integrity..."

    # Check if backup files exist and are not empty
    find "$BACKUP_DIR" -type f -exec sh -c 'if [ ! -s "$1" ]; then echo "ERROR: Empty backup file: $1"; exit 1; fi' _ {} \;

    # Check database backup integrity
    for sql_file in "$BACKUP_DIR"/databases/*.sql.gz; do
        if [ -f "$sql_file" ]; then
            gunzip -c "$sql_file" | head -n 10 > /dev/null
            echo "✓ Database backup verified: $(basename "$sql_file")"
        fi
    done

    echo "✓ All backups verified successfully"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2

    echo "[$status] $message"

    # Here you could add email notifications, Slack notifications, etc.
    # For now, just log to a file
    echo "$(date): [$status] $message" >> "$BACKUP_ROOT/backup.log"
}

# Function to create backup manifest
create_manifest() {
    echo "Creating backup manifest..."

    cat > "$BACKUP_DIR/manifest.txt" << EOF
AI Emulators Ecosystem Backup Manifest
=====================================

Backup Date: $(date)
Backup ID: $TIMESTAMP
Backup Location: $BACKUP_DIR

Contents:
$(find "$BACKUP_DIR" -type f -exec basename {} \; | sort)

System Information:
- Hostname: $(hostname)
- Docker Version: $(docker --version)
- Docker Compose Version: $(docker-compose --version 2>/dev/null || echo "N/A")

Backup Verification: $(verify_backups 2>&1 | tail -1)
EOF

    echo "✓ Backup manifest created"
}

# Main backup execution
main() {
    local start_time=$(date +%s)

    echo "========================================"
    echo "AI Emulators Ecosystem Backup"
    echo "========================================"

    # Execute backup steps
    backup_postgres
    backup_redis
    backup_configs
    backup_volumes
    create_manifest
    verify_backups

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo "========================================"
    echo "Backup completed successfully!"
    echo "Duration: ${duration}s"
    echo "Backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "========================================"

    send_notification "SUCCESS" "Backup completed successfully. Size: $(du -sh "$BACKUP_DIR" | cut -f1), Duration: ${duration}s"

    # Cleanup old backups
    cleanup_old_backups
}

# Function to restore from backup
restore_backup() {
    local backup_id=$1

    if [ -z "$backup_id" ]; then
        echo "Usage: $0 restore <backup_id>"
        echo "Available backups:"
        ls -la "$BACKUP_ROOT" | grep "^d" | awk '{print $9}' | grep -v "^$"
        exit 1
    fi

    local restore_dir="$BACKUP_ROOT/$backup_id"

    if [ ! -d "$restore_dir" ]; then
        echo "Error: Backup $backup_id not found"
        exit 1
    fi

    echo "Restoring from backup: $backup_id"
    echo "WARNING: This will overwrite existing data!"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        echo "Restore cancelled."
        exit 0
    fi

    # Restore databases
    echo "Restoring databases..."
    for sql_file in "$restore_dir"/databases/*.sql.gz; do
        if [ -f "$sql_file" ]; then
            db_name=$(basename "$sql_file" | sed 's/_.*\.sql\.gz//')
            echo "Restoring database: $db_name"
            gunzip -c "$sql_file" | docker exec -i postgres psql -U $POSTGRES_USER -h $POSTGRES_HOST "$db_name"
        fi
    done

    # Restore Redis
    if [ -f "$restore_dir/databases/redis_$backup_id.rdb" ]; then
        echo "Restoring Redis..."
        docker cp "$restore_dir/databases/redis_$backup_id.rdb" redis:/data/dump.rdb
        docker exec redis redis-cli FLUSHALL
        docker restart redis
    fi

    # Restore volumes
    echo "Restoring volumes..."
    for volume_file in "$restore_dir"/volumes/*.tar.gz; do
        if [ -f "$volume_file" ]; then
            volume_name=$(basename "$volume_file" | sed 's/_.*\.tar\.gz//')
            echo "Restoring volume: $volume_name"
            docker run --rm -v "$volume_name:/target" -v "$restore_dir/volumes:/source" alpine \
                tar xzf "/source/$(basename "$volume_file")" -C /target
        fi
    done

    echo "✓ Restore completed successfully"
    send_notification "SUCCESS" "Restore from backup $backup_id completed successfully"
}

# Script execution
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "list")
        echo "Available backups:"
        ls -la "$BACKUP_ROOT" | grep "^d" | awk '{print $9 " " $6 " " $7 " " $8}' | grep -v "^$"
        ;;
    "verify")
        verify_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|cleanup|list|verify}"
        echo ""
        echo "Commands:"
        echo "  backup   - Create a new backup"
        echo "  restore <id> - Restore from a specific backup"
        echo "  cleanup  - Remove old backups"
        echo "  list     - List available backups"
        echo "  verify   - Verify backup integrity"
        ;;
esac