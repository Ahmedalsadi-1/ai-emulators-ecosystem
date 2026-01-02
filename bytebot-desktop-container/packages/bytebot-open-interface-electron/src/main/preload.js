const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Server status
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  restartServer: () => ipcRenderer.invoke('restart-server'),

  // Open-Interface API calls
  executeRequest: (request) => ipcRenderer.invoke('execute-request', request),
  getScreenshot: () => ipcRenderer.invoke('get-screenshot'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),

  // Event listeners
  onServerStatusUpdate: (callback) => {
    ipcRenderer.on('python-server-status', (event, status) => callback(status));
  },

  onValidationError: (callback) => {
    ipcRenderer.on('python-validation-error', (event, error) => callback(error));
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Bytebot integration APIs
  executeComputerAction: (action) => ipcRenderer.invoke('execute-computer-action', action),

  // Event listeners for Bytebot integration
  onComputerActionRequest: (callback) => {
    ipcRenderer.on('computer-action-request', (event, action) => callback(action));
  },

  sendComputerActionResult: (result) => {
    ipcRenderer.send('computer-action-result', result);
  }
});