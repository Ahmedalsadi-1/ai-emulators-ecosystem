import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let pythonProcess: any = null;

// Python server configuration
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const OPEN_INTERFACE_DIR = path.join(__dirname, '../../../..', 'Open-Interface');
const SERVER_SCRIPT = path.join(OPEN_INTERFACE_DIR, 'server_launch.py');
const SERVER_PORT = process.env.OPEN_INTERFACE_PORT || 5001; // Different port from standalone

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Bytebot - Open-Interface Controller',
    show: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    frame: true,
  });

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3001'); // Different port for development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
    // Start Python server after window is ready
    startPythonServer();
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopPythonServer();
  });
}

function startPythonServer(): void {
  console.log('🚀 Starting Bytebot Open-Interface Python server...');

  // Set environment variables for the Python process
  const env = {
    ...process.env,
    OPEN_INTERFACE_PORT: SERVER_PORT.toString(),
    OPEN_INTERFACE_HOST: '127.0.0.1',
    BYTEBOT_INTEGRATION: 'true', // Flag to indicate Bytebot integration
  };

  pythonProcess = spawn(PYTHON_PATH, [SERVER_SCRIPT], {
    cwd: OPEN_INTERFACE_DIR,
    env: env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Handle Python process output
  pythonProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`Python stdout: ${data.toString()}`);
  });

  pythonProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`Python stderr: ${data.toString()}`);
  });

  pythonProcess.on('close', (code: number | null) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;

    // Notify renderer process
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('python-server-status', { running: false, code });
    }
  });

  pythonProcess.on('error', (error: Error) => {
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
  }, 3000);
}

function stopPythonServer(): void {
  if (pythonProcess) {
    console.log('🛑 Stopping Python server...');
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

ipcMain.handle('execute-request', async (event, request: string) => {
  // Forward execution requests to Python server
  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to execute request:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-screenshot', async () => {
  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/screenshot`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get screenshot:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-settings', async () => {
  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/settings`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get settings:', error);
    return {};
  }
});

ipcMain.handle('update-settings', async (event, settings: any) => {
  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { error: error.message };
  }
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