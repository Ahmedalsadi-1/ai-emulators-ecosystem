#!/bin/bash

# Turix MCP Tool Integration Verification Script
# This script verifies that 'turix' has been correctly added to all tool enums

echo "========================================="
echo "TURIX MCP TOOL INTEGRATION VERIFICATION"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a string exists in a file
check_file() {
  local file=$1
  local search_term=$2
  local description=$3

  echo -n "Checking $description... "
  if grep -q "$search_term" "$file" 2>/dev/null; then
    echo -e "${GREEN}✅ FOUND${NC}"
    return 0
  else
    echo -e "${RED}❌ NOT FOUND${NC}"
    return 1
  fi
}

# Track results
PASSED=0
FAILED=0

echo "1. Checking bytebot-agent tools..."
echo "----------------------------------------"
check_file \
  "/Users/albsheralsadi/future-app/bytebot/packages/bytebot-agent/src/agent/agent.tools.ts" \
  "'turix'," \
  "bytebot-agent agent.tools.ts enum"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
echo ""

echo "2. Checking bytebot-agent-cc tools..."
echo "----------------------------------------"
check_file \
  "/Users/albsheralsadi/future-app/bytebot/packages/bytebot-agent-cc/src/agent/agent.tools.ts" \
  "'turix'," \
  "bytebot-agent-cc agent.tools.ts enum"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
echo ""

echo "3. Checking bytebotd MCP tools..."
echo "----------------------------------------"
check_file \
  "/Users/albsheralsadi/future-app/bytebot/packages/bytebotd/src/mcp/computer-use.tools.ts" \
  "'turix'," \
  "bytebotd MCP tools enum"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
echo ""

echo "4. Checking bytebotd DTO..."
echo "----------------------------------------"
check_file \
  "/Users/albsheralsadi/future-app/bytebot/packages/bytebotd/src/computer-use/dto/base.dto.ts" \
  "TURIX = 'turix'" \
  "bytebotd ApplicationName enum"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
echo ""

echo "5. Checking shared types..."
echo "----------------------------------------"
check_file \
  "/Users/albsheralsadi/future-app/bytebot/packages/shared/src/types/computerAction.types.ts" \
  "| \"turix\"" \
  "shared Application type"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
echo ""

echo "========================================="
echo "VERIFICATION SUMMARY"
echo "========================================="
echo -e "Total Checks: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}Failed: $FAILED${NC}"
  echo ""
  echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
  echo ""
  echo "Turix integration is complete and ready for use."
  echo ""
  echo "AI agents can now:"
  echo "  - Select 'turix' from the computer_application tool"
  echo "  - Launch or switch to Turix screen control"
  echo "  - Perform computer-use actions on Turix window"
else
  echo -e "${RED}Failed: $FAILED${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  SOME CHECKS FAILED${NC}"
  echo ""
  echo "Please review the failed checks above and fix the issues."
fi
echo "========================================="

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
