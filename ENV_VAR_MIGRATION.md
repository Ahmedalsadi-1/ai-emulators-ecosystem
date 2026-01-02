# Environment Variable Migration Guide

## Overview
This document outlines the changes to Bytebot/Kronos environment variables and provides migration steps for existing deployments.

## Changes Summary

### Deprecated Environment Variables
| Deprecated Variable | Replacement | Status |
|---------------------|-------------|--------|
| `KALI_DESKTOP_VNC_URL` | `BYTEBOT_DESKTOP_KALI_VNC_URL` | Remove from configs |
| `BYTEBOT_DESKTOP_VNC_URL` | `BYTEBOT_DESKTOP_KALI_VNC_URL` | Remove from configs |

### New Environment Variables
| Variable | Service | Default | Purpose |
|----------|---------|---------|---------|
| `NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT` | bytebot-ui | http://localhost:9990 | BrowserOS control endpoint URL |
| `RATE_LIMIT_WINDOW_MS` | bytebot-agent | 60000 | Rate limit time window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | bytebot-agent | 100 | Max requests per window |
| `BYTEBOT_AUTH_BYPASS` | bytebot-agent, bytebotd | false | Skip auth checks (dev only) |

## Migration Steps

### Step 1: Update .env Files
Update your `.env` and `.env.example` files:

```bash
# Remove deprecated variables
unset KALI_DESKTOP_VNC_URL
unset BYTEBOT_DESKTOP_VNC_URL

# Add or update standardized variables
export BYTEBOT_DESKTOP_KALI_VNC_URL=ws://localhost:6084/websockify

# Add new variables for bytebot-agent
export RATE_LIMIT_WINDOW_MS=60000
export RATE_LIMIT_MAX_REQUESTS=100
export BYTEBOT_AUTH_BYPASS=false

# Add new variable for bytebot-ui
export NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT=http://localhost:9990
```

### Step 2: Docker Compose Updates
If using Docker Compose, update your environment sections:

```yaml
services:
  bytebot-ui:
    environment:
      - BYTEBOT_DESKTOP_KALI_VNC_URL=ws://host.docker.internal:9993/websockify
      - NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT=http://bytebotd:9990

  bytebot-agent:
    environment:
      - RATE_LIMIT_WINDOW_MS=60000
      - RATE_LIMIT_MAX_REQUESTS=100
      - BYTEBOT_AUTH_BYPASS=false
```

### Step 3: Restart Services
After updating environment variables, restart affected services:

```bash
# Development
npm run dev

# Production
docker-compose restart bytebot-agent bytebot-ui bytebotd
```

## Files Modified

### .env.example Files
- `bytebot/packages/bytebot-ui/.env.example` - Added `NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT`, removed `BYTEBOT_DESKTOP_VNC_URL`
- `bytebot/packages/bytebot-agent/.env.example` - Added `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `BYTEBOT_AUTH_BYPASS`
- `bytebot/packages/bytebotd/.env.example` - Added `BYTEBOT_AUTH_BYPASS`

### Documentation
- `AGENTS.md` - Updated security section with complete env var documentation

## Rollback Instructions

If you need to rollback to previous configuration:

```bash
# Restore deprecated variables (temporary workaround)
export KALI_DESKTOP_VNC_URL=ws://localhost:9993/websockify
export BYTEBOT_DESKTOP_VNC_URL=ws://localhost:6080/websockify

# Disable rate limiting
unset RATE_LIMIT_WINDOW_MS
unset RATE_LIMIT_MAX_REQUESTS

# Disable auth bypass
unset BYTEBOT_AUTH_BYPASS
```

**Note:** The deprecated variables will continue to work in code due to backward compatibility checks, but they will be removed in a future release.

## Security Considerations

### Development
- `BYTEBOT_AUTH_BYPASS=false` is safe for development
- Default rate limits are suitable for local development

### Production
- `BYTEBOT_AUTH_BYPASS` must be `false` in production
- Set `BYTEBOT_AUTH_SECRET` to a strong, random value
- Configure `CORS_ORIGINS` to restrict allowed origins
- Adjust rate limits based on expected traffic

## Support

For issues or questions:
1. Check the [AGENTS.md](AGENTS.md) for updated documentation
2. Review service logs for environment-related errors
3. Verify all required environment variables are set in your deployment
