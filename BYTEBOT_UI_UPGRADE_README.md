# Bytebot UI Upgrade - Save State & Conversation History

This document captures the current save state of the Bytebot UI upgrade, the
backend additions needed to support the new Desktop/Web/Terminal features, and
a best-effort summary of the conversation history that led to this state.

Last updated: 2025-02-xx

## Overview

The Bytebot UI now has a cohesive dark/light theme, sharper "blocky" styling,
new Desktop and Web experiences, a terminal toggle backed by a PTY service,
and BrowserOS launch wiring through the desktop automation service.

## Conversation History (Best-Effort)

1) **Initial direction**
   - Focused on Bytebot (UI first, not backend).
   - Goal: futuristic desktop app interface with dark/light themes.
   - Requested top nav with tabs + voice wave icon, large centered headline,
     input bar with “Auto”, quick action grid, and floating bottom control strip.

2) **Homepage layout iteration**
   - Embedded nav + control strip inside the main glass window.
   - Added light/dark theme support and explicit toggle.
   - Updated to sharper, blockier styling (less pill/stadium).
   - Removed bunny + speech icon from the bottom strip on the homepage.
   - Wired homepage input and quick actions to create real tasks (backend).

3) **Desktop view**
   - Rebuilt Desktop page to match provided reference screenshot:
     left model list, center live desktop view, right logs, bottom command bar.
   - Added model selection from `/api/tasks/models` and task creation from input.
   - Added light/dark theme styles to Desktop view.
   - Later removed background image use for Desktop and replaced with gradients.

4) **Logo swap**
   - Replaced Bytebot logo with new bunny logo asset (`IMG_5467 copy.png`).
   - Increased logo size across nav/header and tasks pages.

5) **Global styling direction**
   - Changed rounded-pill controls to more squared/edge styling across pages
     (Home, Desktop, Tasks, Settings, nav).

6) **Terminal + Web page**
   - Added a backend terminal gateway in bytebotd using `node-pty`.
   - Added terminal toggle panel in Desktop UI.
   - Added `/web` page to embed the desktop browser view (VNC) and a
     BrowserOS-style history/chat column based on reference image.
   - Added “Web” tab to nav.
   - Wired BrowserOS as a desktop application type so it can be launched.

7) **BrowserOS integration scope**
   - BrowserOS repo already cloned into `/BrowserOS`.
   - Full BrowserOS UI theming not yet applied inside BrowserOS itself.
   - `/web` currently embeds the desktop VNC session and provides a launch
     button for BrowserOS (inside the desktop container).

## Where We Left Off (Exact State)

UI:
- Homepage matches the design spec and creates real tasks.
- Desktop page is rebuilt, themed, blocky, and includes terminal + Web button.
- Web page exists with a VNC browser view and right-side history/chat panel.
- Light/Dark toggle is in the nav and works across pages.
- New bunny logo is in place and scaled up.

Backend:
- bytebotd has a new WebSocket PTY gateway (`/terminal`) for terminal access.
- bytebot-ui server proxies `/api/proxy/terminal` to bytebotd.
- BrowserOS launch is wired through `computer-use` as a supported application.

Not yet done:
- BrowserOS UI theming inside the BrowserOS repo (Chromium fork).
- Actual BrowserOS install/run inside the desktop container with correct WM_CLASS.
- `node-pty` install/build and full runtime verification.

## Where to Resume (Checklist)

1) **Install native dependencies**
   - `cd bytebot/packages/bytebotd && npm install`
   - Confirm `node-pty` builds and `package-lock.json` updates.

2) **Verify terminal backend**
   - Start `bytebotd` on `:9990` and `bytebot-ui` on `:9992`.
   - Open Desktop page → toggle Terminal → run `ls`, `pwd`, `whoami`.
   - If no output, verify `/api/proxy/terminal` WS routing.

3) **Bring BrowserOS online**
   - Ensure BrowserOS is installed inside the desktop container or VM.
   - Set envs:
     - `BROWSEROS_APP_COMMAND` (actual launch command)
     - `BROWSEROS_APP_WMCLASS` (find via `wmctrl -lx`)
   - Go to `/web` → click **Open BrowserOS** → confirm it appears in VNC view.

4) **BrowserOS theming**
   - Navigate to `/BrowserOS` repo.
   - Identify UI entry points to restyle (Chromium UI / BrowserOS overlays).
   - Apply Bytebot dark/light palette + blocky geometry.

5) **Data wiring for /web**
   - Replace placeholder History/Chat with real task logs or events.
   - Decide if `/web` should reflect task execution, LLM logs, or MCP events.

## Unfinished Items (Detailed)

- **BrowserOS UI theming**
  - No edits in `/BrowserOS` yet.
  - Needs a full UI pass to match Bytebot theme.

- **BrowserOS runtime wiring**
  - `computer-use` supports `browseros`, but the launch command/class may not
    match your install. Must set `BROWSEROS_APP_COMMAND` and `BROWSEROS_APP_WMCLASS`.

- **Terminal UX**
  - Current terminal UI is a minimal text console (not xterm.js).
  - If you want a full terminal emulator, integrate `xterm.js` on the client.

- **/web data**
  - Chat input and history are placeholders.
  - Needs actual backend wiring for logs, step history, and chat messages.

- **Runtime validation**
  - No integration tests or manual verification run yet.

## Key UI Changes

- Homepage redesigned with the futuristic control-panel layout and light/dark
  themes. The input and quick actions now create real tasks via the backend.
- Navigation is embedded in the main panel and includes a Light/Dark toggle.
- Buttons and panels are now squarer (rounded-md/rounded-xl instead of pill
  shapes) to match the "edge" request.
