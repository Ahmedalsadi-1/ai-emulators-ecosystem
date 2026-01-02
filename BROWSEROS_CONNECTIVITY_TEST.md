# BrowserOS Connectivity Test Guide

## Quick Test Steps

1. **Start the services:**
   ```bash
   # Start bytebotd (desktop service)
   cd bytebot/packages/bytebotd
   npm run start:dev
   
   # Start bytebot-agent (backend)
   cd bytebot/packages/bytebot-agent  
   npm run start:dev
   
   # Start bytebot-ui (frontend)
   cd bytebot/packages/bytebot-ui
   npm run dev
   ```

2. **Navigate to the web tab:**
   - Open http://localhost:9992 in your browser
   - Click on the "Web" tab in the navigation

3. **Test the connection states:**
   - Initial state should show "Offline" status
   - Connection attempt should show logs in the "Code Log" panel
   - Any errors should appear in the red error panel
   - VNC viewer should show connection status

## Expected Behavior

### Before Fix:
- Started with "Connected" status even when not connected
- Vague error messages in logs
- No visual error feedback
- VNC errors not shown to user

### After Fix:
- Starts with "Offline" status
- Detailed error messages with specific failure reasons
- Red error panel shows connection issues
- VNC viewer shows connection errors with retry button
- Environment variable warnings in success messages

## Required Environment Variables

### For bytebotd (Desktop Service):
```bash
# Required for BrowserOS launch command
BROWSEROS_APP_COMMAND=browseros  # or custom path to BrowserOS executable

# Required for VNC connection  
BYTEBOT_DESKTOP_VNC_URL=ws://localhost:5900  # VNC server URL

# Optional: Custom BrowserOS window class
BROWSEROS_APP_WMCLASS=browseros.BrowserOS
```

### For bytebot-agent (Backend):
```bash
# Required to connect to bytebotd service
BYTEBOT_DESKTOP_BASE_URL=http://localhost:9990

# API Keys for AI models (at least one recommended)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

### For bytebot-ui (Frontend):
```bash
# Optional: Custom API proxy settings
NEXT_PUBLIC_API_URL=http://localhost:9991
```

## Common Issues & Solutions

### 1. "bytebotd service may not be running"
- **Solution:** Start bytebotd service on port 9990
- **Check:** `curl http://localhost:9990/health`

### 2. "BrowserOS application may not be installed"
- **Solution:** Install BrowserOS or set BROWSEROS_APP_COMMAND to correct path
- **Example:** `BROWSEROS_APP_COMMAND=/path/to/browseros`

### 3. "VNC connection timeout"
- **Solution:** Ensure VNC server is running and accessible
- **Check:** `BYTEBOT_DESKTOP_VNC_URL` is correct

### 4. "websockify server may be down"
- **Solution:** Start websockify proxy service
- **Check:** WebSocket connection to `/api/proxy/websockify`

## Testing Scenarios

### Test 1: Normal Connection
1. All services running
2. BrowserOS installed
3. Expected: Success with any warnings

### Test 2: Missing bytebotd
1. Stop bytebotd service
2. Try to connect
3. Expected: Clear error about service not running

### Test 3: Missing BrowserOS
1. Set invalid BROWSEROS_APP_COMMAND
2. Try to connect  
3. Expected: Error about application launch failure

### Test 4: VNC Connection Issues
1. Stop VNC/websockify service
2. Expected: VNC error panel with retry option

## Verification Commands

```bash
# Test backend endpoint
curl -X POST http://localhost:9991/api/tasks/browseros/connect

# Test VNC WebSocket connection
wscat -c ws://localhost:9992/api/proxy/websockify

# Check environment variables
env | grep -E "(BROWSEROS|BYTEBOT)"
```

## Troubleshooting Checklist

- [ ] All services running on correct ports
- [ ] Environment variables set correctly  
- [ ] BrowserOS installed and accessible
- [ ] VNC server running
- [ ] Websockify proxy configured
- [ ] Network/firewall allowing WebSocket connections
- [ ] Browser console for any JavaScript errors
