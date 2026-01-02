const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let pythonProcess = null;

// Python server configuration
const PYTHON_PATH = getPythonPath();
const OPEN_INTERFACE_DIR = path.join(__dirname, '../../../..', 'Open-Interface');
const SERVER_SCRIPT = path.join(OPEN_INTERFACE_DIR, 'server_launch.py');
const SERVER_PORT = process.env.OPEN_INTERFACE_PORT || 5001; // Different port from standalone

function getPythonPath() {
  // Cross-platform Python path detection
  const platform = process.platform;

  // Check for explicit PYTHON_PATH environment variable
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  // Platform-specific defaults
  switch (platform) {
    case 'win32':
      // Windows - try common Python installations
      return 'python';
    case 'darwin':
      // macOS - try python3 first, fallback to python
      return 'python3';
    case 'linux':
      // Linux - try python3 first
      return 'python3';
    default:
      return 'python3';
  }
}

function validatePythonEnvironment() {
  // Check if Python is available and has required packages
  return new Promise((resolve, reject) => {
    const testProcess = require('child_process').spawn(PYTHON_PATH, ['-c', 'import flask, PIL, cv2, pyautogui; print("OK")'], {
      cwd: OPEN_INTERFACE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      if (code === 0 && output.includes('OK')) {
        resolve(true);
      } else {
        reject(new Error(`Python validation failed: ${errorOutput || 'Missing dependencies'}`));
      }
    });

    testProcess.on('error', (error) => {
      reject(new Error(`Python not found: ${error.message}`));
    });
  });
}

function createWindow() {
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
    mainWindow.show();
    // Validate Python environment and start server
    validatePythonEnvironment()
      .then(() => {
        console.log('✅ Python environment validated');
        startPythonServer();
      })
      .catch((error) => {
        console.error('❌ Python validation failed:', error.message);
        // Notify renderer of validation failure
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python-validation-error', { error: error.message });
        }
      });
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopPythonServer();
  });
}

function startPythonServer() {
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
  }, 3000);
}

function stopPythonServer() {
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

ipcMain.handle('execute-request', async (event, request) => {
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

ipcMain.handle('update-settings', async (event, settings) => {
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

// Computer Action IPC handlers for Bytebot integration
ipcMain.on('computer-action-request', async (event, action) => {
  console.log('Received computer action request:', action);

  try {
    // Convert Bytebot action to Open-Interface request
    const request = convertComputerActionToRequest(action);
    const result = await executeOpenInterfaceRequest(request);

    // Send result back
    event.reply('computer-action-result', result);
  } catch (error) {
    console.error('Failed to execute computer action:', error);
    event.reply('computer-action-result', { success: false, error: error.message });
  }
});

ipcMain.handle('execute-computer-action', async (event, action) => {
  try {
    const request = convertComputerActionToRequest(action);
    return await executeOpenInterfaceRequest(request);
  } catch (error) {
    console.error('Failed to execute computer action:', error);
    return { success: false, error: error.message };
  }
});

function convertComputerActionToRequest(action) {
  // Convert Bytebot computer action format to Open-Interface natural language request
  switch (action.action) {
    case 'move_mouse':
      return `Move mouse to coordinates (${action.coordinates?.x || 0}, ${action.coordinates?.y || 0})`;

    case 'click_mouse':
      const button = action.button === 2 ? 'right' : action.button === 3 ? 'middle' : 'left';
      let request = `Click the ${button} mouse button`;
      if (action.coordinates) {
        request += ` at coordinates (${action.coordinates.x}, ${action.coordinates.y})`;
      }
      if (action.clickCount > 1) {
        request += ` ${action.clickCount} times`;
      }
      return request;

    case 'press_mouse':
      const pressButton = action.button === 2 ? 'right' : action.button === 3 ? 'middle' : 'left';
      return `${action.press === 'down' ? 'Press down' : 'Release'} the ${pressButton} mouse button`;

    case 'drag_mouse':
      return `Drag mouse from (${action.path?.[0]?.x || 0}, ${action.path?.[0]?.y || 0}) to (${action.path?.[action.path.length - 1]?.x || 0}, ${action.path?.[action.path.length - 1]?.y || 0})`;

    case 'scroll':
      const direction = action.direction === 'up' ? 'up' : 'down';
      let scrollRequest = `Scroll ${direction} by ${action.scrollCount || 1} units`;
      if (action.coordinates) {
        scrollRequest += ` at coordinates (${action.coordinates.x}, ${action.coordinates.y})`;
      }
      return scrollRequest;

    case 'type_keys':
      const keys = Array.isArray(action.keys) ? action.keys.join(' + ') : action.keys;
      return `Press the following keys: ${keys}`;

    case 'press_keys':
      const pressKeys = Array.isArray(action.keys) ? action.keys.join(' + ') : action.keys;
      return `${action.press === 'down' ? 'Press down' : 'Release'} the following keys: ${pressKeys}`;

    case 'type_text':
      return `Type the following text: "${action.text}"`;

    case 'paste_text':
      return `Paste the following text: "${action.text}"`;

    case 'wait':
      return `Wait for ${action.duration || 1000} milliseconds`;

    case 'screenshot':
      return 'Take a screenshot and describe what you see';

    case 'cursor_position':
      return 'Get the current cursor position';

    case 'application':
      return `${action.application === 'desktop' ? 'Show desktop' : `Open ${action.application} application`}`;

    case 'write_file':
      return `Save the following content to file ${action.path}: ${action.data}`;

    case 'read_file':
      return `Read the content of file ${action.path}`;

    default:
      return `Execute computer action: ${JSON.stringify(action)}`;
  }
}

async function executeOpenInterfaceRequest(request) {
  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Request failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

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