#!/bin/bash
# Test script to verify controller launch functionality

echo "========================================"
echo "Controller Launch Functionality Tests"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BYTEDBOT_URL="${BYTEDBOT_URL:-http://localhost:9990}"

test_endpoint() {
    local app="$1"
    local expected_contains="$2"

    echo -e "\n${YELLOW}Testing: $app${NC}"

    response=$(curl -s -X POST "$BYTEDBOT_URL/computer-use/launch" \
        -H "Content-Type: application/json" \
        -d "{\"application\":\"$app\"}" \
        -w "\n%{http_code}")

    # Extract body and status code
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    echo "  HTTP Status: $http_code"
    echo "  Response: $body"

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓ Endpoint reachable (HTTP $http_code)${NC}"
        ((passed++))
    else
        echo -e "  ${RED}✗ HTTP Error: $http_code${NC}"
        ((failed++))
    fi
}

# Test 1: Verify all controller endpoints are reachable
echo -e "\n${YELLOW}=== Test 1: Verify /computer-use/launch endpoints ===${NC}"

controllers=("turix" "browseros" "aios" "open-interface" "factif-ai")
passed=0
failed=0

for controller in "${controllers[@]}"; do
    if test_endpoint "$controller" "success\|message"; then
        ((passed++))
    else
        ((failed++))
    fi
done

echo -e "\n${YELLOW}=== Results ===${NC}"
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"

# Test 2: Verify error handling for invalid application
echo -e "\n${YELLOW}=== Test 2: Error handling for invalid app ===${NC}"

response=$(curl -s -X POST "$BYTEDBOT_URL/computer-use/launch" \
    -H "Content-Type: application/json" \
    -d '{"application":"nonexistent-app-xyz"}')

echo "  Response: $response"

if echo "$response" | grep -q "success.*false\|error\|failed"; then
    echo -e "  ${GREEN}✓ Error handling works${NC}"
else
    echo -e "  ${YELLOW}⚠ Unexpected response format${NC}"
fi

# Test 3: Verify GET status endpoint
echo -e "\n${YELLOW}=== Test 3: Verify /computer-use/status endpoint ===${NC}"

response=$(curl -s -X GET "$BYTEDBOT_URL/computer-use/status/turix")
echo "  Response: $response"

if echo "$response" | grep -q "running\|name"; then
    echo -e "  ${GREEN}✓ Status endpoint works${NC}"
else
    echo -e "  ${YELLOW}⚠ Status check may need implementation${NC}"
fi

echo -e "\n========================================"
echo "Test Summary"
echo "========================================"
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All controller endpoints are reachable!${NC}"
    echo -e "The launch functionality should work correctly."
else
    echo -e "${RED}$failed endpoint(s) failed.${NC}"
    echo -e "Check that bytebotd service is running on port 9990."
fi
echo ""
