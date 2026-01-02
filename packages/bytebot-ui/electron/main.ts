/**
 * Bytebot Electron Main Process
 * 
 * Main entry point for the Bytebot desktop application.
 * Manages service orchestration, window creation, and IPC communication.
 */

import { app, BrowserWindow, Menu, ipcMain, IpcMainInvokeEvent, WebContents } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ServiceConfig {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  port: number;
  env?: Record<string, string>;
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TabSizeConfig {
  [key: string]: { width: number; height: number };
}

// ============================================================================
// Global State
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let childProcesses: ChildProcess[] = [];
let isQuitting = false;

// ============================================================================
// Configuration
// ============================================================================

const SERVICES: ServiceConfig[] = [
  {
    name: 'bytebotd',
    command: 'node',
    args: ['dist/main'],
    cwd: path.join(__dirname, '..', '..', 'bytebotd'),
    port: 9990,
    env: {
      ...process.env,
      BROWSEROS_APP_COMMAND: process.env.BROWSEROS_APP_COMMAND || 'echo "BrowserOS not available"',
    },
  },
  {
    name: 'bytebot-agent',
    command: 'node',
    args: ['dist/main'],
    cwd: path.join(__dirname, '..', '..', 'bytebot-agent'),
    port: 9991,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bytebotdb',
    },
  },
  {
    name: 'bytebot-ui',
    command: 'node',
    args: ['server.js'],
    cwd: path.join(__dirname, '..'),
    port: 9992,
    env: {
      ...process.env,
      BYTEBOT_DESKTOP_VNC_URL: process.env.BYTEBOT_DESKTOP_VNC_URL || 'ws://localhost:9990/websockify',
      BYTEBOT_AGENT_BASE_URL: process.env.BYTEBOT_AGENT_BASE_URL || 'http://localhost:9991',
    },
  },
];

const TAB_SIZE_CONFIG: TabSizeConfig = {
  home: { width: 980, height: 560 },
  tasks: { width: 1100, height: 700 },
  desktop: { width: 1300, height: 820 },
  web: { width: 1300, height: 820 },
  settings: { width: 900, height: 660 },
  default: { width: 1000, height: 600 },
};

const WINDOW_DEFAULTS = {
  width: 400,
  height: 300,
  minWidth: 350,
  minHeight: 250,
};

// ============================================================================
// Port Utilities
// ============================================================================

/**
 * Check if a port is available (not in use)
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: '/',
        method: 'GET',
        timeout: 1000,
      },
      () => {
        resolve(true); // Port is in use
      }
    );

    req.on('error', () => {
      resolve(false); // Port is free
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false); // Port is free
    });

    req.end();
  });
}

/**
 * Wait for a port to become available
 */
async function waitForPort(port: number, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = 1000;

    const checkPort = () => {
      const req = http.request(
        {
          hostname: 'localhost',
          port,
          path: '/',
          method: 'GET',
          timeout: 2000,
        },
        () => {
          console.log(`[Electron] Port ${port} is ready`);
          resolve();
        }
      );

      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(checkPort, checkInterval);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(checkPort, checkInterval);
        }
      });

      req.end();
    };

    checkPort();
  });
}

// ============================================================================
// Service Management
// ============================================================================

/**
 * Start a single service
 */
function startService(config: ServiceConfig): ChildProcess {
  const { name, command, args, cwd, env } = config;

  console.log(`[Electron] Starting ${name} from ${cwd}`);

  const child = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env, FORCE_COLOR: '1' },
  });

  // Handle stdout
  child.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });

  // Handle stderr
  child.stderr?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`[${name}] ${output}`);
    }
  });

  // Handle spawn errors
  child.on('error', (error) => {
    console.error(`[Electron] Failed to start ${name}:`, error.message);
  });

  // Handle exit
  child.on('exit', (code) => {
    if (!isQuitting) {
      console.log(`[Electron] ${name} exited with code ${code}`);
    }
  });

  childProcesses.push(child);
  return child;
}

/**
 * Start all required services
 */
