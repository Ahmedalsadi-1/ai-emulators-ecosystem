const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

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

// Cleanup on app quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});