#!/bin/bash

# Bytebot Desktop Automation API Test Script
# This script demonstrates various computer control operations

API_URL="http://localhost:9990"
CONTENT_TYPE="Content-Type: application/json"

echo "🖥️  Bytebot Desktop Automation API Test"
echo "======================================"

# Function to make API calls
call_api() {
    local action=$1
    local data=$2
    echo ""
    echo "Testing: $action"
    echo "Data: $data"
    curl -s -X POST "$API_URL/computer-use" \
         -H "$CONTENT_TYPE" \
         -d "$data" | jq '.' 2>/dev/null || echo "Response received"
}

# Health check
echo ""
echo "🏥 Health Check:"
curl -s "$API_URL/health" | jq '.' 2>/dev/null || echo "Service is running"

# Wait a moment for services to be ready
sleep 2

# Test mouse operations
call_api "move_mouse" '{"action": "move_mouse", "coordinates": {"x": 100, "y": 100}}'

call_api "cursor_position" '{"action": "cursor_position"}'

call_api "click_mouse" '{"action": "click_mouse", "button": "left", "coordinates": {"x": 200, "y": 200}, "clickCount": 1}'

# Test keyboard operations
call_api "type_text" '{"action": "type_text", "text": "Hello from Bytebot API!"}'

call_api "press_keys" '{"action": "press_keys", "keys": ["Return"]}'

# Test screenshot
call_api "screenshot" '{"action": "screenshot"}'

# Test file operations
call_api "write_file" '{"action": "write_file", "path": "/home/bytebot/Desktop/api_test.txt", "data": "SGVsbG8gZnJvbSBCeXRlYm90IEFQSSB0ZXN0IQ=="}'

call_api "read_file" '{"action": "read_file", "path": "/home/bytebot/Desktop/api_test.txt"}'

# Test application launch
call_api "application" '{"action": "application", "application": "firefox"}'

# Test timing
call_api "wait" '{"action": "wait", "duration": 1000}'

echo ""
echo "✅ API tests completed!"
echo ""
echo "📋 Available actions tested:"
echo "  - move_mouse: Move cursor to coordinates"
echo "  - cursor_position: Get current mouse position"
echo "  - click_mouse: Perform mouse clicks"
echo "  - type_text: Type text strings"
echo "  - press_keys: Press keyboard keys"
echo "  - screenshot: Capture screen image"
echo "  - write_file: Write files (base64 encoded)"
echo "  - read_file: Read file contents"
echo "  - application: Launch applications"
echo "  - wait: Add delays between actions"
echo ""
echo "🔗 Additional endpoints:"
echo "  - VNC Web: http://localhost:6080 (password: bytebot)"
echo "  - Direct VNC: localhost:5900 (password: bytebot)"
echo "  - API Docs: Check the README for full action reference"