async function startServices(): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development';
  const autoStartServices = process.env.BYTEBOT_AUTO_START_SERVICES !== 'false';

  console.log(`[Electron] Starting services in ${isDev ? 'development' : 'production'} mode`);
  console.log(`[Electron] Auto-start services: ${autoStartServices}`);

  if (!autoStartServices) {
    console.log('[Electron] Skipping service auto-start (BYTEBOT_AUTO_START_SERVICES=false)');
    return;
  }

  // Check which services are already running
  const servicesToStart: ServiceConfig[] = [];

  for (const service of SERVICES) {
    const isRunning = await isPortInUse(service.port);
    if (isRunning) {
      console.log(`[Electron] ${service.name} already running on port ${service.port}, skipping...`);
    } else {
      servicesToStart.push(service);
    }
  }

  if (servicesToStart.length === 0) {
    console.log('[Electron] All services already running, skipping startup...');
    return;
  }

  // Start required services
  console.log(`[Electron] Starting ${servicesToStart.length} service(s)...`);

  for (const service of servicesToStart) {
    startService(service);
  }

  // Wait for all services to be ready
  console.log('[Electron] Waiting for services to be ready...');

  try {
    await Promise.all(servicesToStart.map((service) => waitForPort(service.port)));
    console.log('[Electron] All services are ready!');
  } catch (error) {
    console.error('[Electron] Failed to start some services:', error);
    // Continue anyway - services might still work
  }
}

/**
 * Stop all child processes gracefully
 */
function stopAllServices(): void {
  console.log('[Electron] Stopping all services...');

  for (const child of childProcesses) {
    try {
      // Send SIGTERM for graceful shutdown
      if (process.platform === 'win32') {
        child.kill('SIGTERM');
      } else {
        child.kill('SIGTERM');
      }
      console.log(`[Electron] Killed process: ${child.pid}`);
    } catch (error) {
      console.error(`[Electron] Error killing process:`, error);
    }
  }

  childProcesses = [];
}

// ============================================================================
// Window Management
// ============================================================================

/**
 * Get the appropriate URL to load based on environment
 */
function getLoadUrl(): string {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    return 'http://localhost:9992';
  }

  // Production: load from file system
  const prodPath = path.join(__dirname, '..', 'out', 'index.html');
  return `file://${prodPath}`;
}

/**
 * Create the main application window
 */
function createWindow(): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development';
  const loadUrl = getLoadUrl();

  console.log(`[Electron] Loading URL: ${loadUrl}`);

  // Create the browser window
  mainWindow = new BrowserWindow({
    ...WINDOW_DEFAULTS,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev, // Disable in dev for local development
      allowRunningInsecureContent: isDev,
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
    resizable: true,
    show: false, // Don't show until ready
    backgroundColor: '#000000',
    icon: path.join(__dirname, '..', '..', '..', 'assets', 'icon.png'),
  });

  // Load the application
  mainWindow.loadURL(loadUrl).catch((error) => {
    console.error('[Electron] Failed to load URL:', error);
  });

  // Handle page load events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Page finished loading successfully');
  });

  mainWindow.webContents.on('did-fail-load', (_event: Event, errorCode: number, errorDescription: string) => {
    console.error(`[Electron] Page failed to load: ${errorCode} - ${errorDescription}`);
    
    // Retry loading in dev mode
    if (isDev) {
      console.log('[Electron] Retrying in 3 seconds...');
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadURL(loadUrl).catch(console.error);
        }
      }, 3000);
    }
  });

  // Open dev tools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Setup IPC handlers for renderer communication
 */
