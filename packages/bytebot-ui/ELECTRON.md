# KRONOS Desktop Application

Electron-based desktop application with Floating Pill UI aesthetic for KRONOS AI Agent.

## Development

### Web Dev Mode
```bash
npm run dev
```
Runs the Next.js development server on http://localhost:9992

### Electron Dev Mode
```bash
npm run electron:dev
```
Runs Electron in development mode, loading from the Next.js dev server.

## Building

### Production Build
```bash
npm run build
```
Builds the Next.js application for production.

### Electron Build
```bash
npm run electron:build
```
Builds the Electron application distributables for macOS, Windows, and Linux.

## Architecture

- **Main Process** (`electron/main.ts`): Electron main process
- **Preload Script** (`electron/preload.ts`): Secure bridge between main and renderer
- **Renderer Process**: Next.js application with React

## UI Design

- **Floating Pill Aesthetic**: Centered pill-shaped interface
- **Glassmorphism**: Blur effects with 85% opacity
- **Transparent Window**: Frameless window with pure black background
- **Drag Region**: Entire pill is draggable
- **No Scrollbars**: Clean, minimalist design
- **Inner Border**: Subtle 1px white/5 border for depth

## Platform Support

- **macOS**: DMG distribution, dock menu, Cmd+ shortcuts
- **Windows**: NSIS installer
- **Linux**: AppImage and DEB packages
