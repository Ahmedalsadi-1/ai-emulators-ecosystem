#!/bin/bash

# Health Check and Monitoring Script
# Comprehensive health monitoring for the AI Ecosystem

set -e

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="ai-ecosystem-prod"
HEALTH_CHECK_INTERVAL=30
REPORT_FILE="health-report_$(date +%Y%m%d_%H%M%S).json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Service configurations
declare -A SERVICES=(
    ["postgres"]="5432"
    ["redis"]="6379"
    ["bytebot-desktop"]="9990"
    ["bytebot-agent"]="9991"
    ["bytebot-ui"]="3000"
    ["bytebot-llm-proxy"]="4000"
    ["orchestrator"]="3000"
    ["nginx"]="80"
    ["prometheus"]="9090"
    ["grafana"]="3020"
    ["loki"]="3100"
)

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

# Function to check service health via HTTP
check_http_health() {
    local service=$1
    local port=$2
    local endpoint=${3:-"/health"}
    local timeout=10

    local container_name="${PROJECT_NAME}_${service}_1"

    # Check if container is running
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        echo "{\"status\":\"down\",\"error\":\"container_not_running\"}"
        return 1
    fi

    # Try health check endpoint
    local response
    if response=$(docker exec "$container_name" curl -s -w "%{http_code}" -o /dev/null --max-time "$timeout" "http://localhost${endpoint}" 2>/dev/null); then
        if [ "$response" = "200" ]; then
            echo "{\"status\":\"healthy\",\"response_code\":$response}"
            return 0
        else
            echo "{\"status\":\"unhealthy\",\"response_code\":$response}"
            return 1
        fi
    else
        echo "{\"status\":\"error\",\"error\":\"connection_failed\"}"
        return 1
    fi
}

# Function to check database connectivity
check_database_health() {
    local service=$1

    case $service in
        "postgres")
            if docker exec "${PROJECT_NAME}_${service}_1" pg_isready -U admin -d ai_ecosystem_prod >/dev/null 2>&1; then
                echo "{\"status\":\"healthy\"}"
                return 0
            fi
            ;;
        "redis")
            if docker exec "${PROJECT_NAME}_${service}_1" redis-cli ping | grep -q "PONG"; then
                echo "{\"status\":\"healthy\"}"
                return 0
            fi
            ;;
    esac

    echo "{\"status\":\"unhealthy\"}"
    return 1
}

# Function to get service resource usage
get_resource_usage() {
    local service=$1
    local container_name="${PROJECT_NAME}_${service}_1"

    # Get CPU and memory usage
    local stats
    stats=$(docker stats --no-stream --format "table {{.CPUPerc}},{{.MemUsage}}" "$container_name" 2>/dev/null | tail -n1)

    if [ -n "$stats" ] && [ "$stats" != "CPUPerc,MemUsage" ]; then
        local cpu=$(echo "$stats" | cut -d',' -f1 | sed 's/%//')
        local mem=$(echo "$stats" | cut -d',' -f2 | cut -d'/' -f1 | sed 's/[^0-9.]*//g')
        echo "{\"cpu_percent\":$cpu,\"memory_mb\":$mem}"
    else
        echo "{\"cpu_percent\":0,\"memory_mb\":0}"
    fi
}

# Function to perform comprehensive health check
perform_health_check() {
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local results="{\"timestamp\":\"$timestamp\",\"services\":{}}"
    local overall_status="healthy"
    local failed_services=()

    log_info "Starting comprehensive health check..."

    for service in "${!SERVICES[@]}"; do
        log_info "Checking $service..."

        local port=${SERVICES[$service]}
        local health_data=""

        case $service in
            "postgres"|"redis")
                health_data=$(check_database_health "$service")
                ;;
            *)
                health_data=$(check_http_health "$service" "$port")
                ;;
        esac

        local status
        status=$(echo "$health_data" | jq -r '.status')

        if [ "$status" != "healthy" ]; then
            overall_status="unhealthy"
            failed_services+=("$service")
        fi

        # Get resource usage
        local resources
        resources=$(get_resource_usage "$service")

        # Add to results
        results=$(echo "$results" | jq ".services.\"$service\" = ($health_data | . + $resources)")
    done

    results=$(echo "$results" | jq ".overall_status = \"$overall_status\"")

    echo "$results"
    return 0
}

