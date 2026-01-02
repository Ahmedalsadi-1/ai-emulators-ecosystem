"use strict";
/**
 * Bytebot Electron Preload Script
 *
 * Provides a secure IPC bridge between the renderer process and main process.
 * Uses contextBridge to expose APIs safely to the renderer.
 */
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
// ============================================================================
// Electron API Bridge
// ============================================================================
/**
 * Secure IPC bridge exposed to the renderer process.
 * All main process communication goes through this API.
 */
var electronAPI = {
    // Window Controls
    minimizeWindow: function () { return electron_1.ipcRenderer.invoke('minimize-window'); },
    maximizeWindow: function () { return electron_1.ipcRenderer.invoke('maximize-window'); },
    closeWindow: function () { return electron_1.ipcRenderer.invoke('close-window'); },
    restoreWindow: function () { return electron_1.ipcRenderer.invoke('restore-window'); },
    expandToTab: function (tab) { return electron_1.ipcRenderer.invoke('expand-to-tab', tab); },
    // Window Bounds
    getWindowBounds: function () { return electron_1.ipcRenderer.invoke('get-window-bounds'); },
    setWindowBounds: function (bounds) {
        return electron_1.ipcRenderer.invoke('set-window-bounds', bounds);
    },
    // Service Management
    getServiceStatus: function () { return electron_1.ipcRenderer.invoke('get-service-status'); },
    restartService: function (serviceName) {
        return electron_1.ipcRenderer.invoke('restart-service', serviceName);
    },
    // App Info
    getAppInfo: function () { return electron_1.ipcRenderer.invoke('get-app-info'); },
    // Listeners
    onServiceStatusChange: function (callback) {
        var listener = function (_event, status) {
            callback(status);
        };
        electron_1.ipcRenderer.on('service-status-change', listener);
        // Return unsubscribe function
        return function () {
            electron_1.ipcRenderer.removeListener('service-status-change', listener);
        };
    },
    onWindowFocus: function (callback) {
        var listener = function () { return callback(); };
        electron_1.ipcRenderer.on('window-focus', listener);
        return function () {
            electron_1.ipcRenderer.removeListener('window-focus', listener);
        };
    },
    onWindowBlur: function (callback) {
        var listener = function () { return callback(); };
        electron_1.ipcRenderer.on('window-blur', listener);
        return function () {
            electron_1.ipcRenderer.removeListener('window-blur', listener);
        };
    },
};
// ============================================================================
// Platform-Specific APIs
// ============================================================================
/**
 * Platform-specific utilities
 */
var platformAPI = {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux',
    /**
     * Copy text to clipboard
     */
    copyToClipboard: function (text) {
        electron_1.ipcRenderer.invoke('clipboard-write', text);
    },
    /**
     * Read text from clipboard
     */
    readFromClipboard: function () { return electron_1.ipcRenderer.invoke('clipboard-read'); },
};
// ============================================================================
// Environment API
// ============================================================================
/**
 * Environment utilities
 */
var envAPI = {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    /**
     * Get environment variable
     */
    getEnv: function (key) { return process.env[key]; },
    /**
     * Set environment variable (only in main process context)
     */
    setEnv: function (_key, _value) {
        return electron_1.ipcRenderer.invoke('set-env', _key, _value);
    },
};
// ============================================================================
// Expose APIs to Renderer
// ============================================================================
/**
 * Expose APIs to the renderer process through the window object.
 * Using contextBridge ensures secure isolation between main and renderer.
 */
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
electron_1.contextBridge.exposeInMainWorld('platformAPI', platformAPI);
electron_1.contextBridge.exposeInMainWorld('envAPI', envAPI);
// ============================================================================
// Logging Bridge (for development)
// ============================================================================
/**
 * Bridge console logs to main process for better debugging
 */
if (process.env.NODE_ENV === 'development') {
    var originalConsoleLog_1 = console.log;
    var originalConsoleError_1 = console.error;
    var originalConsoleWarn_1 = console.warn;
    console.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        electron_1.ipcRenderer.invoke('console-log', args);
        originalConsoleLog_1.apply(console, args);
    };
    console.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        electron_1.ipcRenderer.invoke('console-error', args);
        originalConsoleError_1.apply(console, args);
    };
    console.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        electron_1.ipcRenderer.invoke('console-warn', args);
        originalConsoleWarn_1.apply(console, args);
    };
}
// Add error handlers safely
try {
    (_a = global.window) === null || _a === void 0 ? void 0 : _a.addEventListener('unhandledrejection', function (event) {
        var rejectionEvent = event;
        console.error('Unhandled Promise Rejection:', rejectionEvent.reason);
        electron_1.ipcRenderer.invoke('renderer-error', {
            type: 'unhandledrejection',
            message: rejectionEvent.reason instanceof Error ? rejectionEvent.reason.message : String(rejectionEvent.reason),
            stack: rejectionEvent.reason instanceof Error ? rejectionEvent.reason.stack : undefined,
        });
    });
    (_b = global.window) === null || _b === void 0 ? void 0 : _b.addEventListener('error', function (event) {
        var _a, _b;
        var errorEvent = event;
        console.error('Window Error:', errorEvent.error);
        electron_1.ipcRenderer.invoke('renderer-error', {
            type: 'error',
            message: ((_a = errorEvent.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error',
            stack: (_b = errorEvent.error) === null || _b === void 0 ? void 0 : _b.stack,
        });
    });
}
catch (e) {
    // Silently ignore if window is not available
}
// Re-export certain Node.js globals for convenience
electron_1.contextBridge.exposeInMainWorld('process', {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    env: process.env,
});
