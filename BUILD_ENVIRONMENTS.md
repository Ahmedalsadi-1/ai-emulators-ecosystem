# Build Environments

This document describes the three build environments for Bytebot/Kronos and their differences.

## Overview

| Environment | Build Command | Runtime Command | Mode |
|-------------|---------------|-----------------|------|
| Local Dev | `npm run dev` | `tsx server.ts` | Watch Mode |
| Docker | `docker-compose build` | `npm run start:prod` | Production |
| Electron | `npm run build` | `npm run start:prod` | Production |

## Local Development

**Command**: `npm run dev` (or individual package commands)

**Behavior**:
- Uses `tsx` to run TypeScript directly (no compilation step)
- Watches for file changes and auto-rebuilds
- Suitable for active development with hot reload

**Commands by package**:
```bash
# bytebotd (port 9990)
cd bytebot/packages/bytebotd && npm run start:dev

# bytebot-agent (port 9991)
cd bytebot/packages/bytebot-agent && npm run start:dev

# bytebot-ui (port 9992)
cd bytebot/packages/bytebot-ui && npm run dev
```

## Docker (Production)

**Build Command**: `docker-compose -f docker-compose.bytebot-kali.yml build`

**Runtime**: All services run `npm run start:prod` (compiled JavaScript)

**Behavior**:
- Builds from source code (no pre-built images)
- Compiles TypeScript to JavaScript during Docker build
- Runs production Node.js with compiled output
- Suitable for deployment and CI/CD

**Key Dockerfile commands**:
```dockerfile
RUN npm run build  # Compiles TypeScript
CMD ["npm", "run", "start:prod"]  # Runs compiled code
```

## Electron (Desktop Application)

**Build Command**: `npm run build` (compile first)

**Runtime**: Services started via Electron use `npm run start:prod`

**Behavior**:
- Must compile TypeScript before starting Electron
- Runs compiled production code, not watch mode
- Electron manages service lifecycle
- Suitable for desktop distribution

**Electron startup** (from `electron-main.js`):
```javascript
{
  name: 'bytebot-ui',
  command: 'npm',
  args: ['run', 'start:prod'],  // Uses production mode
  cwd: path.join(__dirname, 'bytebot/packages/bytebot-ui'),
}
```

## Build Artifacts

After a successful build, the following directories should exist:

| Package | Build Artifact | Location |
|---------|---------------|----------|
| @bytebot/shared | Compiled JS | `bytebot/packages/shared/dist/` |
| bytebot-ui | Next.js build | `bytebot/packages/bytebot-ui/.next/` |
| bytebot-agent | NestJS build | `bytebot/packages/bytebot-agent/dist/` |
| bytebotd | NestJS build | `bytebot/packages/bytebotd/dist/` |

## Verification

Use the verification script to ensure all builds are complete:

```bash
node scripts/verify-build.js
```

## Common Issues

### Missing build artifacts
If verification fails, rebuild all packages:
```bash
cd bytebot/packages/shared && npm run build
cd ../bytebot-ui && npm run build
cd ../bytebot-agent && npm run build
cd ../bytebotd && npm run build
```

### Docker build using stale image
Ensure Docker builds from source:
```bash
docker-compose -f docker-compose.bytebot-kali.yml build --no-cache
```

### Electron running in dev mode
Electron should always use `start:prod`, never `start`:
```javascript
// Correct
args: ['run', 'start:prod']

// Incorrect (dev mode with tsx)
args: ['run', 'start']
```
