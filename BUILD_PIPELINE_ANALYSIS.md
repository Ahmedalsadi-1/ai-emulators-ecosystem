# Build Pipeline Analysis & Recommendations

## Executive Summary

**Current State**: Mixed development/production workflow causing divergence between local dev and Docker/Electron packaging.

**Key Finding**: `electron-main.js` spawns `npm run start:dev` which runs TypeScript in watch mode - this works for local development but is incompatible with stable production packaging.

---

## 1. Docker Divergence Analysis

### Issue 1: Prebuilt UI Image
**File**: `docker-compose.bytebot-kali.yml` (line 125)
```yaml
bytebot-ui:
  image: bytebot-ui:commit8  # ❌ Not built from source
```

**Problem**: Docker uses a stale prebuilt image instead of building from current source code.

**Impact**: Any UI changes after commit8 are not reflected in Docker deployments.

---

### Issue 2: No Volume Mounts for Services
**Current State**:
```yaml
bytebot-desktop:
  build:
    context: ./bytebot/packages
    dockerfile: bytebotd/Dockerfile
  # ❌ No volumes - builds source into image
```

**Problem**: Docker builds source into image, preventing live code updates during development.

---

### Issue 3: Inconsistent Build Order
**Dockerfile Pattern** (all services):
```dockerfile
COPY ./shared ./shared
COPY ./bytebot-X/ ./bytebot-X/
WORKDIR /app/bytebot-X
RUN npm install
RUN npm run build  # Builds shared inline
```

**Problem**: Each Dockerfile builds shared package separately, creating duplicate builds and potential version mismatches.

---

## 2. Electron Build Issues

### Issue 1: Wrong Entry Point for Production

**Current** (`electron-main.js` lines 89-102):
```javascript
{
  name: 'bytebotd',
  command: 'npm',
  args: ['run', 'start:dev'],  // ❌ Watch mode, not production
  cwd: path.join(__dirname, 'bytebot/packages/bytebotd'),
}
```

**Problem**: 
- `start:dev` runs `nest start --watch` (TypeScript watch mode)
- Requires source files, not compiled dist/
- Incompatible with electron-builder packaging

**Should Be**:
```javascript
{
  name: 'bytebotd',
  command: 'node',
  args: ['dist/main.js'],  // ✓ Compiled JavaScript
  cwd: path.join(__dirname, 'bytebot/packages/bytebotd'),
}
```

---

### Issue 2: Service Startup Race Conditions

**Current** (`electron-main.js`):
```javascript
// Waits for port to be ready
await waitForPort(service.port);
```

**Problem**: Services start with `start:dev` which takes time to compile, causing timeouts.

**Solution**: Use pre-compiled dist/ for faster startup.

---

### Issue 3: Missing Build Verification

**Current Build Flow**:
```
npm run build
  → build:backend (bytebot-agent)
  → build:frontend (bytebot-ui export)
  → electron-builder
```

**Problem**: No verification that dist/ folders exist before packaging.

---

## 3. Build Flow Diagram

### Current (Broken) Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Source TypeScript] ──► npm run start:dev ──► [Watch Mode]        │
│       │                                              │              │
│       │                                              ▼              │
│       │                                      [Running Services]     │
│       │                                              │              │
│       │                                              ▼              │
│       └──────────────────────────────────► [Electron Renderer]      │
│                                                                     │
│  Docker: Prebuilt image bytebot-ui:commit8 (stale, no volume mounts)│
│  Electron: Tries to package watch-mode services (fails)            │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Flow (Option B: Electron Packaged App)
```
┌─────────────────────────────────────────────────────────────────────┐
│ BUILD PIPELINE (Repeatable, One-Click)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STEP 1: Build Shared Package                                       │
│  [bytebot/packages/shared/src/**/*.ts] ──► tsc ──► [dist/]          │
│                                                                     │
│  STEP 2: Build Backend Services                                     │
│  [bytebot/packages/bytebot-agent/src/**/*.ts] ──► nest build        │
│  [bytebot/packages/bytebotd/src/**/*.ts] ──► nest build             │
│                                                                     │
│  STEP 3: Build UI                                                   │
│  [bytebot/packages/bytebot-ui/src/**/*.tsx] ──► next build          │
│                                                     │                │
│                                                     ▼                │
│                                            [bytebot-ui/.next/]       │
│                                                                     │
│  STEP 4: Verify Builds                                              │
│  Check dist/main.js exists                                          │
│  Check .next/ output exists                                         │
│                                                                     │
│  STEP 5: Package Electron                                           │
│  [electron-main.js] + [dist/] + [.next/] ──► electron-builder      │
│                                                     │                │
│                                                     ▼                │
│                                            [dist/Bytebot.dmg]       │
│                                                                     │
│  STEP 6: Run Packaged App                                           │
│  [Bytebot.dmg] ──► [Pre-compiled dist/main.js] ──► [Fast Startup]  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Required Changes

### File 1: `/Users/albsheralsadi/future-app/electron-main.js`

**Change**: Modify service spawning to use compiled dist/ instead of start:dev

```javascript
// Lines 88-126 - Replace services array with:
const services = [
  {
    name: 'bytebotd',
    command: 'node',
    args: ['dist/main.js'],
    cwd: path.join(__dirname, 'bytebot/packages/bytebotd'),
    port: 9990,
    env: { ...process.env }
  },
  {
    name: 'bytebot-agent',
    command: 'node',
    args: ['dist/main.js'],
    cwd: path.join(__dirname, 'bytebot/packages/bytebot-agent'),
    port: 9991,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bytebotdb'
    }
  },
  {
    name: 'bytebot-ui',
    command: 'npm',
    args: ['run', 'start'],  // Uses tsx server.ts (production mode)
    cwd: path.join(__dirname, 'bytebot/packages/bytebot-ui'),
    port: 9992,
    env: {
      ...process.env,
      BYTEBOT_DESKTOP_VNC_URL: 'ws://localhost:9990/websockify',
      BYTEBOT_AGENT_BASE_URL: 'http://localhost:9991'
    }
  }
];
```

**Rationale**: Uses compiled dist/main.js instead of watch mode, enabling stable packaging.

---

### File 2: `/Users/albsheralsadi/future-app/package.json`

**Change**: Add build verification and improve build script

```json
{
  "scripts": {
    "prebuild": "npm run verify-builds",
    "verify-builds": "node scripts/verify-builds.js",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend && electron-builder",
    "build:shared": "cd bytebot/packages/shared && npm run build",
    "build:backend": "cd bytebot/packages/bytebot-agent && npm run build && cd ../bytebotd && npm run build",
    "build:frontend": "cd bytebot/packages/bytebot-ui && npm run build",
    // ... existing scripts
  }
}
```

**New File**: `/Users/albsheralsadi/future-app/scripts/verify-builds.js`
```javascript
const path = require('path');
const fs = require('fs');

const requiredPaths = [
  'bytebot/packages/shared/dist/index.js',
  'bytebot/packages/bytebot-agent/dist/main.js',
  'bytebot/packages/bytebotd/dist/main.js',
  'bytebot/packages/bytebot-ui/.next/server/app/index.html'
];

let hasErrors = false;

for (const relPath of requiredPaths) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing: ${relPath}`);
    hasErrors = true;
  } else {
    console.log(`✓ Found: ${relPath}`);
  }
}

if (hasErrors) {
  console.error('\n⚠️  Build verification failed. Run build steps first.');
  process.exit(1);
}

console.log('\n✅ All builds verified!');
```

---

### File 3: `/Users/albsheralsadi/future-app/docker-compose.bytebot-kali.yml`

**Change 1**: Build bytebot-ui from source (lines 124-143)
```yaml
# BEFORE (line 125):
bytebot-ui:
  image: bytebot-ui:commit8

# AFTER:
bytebot-ui:
  build:
    context: ./bytebot/packages
    dockerfile: bytebot-ui/Dockerfile
    args:
      - BYTEBOT_AGENT_BASE_URL=http://bytebot-agent:9991/api
      - BYTEBOT_DESKTOP_VNC_URL=ws://localhost:9990/websockify
  ports:
    - "9992:3000"
  environment:
    - NODE_ENV=production
    - BYTEBOT_AGENT_BASE_URL=http://bytebot-agent:9991/api
    - BYTEBOT_DESKTOP_VNC_URL=ws://localhost:9990/websockify
```

**Change 2**: Add volume mounts for development (optional, for hot reload)
```yaml
bytebotd:
  # ... existing config
  volumes:
    - ./bytebot/packages/bytebotd:/bytebot/bytebotd

bytebot-agent:
  # ... existing config
  volumes:
    - ./bytebot/packages/bytebot-agent:/app/bytebot-agent
```

---

### File 4: `/Users/albsheralsadi/future-app/bytebot/packages/bytebot-ui/package.json`

**Change**: Update build script to ensure production output
```json
{
  "scripts": {
    "build": "npm run build --prefix ../shared && next build --no-lint",
    "export": "npm run build --prefix ../shared && next build --no-lint && next export"
  }
}
```

**Note**: `next export` is deprecated in Next.js 15+. Consider using `output: 'export'` in next.config.ts instead.

---

## 5. Risk Assessment

### High Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Native module compilation** (uiohook-napi, nut-core) | Fails on package | High | Test build on target OS; use electron-rebuild |
| **Next.js static export compatibility** | UI fails to load | Medium | Verify all pages are static; test with `npm run export` |
| **Service dependencies in packaged app** | Services fail to start | Medium | Ensure all env vars documented; provide defaults |

### Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Preload API mismatch** | IPC failures | Low | Preload is simple, verified ✓ |
| **Docker build cache invalidation** | Slow builds | Medium | Use multi-stage builds; optimize layer caching |
| **Database migration needed** | Agent fails to start | Medium | Include Prisma migration in build step |

### Low Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Port conflicts** | Services fail to start | Low | Already handles via checkPort() |
| **Memory usage** (multiple services) | Poor performance | Low | Each service is lightweight |

---

## 6. Pipeline Recommendation

### Recommended: **Option B - Electron Packaged App**

**Justification**:

1. **User Experience**: Single DMG/AppImage installer, "one-click" run
2. **Repeatability**: Same artifacts for dev, staging, production
3. **Isolation**: Services packaged with app, no external dependencies
4. **Offline Capable**: Works without internet after installation
5. **Performance**: Pre-compiled dist/ loads faster than watch mode

**Not Recommended**: Option A (Docker full stack)
- Requires Docker installed on user machine
- Complex multi-container orchestration
- Harder to distribute

**Consider Later**: Option C (Hybrid)
- Good for development, not for distribution
- Can be added later as "developer mode"

---

## 7. Implementation Priority

### Phase 1 (Critical - Week 1)
1. Fix `electron-main.js` to use `dist/main.js` instead of `start:dev`
2. Add build verification script
3. Test full build: `npm run build && npm run dist:mac`

### Phase 2 (Important - Week 2)
1. Update docker-compose.bytebot-kali.yml to build bytebot-ui from source
2. Test Docker build: `docker-compose -f docker-compose.bytebot-kali.yml build`
3. Verify Docker services start correctly

### Phase 3 (Nice to Have - Week 3)
1. Add volume mounts for development workflow
2. Optimize Docker multi-stage builds
3. Create CI/CD pipeline for automated builds

---

## 8. Verification Checklist

After implementing changes, verify:

- [ ] `npm run build` completes without errors
- [ ] `npm run dist:mac` creates valid DMG
- [ ] DMG installs and app launches
- [ ] All three services (9990, 9991, 9992) start within 30 seconds
- [ ] Docker build completes successfully
- [ ] Docker services are accessible on expected ports
