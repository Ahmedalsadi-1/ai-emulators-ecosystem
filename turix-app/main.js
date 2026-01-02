const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  // Create the browser window with floating properties
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    transparent: false, // Changed to false for simpler demo
    webPreferences: {
      nodeIntegration: true, // Enabled for simple demo
      contextIsolation: false
    },
    show: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    skipTaskbar: true,
    titleBarStyle: 'hiddenInset'
  });

  // Load the simple HTML interface
  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for service management
ipcMain.handle('registerService', (event, serviceConfig) => {
  console.log('Registering service:', serviceConfig.name);
  // Store service configurations if needed
});

ipcMain.handle('launchService', async (event, serviceName) => {
  console.log('Launching service:', serviceName);

  try {
    if (serviceName === 'open-interface') {
      // Launch Open-Interface Electron app
      const openInterfacePath = path.join(__dirname, '..', 'open-interface-electron');

      // Check if we're in development or production
      const isDev = process.env.NODE_ENV === 'development';
      const command = isDev ? 'npm run dev' : 'npm start';
      const cwd = openInterfacePath;

      console.log(`Launching Open-Interface from: ${cwd}`);
      console.log(`Command: ${command}`);

      const child = spawn('npm', ['run', isDev ? 'dev' : 'start'], {
        cwd: cwd,
        detached: true,
        stdio: 'ignore'
      });

      child.unref();

      return { success: true, message: 'Open-Interface launched successfully' };
    }

    return { success: false, error: `Unknown service: ${serviceName}` };
  } catch (error) {
    console.error('Failed to launch service:', error);
    return { success: false, error: error.message };
  }
});

// Cleanup on app quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});