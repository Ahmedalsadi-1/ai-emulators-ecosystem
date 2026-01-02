# Build Pipeline - Quick Reference

## Deliverables Summary

### 1. Build Flow Diagram

```
[Source Code]
      │
      ▼
┌─────────────────────────────────────────┐
│ STEP 1: Build Shared Package            │
│ cd bytebot/packages/shared && npm run build │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ STEP 2: Build Backend Services          │
│ bytebot-agent: npm run build → dist/    │
│ bytebotd: npm run build → dist/         │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ STEP 3: Build UI                        │
│ bytebot-ui: npm run build → .next/      │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ STEP 4: Verify Builds                   │
│ scripts/verify-builds.js                │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ STEP 5: Package Electron                │
│ electron-builder → dist/Bytebot.dmg     │
└─────────────────────────────────────────┘
      │
      ▼
[Ready for Distribution]
```

---

## Change List

### Critical Changes (Must Do)

| File | Change | Lines |
|------|--------|-------|
| `electron-main.js` | Replace `start:dev` with `dist/main.js` | 88-126 |
| `package.json` | Add verify-builds script | 6-11 |
| New: `scripts/verify-builds.js` | Build verification script | N/A |

### Important Changes (Should Do)

| File | Change | Lines |
|------|--------|-------|
| `docker-compose.bytebot-kali.yml` | Build bytebot-ui from source | 124-143 |
| `docker-compose.bytebot-kali.yml` | Add volume mounts (dev mode) | Optional |

---

## Risk Assessment Summary

### High Risk Items

| Risk | Mitigation |
|------|------------|
| Native modules (uiohook-napi, nut-core) | Test on target OS; use electron-rebuild |
| Next.js static export | Verify all pages are static |
| Service dependencies | Document env vars; provide defaults |

### Medium Risk Items

| Risk | Mitigation |
|------|------------|
| Docker build cache | Multi-stage builds; layer caching |
| Database migration | Include Prisma migration in build |

### Low Risk Items

| Risk | Mitigation |
|------|------------|
| Port conflicts | Already handled by checkPort() |
| Memory usage | Services are lightweight |

---

## Commands Reference

### Local Development
```bash
# Start all services manually
npm run dev

# Build all packages
npm run build

# Package for distribution
npm run dist:mac    # macOS DMG
npm run dist:win    # Windows NSIS
npm run dist:linux  # Linux AppImage
```

### Docker
```bash
# Build all services from source
docker-compose -f docker-compose.bytebot-kali.yml build

# Run full stack
docker-compose -f docker-compose.bytebot-kali.yml up
```

### Build Verification
```bash
# Verify build artifacts exist
node scripts/verify-builds.js

# Or run full build with verification
npm run build
```

---

## Recommendation

**Recommended Approach: Option B (Electron Packaged App)**

Justification:
- Single installer (DMG/AppImage)
- Repeatable builds
- Offline capable
- No Docker dependency for end users
- Pre-compiled = faster startup

**Not Recommended: Option A (Docker full stack)**
- Requires Docker installed
- Complex orchestration
- Harder to distribute

**Consider Later: Option C (Hybrid)**
- Good for developers
- Not for end-user distribution
