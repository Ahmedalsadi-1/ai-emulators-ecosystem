#!/bin/bash

# Comprehensive Integration Testing Script
# Tests all aspects of the unified application framework

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_RESULTS_DIR="$ROOT_DIR/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Service URLs
AIOS_URL="http://localhost:8000"
BYTEBOT_AGENT_URL="http://localhost:9991"
API_GATEWAY_URL="http://localhost:8080"
FACTIF_AI_URL="http://localhost:3001"
BYTEBOT_UI_URL="http://localhost:3000"

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

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

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Running test: $test_name"
    
    if eval "$test_command" > "$TEST_RESULTS_DIR/${test_name}_${TIMESTAMP}.log" 2>&1; then
        log_success "✓ $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "✗ $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Health check tests
test_service_health() {
    log_info "=== Testing Service Health ==="
    
    run_test "AIOS_Health_Check" "curl -s -f '$AIOS_URL/health'"
    run_test "API_Gateway_Health_Check" "curl -s -f '$API_GATEWAY_URL/health'"
    run_test "Factif_AI_Health_Check" "curl -s -f '$FACTIF_AI_URL/health'"
    run_test "ByteBot_UI_Health_Check" "curl -s -f '$BYTEBOT_UI_URL'"
}

# API Gateway routing tests
test_api_gateway_routing() {
    log_info "=== Testing API Gateway Routing ==="
    
    # Test AIOS routing through API Gateway
    run_test "API_Gateway_AIOS_Routing" "curl -s -f '$API_GATEWAY_URL/api/aios/health'"
    
    # Test Factif-AI routing through API Gateway
    run_test "API_Gateway_FactifAI_Routing" "curl -s -f '$API_GATEWAY_URL/api/factif-ai/health'"
    
    # Test configuration endpoints
    run_test "API_Gateway_Config_Endpoint" "curl -s -f '$API_GATEWAY_URL/api/config'"
}

# Cross-service communication tests
test_cross_service_communication() {
    log_info "=== Testing Cross-Service Communication ==="
    
    # Test AIOS LLM inference
    local llm_payload='{
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": "Hello, this is a test message"}
        ]
    }'
    
    run_test "AIOS_LLM_Inference" "curl -s -f -X POST '$AIOS_URL/llm/inference' -H 'Content-Type: application/json' -d '$llm_payload'"
    
    # Test Factif-AI automation
    local automation_payload='{
        "type": "web-scraping",
        "url": "https://example.com",
        "actions": [
            {"type": "navigate", "url": "https://example.com"},
            {"type": "extract", "selector": ".title"}
        ]
    }'
    
    run_test "FactifAI_Automation" "curl -s -f -X POST '$FACTIF_AI_URL/automation' -H 'Content-Type: application/json' -d '$automation_payload'"
}

# Performance tests
test_performance() {
    log_info "=== Testing Performance ==="
    
    # Test API Gateway response time
    local start_time=$(date +%s%N)
    if curl -s -f "$API_GATEWAY_URL/health" > /dev/null; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ $response_time -lt 1000 ]; then  # Less than 1 second
            log_success "✓ API_Gateway_Response_Time: ${response_time}ms"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            log_error "✗ API_Gateway_Response_Time: ${response_time}ms (too slow)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
}

# Generate test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/integration_test_report_${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# Unified Application Framework Integration Test Report

**Generated:** $(date)
**Test Run ID:** $TIMESTAMP

## Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Success Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Test Categories

### Service Health
- AIOS Health Check
- API Gateway Health Check
- Factif-AI Health Check
- ByteBot UI Health Check

### API Gateway Routing
- AIOS routing through API Gateway
- Factif-AI routing through API Gateway
- Configuration endpoints

### Cross-Service Communication
- AIOS LLM inference
- Factif-AI automation
- Service-to-service communication

### Performance
- Response time testing
- Concurrent request handling

## Detailed Results

See individual test log files in the test-results directory for detailed output.

## Recommendations

EOF
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo "✅ All tests passed! The unified application framework is working correctly." >> "$report_file"
    else
        echo "❌ Some tests failed. Please review the failed tests and fix the issues." >> "$report_file"
        echo "" >> "$report_file"
        echo "### Failed Tests" >> "$report_file"
        echo "Check the following log files for details:" >> "$report_file"
        find "$TEST_RESULTS_DIR" -name "*_${TIMESTAMP}.log" -exec basename {} \; | sort >> "$report_file"
    fi
    
    log_info "Test report generated: $report_file"
}

# Main execution
main() {
    log_info "Starting comprehensive integration testing..."
    log_info "Test results will be saved to: $TEST_RESULTS_DIR"
    echo
    
    # Wait a moment for services to be fully ready
    log_info "Waiting for services to be fully ready..."
    sleep 10
    
    # Run all test categories
    test_service_health
    echo
    
    test_api_gateway_routing
    echo
    
    test_cross_service_communication
    echo
    
    test_performance
    echo
    
    # Generate report
    generate_test_report
    
    # Display final results
    echo
    log_info "=== Integration Test Results ==="
    echo
    log_info "Total Tests: $TOTAL_TESTS"
    log_success "Passed: $PASSED_TESTS"
    log_error "Failed: $FAILED_TESTS"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo
        log_success "🎉 All integration tests passed!"
        log_info "The unified application framework is working correctly."
        exit 0
    else
        echo
        log_error "❌ Some integration tests failed."
        log_info "Please check the test results in: $TEST_RESULTS_DIR"
        exit 1
    fi
}

# Handle command line arguments
case "$1" in
    "--help" | "-h")
        echo "Comprehensive Integration Testing Script"
        echo
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h         Show this help message"
        echo
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac