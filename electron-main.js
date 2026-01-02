const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let childProcesses = [];

// Service orchestrator functions
function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkPort = () => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        console.log(`Port ${port} is ready`);
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(checkPort, 1000);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(checkPort, 1000);
        }
      });

      req.end();
    };

    checkPort();
  });
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 1000
    }, () => {
      resolve(true); // Port is in use
    });

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

async function startServices() {
  const isDev = process.env.NODE_ENV === 'development';
  const autoStartServices = process.env.BYTEBOT_AUTO_START_SERVICES !== 'false'; // Default to true

  console.log(`[Electron] Starting services in ${isDev ? 'development' : 'production'} mode...`);
  console.log(`[Electron] Auto-start services: ${autoStartServices}`);

  if (!autoStartServices) {
    console.log('[Electron] Skipping service auto-start (BYTEBOT_AUTO_START_SERVICES=false)');
    return;
  }

  // Define services to start
  // NOTE: For production, run 'npm run build:all' first, then use these compiled artifacts
  // Using direct node execution instead of 'npm run start:prod' to avoid rebuilds
  const services = [
    {
      name: 'bytebotd',
      command: 'node',
      args: ['dist/main'],
      cwd: path.join(__dirname, 'bytebot/packages/bytebotd'),
      port: 9990,
      env: {
        ...process.env,
        // Only set BROWSEROS_APP_COMMAND if not already set
        ...(process.env.BROWSEROS_APP_COMMAND ? {} : {
          BROWSEROS_APP_COMMAND: 'echo "BrowserOS not available in production"'
        })
      }
    },
    {
      name: 'bytebot-agent',
      command: 'node',
      args: ['dist/main'],
      cwd: path.join(__dirname, 'bytebot/packages/bytebot-agent'),
      port: 9991,
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/bytebotdb'
      }
    },
    {
      name: 'bytebot-ui',
      command: 'node',
      args: ['server.js'],
      cwd: path.join(__dirname, 'bytebot/packages/bytebot-ui'),
      port: 9992,
      env: {
        ...process.env,
        BYTEBOT_DESKTOP_VNC_URL: 'ws://localhost:9990/websockify',
        BYTEBOT_AGENT_BASE_URL: 'http://localhost:9991'
      }
    }
  ];

  // Check which services are already running and filter out those that are
  const servicesToStart = [];
  for (const service of services) {
    const isRunning = await checkPort(service.port);
    if (isRunning) {
      console.log(`[Electron] ${service.name} is already running on port ${service.port}, skipping...`);
    } else {
      servicesToStart.push(service);
    }
  }

  if (servicesToStart.length === 0) {
    console.log('[Electron] All services are already running, skipping startup...');
    return;
  }

  // Start services that aren't already running
  for (const service of servicesToStart) {
    console.log(`[Electron] Starting ${service.name} from ${service.cwd}...`);

    const child = spawn(service.command, service.args, {
      cwd: service.cwd,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...service.env, FORCE_COLOR: '1' }
    });

    child.on('error', (error) => {
      console.error(`[Electron] Failed to start ${service.name}:`, error);
    });

    child.on('exit', (code) => {
      console.log(`[Electron] ${service.name} exited with code ${code}`);
    });

    childProcesses.push(child);
  }

  // Wait for services to be ready
  console.log('[Electron] Waiting for services to be ready...');
  try {
    await Promise.all(servicesToStart.map(service => waitForPort(service.port)));
    console.log('[Electron] All services are ready!');
  } catch (error) {
    console.error('[Electron] Failed to start services:', error);
    // Continue anyway - services might still work
  }
}

function createWindow() {
  // Create the browser window with compact dimensions
  mainWindow = new BrowserWindow({
    width: 400, // Very small width as requested
    height: 300, // Very small height as requested
    minWidth: 350,
    minHeight: 250,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js'),
      // Allow localhost connections for development
      webSecurity: false,
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
    resizable: true,
    show: false, // Don't show until ready
    icon: path.join(__dirname, 'assets/icon.png'), // Add icon if available
  });

  // Load the Next.js app from the running bytebot-ui service
  const loadUrl = 'http://localhost:9992';
  console.log('[Electron] Loading URL:', loadUrl);
  mainWindow.loadURL(loadUrl);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Page finished loading successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron] Page failed to load:', errorCode, errorDescription);
    console.log('[Electron] Retrying in 3 seconds...');
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:9992');
    }, 3000);
  });

  // Open dev tools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Remove the inline script injection since we now use preload
  // The electronAPI is now available via contextBridge in the preload script

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    // Kill all child processes
    childProcesses.forEach(child => {
      try {
        child.kill();
      } catch (error) {
        console.error('Error killing child process:', error);
      }
    });
    childProcesses = [];
  });

  // API is now exposed via preload script

  // Handle minimize/maximize/expand
  ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('close-window', () => {
    mainWindow.close();
  });

  // Handle expand to different tabs
  ipcMain.handle('expand-to-tab', (event, tab) => {
    const sizes = {
      home: { width: 980, height: 560 },
      tasks: { width: 1100, height: 700 },
      desktop: { width: 1300, height: 820 },
      web: { width: 1300, height: 820 },
      settings: { width: 900, height: 660 },
      default: { width: 1000, height: 600 },
    };

    const target = sizes[tab] || sizes.default;
    const bounds = mainWindow.getBounds();
    const x = Math.round(bounds.x + (bounds.width - target.width) / 2);
    const y = Math.round(bounds.y + (bounds.height - target.height) / 2);

    // Animated resize where supported (macOS); ignored elsewhere.
    mainWindow.setBounds(
      { x, y, width: target.width, height: target.height },
      true,
    );
  });
}



// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  console.log('[Electron] App ready, starting services...');
  await startServices();
  
  console.log('[Electron] Creating main window...');
  createWindow();

  // Remove default menu
  Menu.setApplicationMenu(null);

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Electron] Activating app, creating new window...');
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  console.log('[Electron] All windows closed, cleaning up...');
  // Kill all child processes
  childProcesses.forEach(child => {
    try {
      child.kill();
      console.log('[Electron] Killed child process:', child.pid);
    } catch (error) {
      console.error('[Electron] Error killing child process:', error);
    }
  });
  childProcesses = [];
  if (process.platform !== 'darwin') {
    console.log('[Electron] Quitting app...');
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});