- New bunny logo (from `IMG_5467 copy.png`) replaces the old Bytebot mark.

## Desktop Page

- Desktop view rebuilt to match the provided reference, now with:
  - Model selection and logs on the sides.
  - Live VNC view in the center.
  - Command input bar and control pills.
  - Terminal toggle panel (see below).
  - Web quick action button that routes to `/web`.

## Terminal Backend + UI

Backend:
- New PTY Socket.IO gateway at `bytebot/packages/bytebotd/src/terminal`.
- The gateway spawns a shell (`SHELL` or `/bin/bash`) per connection.
- Gateway path: `/terminal` on bytebotd.

UI:
- New terminal panel component: `bytebot/packages/bytebot-ui/src/components/terminal/TerminalPanel.tsx`.
- Desktop page toggles the terminal and opens the desktop Terminal app via
  `openDesktopApplication("terminal")`.

Proxy:
- UI server proxies:
  - `/api/proxy/terminal` -> bytebotd `/terminal` (WebSocket)
  - `/api/proxy/desktop` -> bytebotd base URL (HTTP)

## Web Page (BrowserOS Console)

- New page: `bytebot/packages/bytebot-ui/src/app/web/page.tsx`.
- Layout follows the provided reference image:
  - Large embedded browser window (VNC view).
  - Right-side history and chat column.
  - Open BrowserOS button.
- Works in both dark and light themes.
- Button triggers `openDesktopApplication("browseros")` to launch BrowserOS in
  the desktop container.

## BrowserOS Wiring

BrowserOS is wired as a first-class application in the desktop automation stack.
This is done by extending application enums and tools:

- `bytebot/packages/shared/src/types/computerAction.types.ts`
- `bytebot/packages/bytebotd/src/computer-use/dto/base.dto.ts`
- `bytebot/packages/bytebotd/src/computer-use/computer-use.service.ts`
- `bytebot/packages/bytebotd/src/mcp/computer-use.tools.ts`
- `bytebot/packages/bytebot-agent/src/agent/agent.tools.ts`
- `bytebot/packages/bytebot-agent-cc/src/agent/agent.tools.ts`
- `bytebot/packages/bytebot-agent/src/agent/agent.constants.ts`
- `bytebot/packages/bytebot-agent-cc/src/agent/agent.constants.ts`

Runtime mapping uses:
- `BROWSEROS_APP_COMMAND` (default `browseros`)
- `BROWSEROS_APP_WMCLASS` (default `browseros.BrowserOS`)

## New/Updated Assets

- `bytebot/packages/bytebot-ui/public/bytebot-logo.png`
- `bytebot/packages/bytebot-ui/public/desktop-light.png`
- `bytebot/packages/bytebot-ui/public/desktop-dark.png`

## Config / Env Vars

UI `.env.example` (bytebot-ui):
- `BYTEBOT_DESKTOP_BASE_URL=http://localhost:9990`

bytebotd runtime:
- `BROWSEROS_APP_COMMAND` (optional)
- `BROWSEROS_APP_WMCLASS` (optional)
- `TERMINAL_CWD` (optional)

## Integration Notes (BrowserOS)

- The `/web` page currently embeds the desktop VNC session (`VncViewer`).
- BrowserOS is expected to run *inside* the desktop container and be visible
  in the VNC stream.
- If you want BrowserOS to render directly inside `/web` without VNC,
  BrowserOS would need to expose a web UI surface or devtools stream.
  That integration has not been implemented.

## Commands to Run

- UI dev: `cd bytebot/packages/bytebot-ui && npm run dev`
- Daemon dev: `cd bytebot/packages/bytebotd && npm run start:dev`

## Dependency Changes

bytebotd:
- Added `node-pty` for terminal sessions.

## Testing

No tests were run as part of this update.

## Manual Steps Required

- Install bytebotd dependencies to build `node-pty`:
  - `cd bytebot/packages/bytebotd && npm install`
- Update any lockfiles (expected after installing `node-pty`).
- Ensure BrowserOS is installed in the desktop container and set
  `BROWSEROS_APP_COMMAND` / `BROWSEROS_APP_WMCLASS` to match it.
- If you want BrowserOS UI to match Bytebot theming, you still need to modify
  the BrowserOS repo (not touched here).

## Pending Work (Suggested Next Actions)

1) Verify terminal backend:
   - Start `bytebotd` and `bytebot-ui`.
   - Toggle Terminal in Desktop page and run `ls`, `pwd`, etc.
2) Verify BrowserOS:
   - Start BrowserOS in the desktop container.
   - Set `BROWSEROS_APP_COMMAND` and `BROWSEROS_APP_WMCLASS`.
   - Open `/web` and click “Open BrowserOS”.
3) BrowserOS theming:
   - Identify BrowserOS UI entry points in `/BrowserOS`.
   - Apply Bytebot dark/light palette + blocky styling.
4) Optional UX polish:
   - Connect `/web` “Chat” input to actual task/message stream.
   - Replace placeholder history/chat content with real data.
5) Security/licensing:
    - BrowserOS is AGPL; ensure compliance if distributing modified builds.

## Known Unrelated Changes

There are existing changes in the workspace not created by this update:
- `bytebot/packages/bytebot-ui/src/app/PillHome.tsx`
- `bytebot/packages/bytebot-ui/tsconfig.json`
- `bytebot/packages/bytebot-ui/src/types/global.d.ts`
- `temp_browseros_check/`

## Save State Summary (Change Log)

- Added terminal PTY gateway + UI toggle.
- Added `/web` page with BrowserOS-style layout.
- Wired BrowserOS app launch through computer-use.
- Added Light/Dark theme controls and blockier UI styling across pages.
- Updated logo and embedded task-creation wiring on the homepage.
