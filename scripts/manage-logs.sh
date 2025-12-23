#!/bin/bash

# AI Emulators Ecosystem - Log Management Script
# Handles log rotation, cleanup, and monitoring

set -e

LOG_DIR="/var/log/ai-ecosystem"
BACKUP_DIR="/var/log/ai-ecosystem/backup"
RETENTION_DAYS=30

# Create directories if they don't exist
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Function to rotate logs
rotate_logs() {
    echo "Rotating application logs..."

    # Rotate Docker container logs
    docker-compose -f docker-compose.ecosystem.yml logs --no-color > "$LOG_DIR/ecosystem-$(date +%Y%m%d-%H%M%S).log"

    # Compress old logs
    find "$LOG_DIR" -name "*.log" -mtime +7 -exec gzip {} \;

    # Move compressed logs to backup
    find "$LOG_DIR" -name "*.log.gz" -exec mv {} "$BACKUP_DIR" \;
}

# Function to cleanup old logs
cleanup_logs() {
    echo "Cleaning up old logs (older than $RETENTION_DAYS days)..."

    # Remove logs older than retention period
    find "$BACKUP_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -delete

    # Clean up Docker logs
    docker system prune --volumes -f

    echo "Log cleanup completed."
}

# Function to monitor log sizes
monitor_log_sizes() {
    echo "Monitoring log sizes..."

    # Check Docker log sizes
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

    # Check log directory sizes
    du -sh "$LOG_DIR" "$BACKUP_DIR" 2>/dev/null || true

    # Alert if logs are too large
    LOG_SIZE=$(du -s "$LOG_DIR" 2>/dev/null | cut -f1 || echo 0)
    if [ "$LOG_SIZE" -gt 1073741824 ]; then # 1GB
        echo "WARNING: Log directory size exceeds 1GB"
    fi
}

# Function to show log statistics
show_stats() {
    echo "=== Log Statistics ==="
    echo "Log directory: $LOG_DIR"
    echo "Backup directory: $BACKUP_DIR"
    echo "Retention period: $RETENTION_DAYS days"
    echo ""

    echo "Current log files:"
    ls -la "$LOG_DIR"/*.log 2>/dev/null || echo "No log files found"
    echo ""

    echo "Backup log files:"
    ls -la "$BACKUP_DIR"/*.log.gz 2>/dev/null | wc -l | xargs echo "Compressed log files:"
    echo ""

    echo "Disk usage:"
    df -h "$LOG_DIR" 2>/dev/null || echo "Unable to check disk usage"
}

# Main script logic
case "${1:-help}" in
    "rotate")
        rotate_logs
        ;;
    "cleanup")
        cleanup_logs
        ;;
    "monitor")
        monitor_log_sizes
        ;;
    "stats")
        show_stats
        ;;
    "full")
        rotate_logs
        cleanup_logs
        monitor_log_sizes
        show_stats
        ;;
    "help"|*)
        echo "Usage: $0 {rotate|cleanup|monitor|stats|full|help}"
        echo ""
        echo "Commands:"
        echo "  rotate   - Rotate current logs and compress old ones"
        echo "  cleanup  - Remove logs older than retention period"
        echo "  monitor  - Check log sizes and system resources"
        echo "  stats    - Show log statistics and disk usage"
        echo "  full     - Run all maintenance tasks"
        echo "  help     - Show this help message"
        ;;
esac