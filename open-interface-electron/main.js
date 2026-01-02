const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess = null;

// Python server configuration
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const OPEN_INTERFACE_DIR = path.join(__dirname, '..', '..', 'Open-Interface');
const SERVER_SCRIPT = path.join(OPEN_INTERFACE_DIR, 'server_launch.py');
const SERVER_PORT = process.env.OPEN_INTERFACE_PORT || 5000;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Open-Interface',
    icon: path.join(OPEN_INTERFACE_DIR, 'app', 'resources', 'icon.png'),
    show: false,
  });

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Start Python server after window is ready
    startPythonServer();
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopPythonServer();
  });
}

function startPythonServer() {
  console.log('Starting Open-Interface Python server...');

  // Set environment variables for the Python process
  const env = {
    ...process.env,
    OPEN_INTERFACE_PORT: SERVER_PORT,
    OPEN_INTERFACE_HOST: '127.0.0.1',
  };

  pythonProcess = spawn(PYTHON_PATH, [SERVER_SCRIPT], {
    cwd: OPEN_INTERFACE_DIR,
    env: env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Handle Python process output
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;

    // Notify renderer process
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('python-server-status', { running: false, code });
    }
  });

  pythonProcess.on('error', (error) => {
    console.error('Failed to start Python process:', error);

    // Notify renderer process
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('python-server-status', { running: false, error: error.message });
    }
  });

  // Wait a bit for server to start, then notify renderer
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('python-server-status', { running: true, port: SERVER_PORT });
    }
  }, 2000);
}

function stopPythonServer() {
  if (pythonProcess) {
    console.log('Stopping Python server...');
    pythonProcess.kill('SIGTERM');

    // Force kill after timeout
    setTimeout(() => {
      if (pythonProcess) {
        pythonProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

// IPC handlers
ipcMain.handle('get-server-status', () => {
  return {
    running: pythonProcess !== null,
    port: SERVER_PORT,
    pid: pythonProcess ? pythonProcess.pid : null
  };
});

ipcMain.handle('restart-server', async () => {
  stopPythonServer();
  await new Promise(resolve => setTimeout(resolve, 1000));
  startPythonServer();
  return { success: true };
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopPythonServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopPythonServer();
});

// Handle app interruptions
process.on('SIGINT', () => {
  stopPythonServer();
  app.quit();
});

process.on('SIGTERM', () => {
  stopPythonServer();
  app.quit();
});