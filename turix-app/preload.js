const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  toggleVisibility: () => ipcRenderer.invoke('toggle-visibility'),
  getServices: () => ipcRenderer.invoke('get-services'),
  registerService: (service) => ipcRenderer.invoke('register-service', service),
  invokeTool: (serviceName, toolName, params) => ipcRenderer.invoke('invoke-tool', serviceName, toolName, params),
  processCommand: (command) => ipcRenderer.invoke('process-command', command),
  launchService: (serviceName) => ipcRenderer.invoke('launchService', serviceName),
  onServiceUpdate: (callback) => ipcRenderer.on('service-update', callback),
  removeAllListeners: (event) => ipcRenderer.removeAllListeners(event)
});