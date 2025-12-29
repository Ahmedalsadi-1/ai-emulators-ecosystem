# Bytebot Desktop Application

Electron-based desktop application for Bytebot AI Agent with compact expandable UI.

## Development

### Web Dev Mode
```bash
npm run dev
```
Runs the Next.js development server on http://localhost:9992

### Electron Dev Mode
```bash
npm run dev  # From repo root
```
Runs Electron in development mode, loading from the Next.js dev server and automatically starting all services.

## Building

### Production Build
```bash
npm run build
```
Builds the Next.js application for production.

### Electron Build
```bash
npm run dist  # From repo root
```
Builds the Electron application distributables for macOS, Windows, and Linux.

## Architecture

- **Main Process** (`electron-main.js`): Electron main process with service orchestration
- **Preload Script** (`electron-preload.js`): Secure bridge exposing `window.electronAPI`
- **Renderer Process**: Next.js application with React

## UI Design

- **Compact Expandable UI**: 400x300px initial window expanding to task-specific sizes
- **Glassmorphism**: Blur effects with backdrop filters
- **Custom Title Bar**: Minimize, maximize, close controls with window management
- **Navigation Pills**: Expandable interface with Tasks, Desktop, Web, Settings tabs
- **Responsive Design**: Adapts to different window sizes and use cases

## Platform Support

- **macOS**: DMG distribution with native macOS integration
- **Windows**: NSIS installer with Windows-specific optimizations
- **Linux**: AppImage and DEB packages for broad Linux compatibility
