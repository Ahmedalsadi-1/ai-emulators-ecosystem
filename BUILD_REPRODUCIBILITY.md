# Bytebot Build & Packaging Guide

This document explains the build processes for Docker, Electron, and local development, and how to ensure reproducible builds.

## Build Flow Overview

### 1. Local Development (Watch Mode)

For active development with hot reload:

```bash
# Start all services in watch mode
npm run dev

# Or start individual services:
cd bytebot/packages/bytebotd && npm run start:dev  # Watch mode with hot reload
cd bytebot/packages/bytebot-agent && npm run start:dev
cd bytebot/packages/bytebot-ui && npm run dev      # Uses tsx for watch mode
```

**Characteristics:**
- Uses `tsx` or `nest start --watch` for hot reload
- Compiles TypeScript on-demand
- Good for rapid development iteration
- NOT suitable for production or packaging

### 2. Docker Production Build

For containerized deployment:

```bash
# Build all services from source (no cached images)
docker-compose -f docker-compose.bytebot-kali.yml build --no-cache

# Start services
docker-compose -f docker-compose.bytebot-kali.yml up
```

**Characteristics:**
- Builds each service once during `docker build`
- Dockerfiles run `npm run build` to compile artifacts
- Compiled artifacts are baked into the image
- `docker run` executes pre-compiled code (no rebuild)
- Uses `--no-cache` to ensure fresh builds

**Docker Build Order:**
1. `bytebotd/Dockerfile` - Builds shared, then bytebotd
2. `bytebot-agent-cc/Dockerfile` - Builds shared, then bytebot-agent-cc
3. `bytebot-ui/Dockerfile` - Builds shared, then bytebot-ui

### 3. Electron Production Build

For desktop application distribution:

```bash
# Option A: Build all, verify, then run Electron
npm run electron:prod

# Option B: Manual steps
npm run build:all              # Build all packages in correct order
node scripts/verify-build.js   # Verify all artifacts exist
npm start                      # Run Electron with compiled artifacts
```

**Characteristics:**
- Uses direct `node` execution (not `npm run`) for compiled artifacts
- Avoids rebuilding on every Electron startup
- Must run `npm run build:all` first to ensure artifacts exist

## Build Dependencies & Order

Critical: Always build in this order (dependencies first):

```
@bytebot/shared → bytebotd → bytebot-agent → bytebot-ui
```

Each package depends on `@bytebot/shared`, so it must be built first.

## Build Verification

Use the verification script to check all artifacts exist:

```bash
node scripts/verify-build.js
```

**Required Artifacts:**
| Path | Description |
|------|-------------|
| `bytebot/packages/shared/dist` | Shared types & utilities |
| `bytebot/packages/bytebotd/dist` | Desktop automation daemon |
| `bytebot/packages/bytebot-agent/dist` | AI agent API server |
| `bytebot/packages/bytebot-ui/.next` | Next.js production build |

## Available npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run build:all` | Build all packages in dependency order |
| `npm run electron:prod` | Build all + verify + run Electron |
| `npm run verify-build` | Verify all build artifacts exist |
| `npm run dist` | Build Electron distribution (DMG/NSIS/AppImage) |
| `npm run dist:mac` | Build for macOS only |
| `npm run dist:linux` | Build for Linux only |
| `npm run dist:win` | Build for Windows only |

## Risks If Build Is Skipped

### Missing `@bytebot/shared/dist`
- **Impact:** All services fail to start
- **Error:** `Cannot find module '@bytebot/shared'` or TypeScript errors
- **Symptoms:** Blank UI, API returns 500, desktop automation fails

### Missing `bytebotd/dist`
- **Impact:** Desktop automation unavailable
- **Error:** `Cannot find module '/bytebot/packages/bytebotd/dist/main'`
- **Symptoms:** Port 9990 not listening, no VNC/web access

### Missing `bytebot-agent/dist`
- **Impact:** AI agent API unavailable
- **Error:** `Cannot find module '/bytebot/packages/bytebot-agent/dist/main'`
- **Symptoms:** Port 9991 not listening, tasks cannot be executed

### Missing `bytebot-ui/.next`
- **Impact:** UI fails to load
- **Error:** Next.js static export missing
- **Symptoms:** White screen, 404 on UI routes, port 9992 not serving

## Docker vs Local Dev Differences

| Aspect | Docker | Local Dev | Electron |
|--------|--------|-----------|----------|
| Build Timing | During `docker build` | On-demand | Pre-launch |
| Execution | Compiled artifacts | Source via tsx | Compiled artifacts |
| Hot Reload | No | Yes | No |
| Reproducible | Yes (if `--no-cache`) | Varies | Yes (if built first) |
| Cache | Docker layer cache | ts-node cache | None |

## Troubleshooting

### "Missing build artifacts" error
```bash
# Fix: Build all packages
npm run build:all
```

### Docker builds old code
```bash
# Fix: Force fresh build
docker-compose -f docker-compose.bytebot-kali.yml build --no-cache
```

### Electron fails to start services
```bash
# Fix: Build first, then run
npm run build:all
node scripts/verify-build.js
npm run electron:prod
```

### Services not talking to each other
Ensure environment variables are set correctly:
- `BYTEBOT_AGENT_BASE_URL=http://localhost:9991` (for UI)
- `BYTEBOT_DESKTOP_BASE_URL=http://bytebot-desktop:9990` (for agent in Docker)