# Function to generate human-readable report
generate_report() {
    local json_data=$1

    echo "AI Ecosystem Health Report"
    echo "=========================="
    echo "Timestamp: $(echo "$json_data" | jq -r '.timestamp')"
    echo "Overall Status: $(echo "$json_data" | jq -r '.overall_status')"
    echo

    echo "Service Status:"
    echo "$json_data" | jq -r '.services | to_entries[] | "- \(.key): \(.value.status)"'
    echo

    echo "Resource Usage:"
    echo "$json_data" | jq -r '.services | to_entries[] | select(.value.cpu_percent) | "- \(.key): CPU \(.value.cpu_percent)%, Memory \(.value.memory_mb)MB"'
    echo

    # Show failed services
    local failed_services
    failed_services=$(echo "$json_data" | jq -r '.services | to_entries[] | select(.value.status != "healthy") | .key')

    if [ -n "$failed_services" ]; then
        echo "Failed Services:"
        echo "$failed_services" | while read -r service; do
            echo "- $service: $(echo "$json_data" | jq -r ".services.\"$service\".error // \"unknown error\"")"
        done
        echo
    fi
}

# Function to send alert
send_alert() {
    local json_data=$1
    local status=$(echo "$json_data" | jq -r '.overall_status')

    if [ "$status" != "healthy" ]; then
        local failed_count
        failed_count=$(echo "$json_data" | jq -r '[.services | to_entries[] | select(.value.status != "healthy")] | length')

        local message="🚨 AI Ecosystem Health Alert\\nStatus: $status\\nFailed Services: $failed_count\\nTimestamp: $(echo "$json_data" | jq -r '.timestamp')"

        # Send to Slack if webhook is configured
        if [ -f "secrets/slack_webhook_url.txt" ]; then
            local webhook_url=$(cat secrets/slack_webhook_url.txt)
            curl -X POST -H 'Content-type: application/json' \
                 --data "{\"text\":\"$message\"}" \
                 "$webhook_url" 2>/dev/null || true
        fi
    fi
}

# Function to cleanup old reports
cleanup_old_reports() {
    # Keep only last 10 health reports
    find . -name "health-report_*.json" -type f | head -n -10 | xargs -r rm -f
}

# Main function
main() {
    local continuous=false
    local report_only=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --continuous)
                continuous=true
                shift
                ;;
            --report-only)
                report_only=true
                shift
                ;;
            --help)
                echo "Usage: $0 [--continuous] [--report-only] [--help]"
                echo "  --continuous    Run health checks continuously"
                echo "  --report-only   Generate report without alerts"
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

    if [ "$continuous" = true ]; then
        log_info "Starting continuous health monitoring..."
        log_info "Press Ctrl+C to stop"

        while true; do
            local result
            result=$(perform_health_check)

            if [ "$report_only" = false ]; then
                send_alert "$result"
            fi

            generate_report "$result"
            cleanup_old_reports

            sleep "$HEALTH_CHECK_INTERVAL"
            echo
        done
    else
        local result
        result=$(perform_health_check)

        # Save to file
        echo "$result" > "$REPORT_FILE"
        log_success "Health report saved to: $REPORT_FILE"

        # Generate human-readable report
        generate_report "$result"

        if [ "$report_only" = false ]; then
            send_alert "$result"
        fi

        # Exit with appropriate code
        local status
        status=$(echo "$result" | jq -r '.overall_status')
        if [ "$status" = "healthy" ]; then
            exit 0
        else
            exit 1
        fi
    fi
}

# Run main function
main "$@"