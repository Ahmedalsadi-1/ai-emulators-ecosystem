# KRONOS-OS V2 Implementation Plan

**Generated:** January 6, 2026
**Purpose:** Systematic implementation of KRONOS-OS V2 features

---

## Current State Analysis

### ✅ Phase 1: Desktop Consolidation - ALREADY SATISFIED
All 3 desktop services already use `ghcr.io/bytebot-ai/bytebot-desktop:edge`:
- `bytebot-desktop` (port 9990)
- `bytebot-desktop-debian` (port 9995)
- `bytebot-desktop-kali` (port 9993)

**Action:** No changes needed. Add dynamic desktop type detection.

---

## Implementation Tasks

### Task 1.1: Add Dynamic Desktop Type Detection
**File:** `bytebot/docker/bytebot-desktop.Dockerfile`
**Changes:**
- Add environment variable for desktop type
- Configure based on DESKTOP_TYPE (primary, debian, kali)

### Task 1.2: GBox Integration (Android + Browser)
**Files to create:**
- `bytebot/packages/bytebotd/src/gbox/gbox.integration.ts`
- `bytebot/docker/bytebot-desktop.Dockerfile` (update)

**Changes:**
- Add GBox CLI installation to desktop Dockerfile
- Configure Android emulator support
- Add Chromium browser from GBox

### Task 1.3: Replace BrowserOS with GBox Chromium
**Files to modify:**
- `bytebot/docker/docker-compose.full.yml`
- `bytebot/packages/bytebot-ui/src/app/web/page.tsx`

**Changes:**
- Remove browseros-desktop service
- Add GBox Chromium service
- Update UI to use new browser

### Task 1.4: Factif-AI Pattern Extraction
**Files to examine:**
- `factif-ai/backend/src/services/`
- `factif-ai/docker/`

**Patterns to extract:**
- Service orchestration
- Browser automation
- Docker configs

### Task 1.5: Chat Extension UI (Major Refactor)
**Files to create:**
- `bytebot/packages/bytebot-ui/src/components/extension/ExtensionButton.tsx`
- `bytebot/packages/bytebot-ui/src/components/extension/ChatDrawer.tsx`
- `bytebot/packages/bytebot-ui/src/components/extension/AgentFeedPanel.tsx`
- `bytebot/packages/bytebot-ui/src/components/extension/ToolTracePanel.tsx`
- `bytebot/packages/bytebot-ui/src/components/extension/ControllersPanel.tsx`
- `bytebot/packages/bytebot-ui/src/components/extension/ChatSpacePanel.tsx`

**Files to modify:**
- `bytebot/packages/bytebot-ui/src/app/desktop/page.tsx`

---

## Execution Order

1. **Immediate:** Task 1.1 (Dynamic desktop type)
2. **Parallel:** Tasks 1.2 + 1.3 (GBox integration)
3. **Background:** Task 1.4 (Factif-AI extraction)
4. **Last:** Task 1.5 (Chat Extension UI)

---

## Success Metrics

| Task | Metric | Target |
|------|--------|--------|
| 1.1 | Desktop type detection | All 3 selections work |
| 1.2 | Android apps launchable | 100% success rate |
| 1.3 | Browser replacement | /web tab works |
| 1.4 | Patterns extracted | 5+ patterns applied |
| 1.5 | Drawer animations | 60fps smooth |

---

## Testing Strategy

```bash
# After all changes:
docker-compose -f docker-compose.ecosystem.yml up -d

# Test desktop selections
curl http://localhost:9992/api/proxy/tasks/models

# Test Android within desktop
curl http://localhost:9990/gbox/status

# Test browser replacement
curl -I http://localhost:9992/web

# Test UI drawers
# Manual browser testing required
```

---

## Rollback Plan

If issues arise:
```bash
# Revert docker-compose
git checkout bytebot/docker/docker-compose.full.yml

# Revert UI changes
git checkout bytebot/packages/bytebot-ui/src/app/desktop/page.tsx
```