function setupIpcHandlers(): void {
  // Window control handlers
  ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('close-window', () => {
    mainWindow?.close();
  });

  ipcMain.handle('restore-window', () => {
    mainWindow?.restore();
  });

  // Tab expansion handler
  ipcMain.handle('expand-to-tab', (_event: IpcMainInvokeEvent, tab: string) => {
    if (!mainWindow) return;

    const targetSize = TAB_SIZE_CONFIG[tab] || TAB_SIZE_CONFIG.default;
    const currentBounds = mainWindow.getBounds();

    // Center the new window
    const x = Math.round(currentBounds.x + (currentBounds.width - targetSize.width) / 2);
    const y = Math.round(currentBounds.y + (currentBounds.height - targetSize.height) / 2);

    // Animate resize where supported (macOS)
    mainWindow.setBounds({ x, y, width: targetSize.width, height: targetSize.height }, true);
  });

  // Get window bounds
  ipcMain.handle('get-window-bounds', () => {
    if (!mainWindow) return null;
    return mainWindow.getBounds();
  });

  // Set window bounds
  ipcMain.handle('set-window-bounds', (_event: IpcMainInvokeEvent, bounds: WindowBounds) => {
    if (!mainWindow) return false;
    mainWindow.setBounds(bounds, true);
    return true;
  });

  // Service status handler
  ipcMain.handle('get-service-status', async () => {
    const status: { [key: string]: boolean } = {};
    for (const service of SERVICES) {
      status[service.name] = await isPortInUse(service.port);
    }
    return status;
  });

  // Restart service handler
  ipcMain.handle('restart-service', async (_event: IpcMainInvokeEvent, serviceName: string) => {
    const service = SERVICES.find((s) => s.name === serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    // Kill existing process for this service
    const existingProcess = childProcesses.find(
      (cp) => cp.spawnfile?.includes(service.name) || cp.spawnfile?.includes(service.cwd)
    );
    if (existingProcess) {
      existingProcess.kill('SIGTERM');
      // Remove from tracking
      childProcesses = childProcesses.filter((cp) => cp !== existingProcess);
    }

    // Start the service again
    startService(service);

    // Wait for it to be ready
    await waitForPort(service.port);
    return true;
  });

  // App info handler
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      isDev: process.env.NODE_ENV === 'development',
    };
  });

  // Clipboard handlers
  ipcMain.handle('clipboard-write', (_event: IpcMainInvokeEvent, text: string) => {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
  });

  ipcMain.handle('clipboard-read', () => {
    const { clipboard } = require('electron');
    return clipboard.readText();
  });

  // Environment handlers
  ipcMain.handle('set-env', (_event: IpcMainInvokeEvent, key: string, value: string) => {
    process.env[key] = value;
    return true;
  });

  // Console handlers (for development logging)
  ipcMain.handle('console-log', (_event: IpcMainInvokeEvent, args: unknown[]) => {
    console.log('[Renderer]', ...args);
  });

  ipcMain.handle('console-error', (_event: IpcMainInvokeEvent, args: unknown[]) => {
    console.error('[Renderer]', ...args);
  });

  ipcMain.handle('console-warn', (_event: IpcMainInvokeEvent, args: unknown[]) => {
    console.warn('[Renderer]', ...args);
  });

  // Error handler
  ipcMain.handle('renderer-error', (_event: IpcMainInvokeEvent, error: { type: string; message: string; stack?: string }) => {
    console.error(`[Renderer Error] ${error.type}: ${error.message}`, error.stack || '');
  });
}

// ============================================================================
// App Lifecycle
// ============================================================================

/**
 * Cleanup on app quit
 */
function cleanup(): void {
  isQuitting = true;
  stopAllServices();
}

/**
 * Setup application menu
 */
function setupMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Bytebot',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================================
// Main Entry Point
// ============================================================================

// Register IPC handlers
setupIpcHandlers();

// Handle app events
app.whenReady().then(async () => {
  console.log('[Electron] App ready');

  // Start services
  await startServices();

  // Create main window
  createWindow();

  // Setup menu
  setupMenu();

  // Handle activate event (macOS dock click)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Electron] Activating app, creating new window...');
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

// Handle all windows closed
app.on('window-all-closed', () => {
  console.log('[Electron] All windows closed');
  cleanup();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit
app.on('will-quit', () => {
  console.log('[Electron] App will quit');
  cleanup();
});

// Handle web contents created
app.on('web-contents-created', (_event: Electron.Event, contents: WebContents) => {
  contents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught exception:', error);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error('[Electron] Unhandled rejection:', reason);
});
