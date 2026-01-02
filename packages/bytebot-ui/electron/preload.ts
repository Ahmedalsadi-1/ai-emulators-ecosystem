/**
 * Bytebot Electron Preload Script
 * 
 * Provides a secure IPC bridge between the renderer process and main process.
 * Uses contextBridge to expose APIs safely to the renderer.
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// ============================================================================
// Types
// ============================================================================

interface ServiceStatus {
  [key: string]: boolean;
}

interface AppInfo {
  version: string;
  platform: string;
  isDev: boolean;
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Electron API Bridge
// ============================================================================

/**
 * Secure IPC bridge exposed to the renderer process.
 * All main process communication goes through this API.
 */
const electronAPI = {
  // Window Controls
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('minimize-window'),
  
  maximizeWindow: (): Promise<void> => ipcRenderer.invoke('maximize-window'),
  
  closeWindow: (): Promise<void> => ipcRenderer.invoke('close-window'),
  
  restoreWindow: (): Promise<void> => ipcRenderer.invoke('restore-window'),
  
  expandToTab: (tab: string): Promise<void> => ipcRenderer.invoke('expand-to-tab', tab),
  
  // Window Bounds
  getWindowBounds: (): Promise<WindowBounds | null> => ipcRenderer.invoke('get-window-bounds'),
  
  setWindowBounds: (bounds: WindowBounds): Promise<boolean> => 
    ipcRenderer.invoke('set-window-bounds', bounds),
  
  // Service Management
  getServiceStatus: (): Promise<ServiceStatus> => ipcRenderer.invoke('get-service-status'),
  
  restartService: (serviceName: string): Promise<boolean> => 
    ipcRenderer.invoke('restart-service', serviceName),
  
  // App Info
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('get-app-info'),
  
  // Listeners
  onServiceStatusChange: (callback: (status: ServiceStatus) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, status: ServiceStatus) => {
      callback(status);
    };
    ipcRenderer.on('service-status-change', listener);
    
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('service-status-change', listener);
    };
  },
  
  onWindowFocus: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on('window-focus', listener);
    
    return () => {
      ipcRenderer.removeListener('window-focus', listener);
    };
  },
  
  onWindowBlur: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on('window-blur', listener);
    
    return () => {
      ipcRenderer.removeListener('window-blur', listener);
    };
  },
};

// ============================================================================
// Platform-Specific APIs
// ============================================================================

/**
 * Platform-specific utilities
 */
const platformAPI = {
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  
  /**
   * Copy text to clipboard
   */
  copyToClipboard: (text: string): void => {
    ipcRenderer.invoke('clipboard-write', text);
  },
  
  /**
   * Read text from clipboard
   */
  readFromClipboard: (): Promise<string> => ipcRenderer.invoke('clipboard-read'),
};

// ============================================================================
// Environment API
// ============================================================================

/**
 * Environment utilities
 */
const envAPI = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  /**
   * Get environment variable
   */
  getEnv: (key: string): string | undefined => process.env[key],
  
  /**
   * Set environment variable (only in main process context)
   */
  setEnv: (_key: string, _value: string): Promise<boolean> => 
    ipcRenderer.invoke('set-env', _key, _value),
};

// ============================================================================
// Expose APIs to Renderer
// ============================================================================

/**
 * Expose APIs to the renderer process through the window object.
 * Using contextBridge ensures secure isolation between main and renderer.
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('platformAPI', platformAPI);
contextBridge.exposeInMainWorld('envAPI', envAPI);

// ============================================================================
// Logging Bridge (for development)
// ============================================================================

/**
 * Bridge console logs to main process for better debugging
 */
if (process.env.NODE_ENV === 'development') {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.log = (...args: unknown[]) => {
    ipcRenderer.invoke('console-log', args);
    originalConsoleLog.apply(console, args);
  };
  
  console.error = (...args: unknown[]) => {
    ipcRenderer.invoke('console-error', args);
    originalConsoleError.apply(console, args);
  };
  
  console.warn = (...args: unknown[]) => {
    ipcRenderer.invoke('console-warn', args);
    originalConsoleWarn.apply(console, args);
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle uncaught errors in the renderer process
 */
declare const window: {
  addEventListener(type: string, listener: (event: Event) => void): void;
};

// Add error handlers safely
try {
  (global as { window?: { addEventListener: (type: string, listener: (event: Event) => void) => void } }).window?.addEventListener('unhandledrejection', (event: Event) => {
    const rejectionEvent = event as unknown as { promise: Promise<unknown>; reason: unknown };
    console.error('Unhandled Promise Rejection:', rejectionEvent.reason);
    ipcRenderer.invoke('renderer-error', {
      type: 'unhandledrejection',
      message: rejectionEvent.reason instanceof Error ? rejectionEvent.reason.message : String(rejectionEvent.reason),
      stack: rejectionEvent.reason instanceof Error ? rejectionEvent.reason.stack : undefined,
    });
  });

  (global as { window?: { addEventListener: (type: string, listener: (event: Event) => void) => void } }).window?.addEventListener('error', (event: Event) => {
    const errorEvent = event as unknown as { error: Error };
    console.error('Window Error:', errorEvent.error);
    ipcRenderer.invoke('renderer-error', {
      type: 'error',
      message: errorEvent.error?.message || 'Unknown error',
      stack: errorEvent.error?.stack,
    });
  });
} catch (e) {
  // Silently ignore if window is not available
}

// Re-export certain Node.js globals for convenience
contextBridge.exposeInMainWorld('process', {
  platform: process.platform,
  arch: process.arch,
  version: process.version,
  env: process.env,
});
