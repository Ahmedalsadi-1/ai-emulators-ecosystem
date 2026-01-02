# BrowserOS Control Endpoint Configuration

This document explains how to configure the BrowserOS control endpoint for the `/web` page.

## Overview

The `/web` page provides a VNC-based BrowserOS interface. The control endpoint can be configured to point to a specific WebSocket server for BrowserOS control.

## Environment Variable Configuration

### Setting the Endpoint

Set the following environment variable in your `.env` file or system environment:

```bash
# .env file
NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT=ws://localhost:9990/api/websockify
```

### Placeholder Behavior

When `NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT` is not set:
- The system falls back to the default websockify proxy at `/api/proxy/websockify`
- The constant `BROWSEROS_CONTROL_ENDPOINT` will contain the placeholder string `"BROWSEROS_ENDPOINT_PLACEHOLDER"`
- This placeholder is used for identification and debugging purposes

## Implementation Details

### Source Code Location

**File:** `bytebot/packages/bytebot-ui/src/app/web/page.tsx`

```typescript
/**
 * BrowserOS Control Endpoint Configuration
 * =========================================
 *
 * This page provides a VNC-based BrowserOS interface. The control endpoint
 * can be configured via environment variable or will use a placeholder.
 *
 * ENVIRONMENT VARIABLE CONFIGURATION:
 * -----------------------------------
 * Set the following in your environment or .env file:
 *
 *   NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT=ws://192.168.1.100:9990/api/websockify
 *
 * PLACEHOLDER BEHAVIOR:
 * ---------------------
 * - When NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT is not set, the system
 *   falls back to the default websockify proxy at /api/proxy/websockify
 * - The placeholder string "BROWSEROS_ENDPOINT_PLACEHOLDER" is used for
 *   identification and debugging purposes only
 *
 * CONSTANT DEFINITION:
 * --------------------
 * BROWSEROS_CONTROL_ENDPOINT: The WebSocket URL for BrowserOS control
 *   - Environment: process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT
 *   - Fallback: "BROWSEROS_ENDPOINT_PLACEHOLDER"
 */
const BROWSEROS_CONTROL_ENDPOINT =
  process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT ||
  "BROWSEROS_ENDPOINT_PLACEHOLDER";
```

### VNC Viewer Configuration

The VNC viewer is configured with:
- **proxyPath**: `/api/proxy/websockify` (default)
- **viewOnly**: `false` (interactive mode)
- **onStatusChange**: Callback for connection state updates

## Connection States

The interface displays the following connection states:

| State | Indicator Color | Description |
|-------|-----------------|-------------|
| Connecting | Yellow (pulsing) | Establishing WebSocket connection |
| Connected | Green (glowing) | Successfully connected to VNC server |
| Disconnected | Gray | Connection was closed |
| Error | Red (glowing) | Failed to establish connection |

## Controls

The interface provides minimal controls:

1. **Retry** - Refresh and reconnect to the VNC server
2. **Fullscreen/Exit** - Toggle fullscreen mode

## Example Configurations

### Local Development

```bash
NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT=ws://localhost:9990/api/websockify
```

### Remote Server

```bash
NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT=ws://192.168.1.100:9990/api/websockify
```

### Production

```bash
NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT=wss://browseros.example.com/api/websockify
```

## Troubleshooting

### Connection Timeout

If you see "VNC connection timeout":
- Verify the WebSocket server is running
- Check the endpoint URL is correct
- Ensure network connectivity to the server

### Connection Failed

If you see "VNC connection failed":
- Verify the websockify server is running
- Check that the proxy path is correct
- Review server logs for errors

## Related Files

- `/web/page.tsx` - Main BrowserOS interface
- `/components/vnc/VncViewer.tsx` - VNC viewer component
- `/desktop/page.tsx` - Desktop page (for reference)
