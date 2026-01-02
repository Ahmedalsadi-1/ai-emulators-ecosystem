"use strict";
/**
 * Bytebot Electron Main Process
 *
 * Main entry point for the Bytebot desktop application.
 * Manages service orchestration, window creation, and IPC communication.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = __importStar(require("path"));
var child_process_1 = require("child_process");
var http = __importStar(require("http"));
// ============================================================================
// Global State
// ============================================================================
var mainWindow = null;
var childProcesses = [];
var isQuitting = false;
// ============================================================================
// Configuration
// ============================================================================
var SERVICES = [
    {
        name: 'bytebotd',
        command: 'node',
        args: ['dist/main'],
        cwd: path.join(__dirname, '..', '..', 'bytebotd'),
        port: 9990,
        env: __assign(__assign({}, process.env), { BROWSEROS_APP_COMMAND: process.env.BROWSEROS_APP_COMMAND || 'echo "BrowserOS not available"' }),
    },
    {
        name: 'bytebot-agent',
        command: 'node',
        args: ['dist/main'],
        cwd: path.join(__dirname, '..', '..', 'bytebot-agent'),
        port: 9991,
        env: __assign(__assign({}, process.env), { DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bytebotdb' }),
    },
    {
        name: 'bytebot-ui',
        command: 'node',
        args: ['server.js'],
        cwd: path.join(__dirname, '..'),
        port: 9992,
        env: __assign(__assign({}, process.env), { BYTEBOT_DESKTOP_VNC_URL: process.env.BYTEBOT_DESKTOP_VNC_URL || 'ws://localhost:9990/websockify', BYTEBOT_AGENT_BASE_URL: process.env.BYTEBOT_AGENT_BASE_URL || 'http://localhost:9991' }),
    },
];
var TAB_SIZE_CONFIG = {
    home: { width: 980, height: 560 },
    tasks: { width: 1100, height: 700 },
    desktop: { width: 1300, height: 820 },
    web: { width: 1300, height: 820 },
    settings: { width: 900, height: 660 },
    default: { width: 1000, height: 600 },
};
var WINDOW_DEFAULTS = {
    width: 400,
    height: 300,
    minWidth: 350,
    minHeight: 250,
};
// ============================================================================
// Port Utilities
// ============================================================================
/**
 * Check if a port is available (not in use)
 */
function isPortInUse(port) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var req = http.request({
                        hostname: 'localhost',
                        port: port,
                        path: '/',
                        method: 'GET',
                        timeout: 1000,
                    }, function () {
                        resolve(true); // Port is in use
                    });
                    req.on('error', function () {
                        resolve(false); // Port is free
                    });
                    req.on('timeout', function () {
                        req.destroy();
                        resolve(false); // Port is free
                    });
                    req.end();
                })];
        });
    });
}
/**
 * Wait for a port to become available
 */
function waitForPort(port_1) {
    return __awaiter(this, arguments, void 0, function (port, timeout) {
        if (timeout === void 0) { timeout = 30000; }
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var startTime = Date.now();
                    var checkInterval = 1000;
                    var checkPort = function () {
                        var req = http.request({
                            hostname: 'localhost',
                            port: port,
                            path: '/',
                            method: 'GET',
                            timeout: 2000,
                        }, function () {
                            console.log("[Electron] Port ".concat(port, " is ready"));
                            resolve();
                        });
                        req.on('error', function () {
                            if (Date.now() - startTime > timeout) {
                                reject(new Error("Timeout waiting for port ".concat(port)));
                            }
                            else {
                                setTimeout(checkPort, checkInterval);
                            }
                        });
                        req.on('timeout', function () {
                            req.destroy();
                            if (Date.now() - startTime > timeout) {
                                reject(new Error("Timeout waiting for port ".concat(port)));
                            }
                            else {
                                setTimeout(checkPort, checkInterval);
                            }
                        });
                        req.end();
                    };
                    checkPort();
                })];
        });
    });
}
// ============================================================================
// Service Management
// ============================================================================
/**
 * Start a single service
 */
function startService(config) {
    var _a, _b;
    var name = config.name, command = config.command, args = config.args, cwd = config.cwd, env = config.env;
    console.log("[Electron] Starting ".concat(name, " from ").concat(cwd));
    var child = (0, child_process_1.spawn)(command, args, {
        cwd: cwd,
        stdio: 'pipe',
        shell: process.platform === 'win32',
        env: __assign(__assign(__assign({}, process.env), env), { FORCE_COLOR: '1' }),
    });
    // Handle stdout
    (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
        var output = data.toString().trim();
        if (output) {
            console.log("[".concat(name, "] ").concat(output));
        }
    });
    // Handle stderr
    (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
        var output = data.toString().trim();
        if (output) {
            console.error("[".concat(name, "] ").concat(output));
        }
    });
    // Handle spawn errors
    child.on('error', function (error) {
        console.error("[Electron] Failed to start ".concat(name, ":"), error.message);
    });
    // Handle exit
    child.on('exit', function (code) {
        if (!isQuitting) {
            console.log("[Electron] ".concat(name, " exited with code ").concat(code));
        }
    });
    childProcesses.push(child);
    return child;
}
/**
 * Start all required services
 */
function startServices() {
    return __awaiter(this, void 0, void 0, function () {
        var isDev, autoStartServices, servicesToStart, _i, SERVICES_1, service, isRunning, _a, servicesToStart_1, service, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    isDev = process.env.NODE_ENV === 'development';
                    autoStartServices = process.env.BYTEBOT_AUTO_START_SERVICES !== 'false';
                    console.log("[Electron] Starting services in ".concat(isDev ? 'development' : 'production', " mode"));
                    console.log("[Electron] Auto-start services: ".concat(autoStartServices));
                    if (!autoStartServices) {
                        console.log('[Electron] Skipping service auto-start (BYTEBOT_AUTO_START_SERVICES=false)');
                        return [2 /*return*/];
                    }
                    servicesToStart = [];
                    _i = 0, SERVICES_1 = SERVICES;
                    _b.label = 1;
                case 1:
                    if (!(_i < SERVICES_1.length)) return [3 /*break*/, 4];
                    service = SERVICES_1[_i];
                    return [4 /*yield*/, isPortInUse(service.port)];
                case 2:
                    isRunning = _b.sent();
                    if (isRunning) {
                        console.log("[Electron] ".concat(service.name, " already running on port ").concat(service.port, ", skipping..."));
                    }
                    else {
                        servicesToStart.push(service);
                    }
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (servicesToStart.length === 0) {
                        console.log('[Electron] All services already running, skipping startup...');
                        return [2 /*return*/];
                    }
                    // Start required services
                    console.log("[Electron] Starting ".concat(servicesToStart.length, " service(s)..."));
                    for (_a = 0, servicesToStart_1 = servicesToStart; _a < servicesToStart_1.length; _a++) {
                        service = servicesToStart_1[_a];
                        startService(service);
                    }
                    // Wait for all services to be ready
                    console.log('[Electron] Waiting for services to be ready...');
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, Promise.all(servicesToStart.map(function (service) { return waitForPort(service.port); }))];
                case 6:
                    _b.sent();
                    console.log('[Electron] All services are ready!');
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    console.error('[Electron] Failed to start some services:', error_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Stop all child processes gracefully
 */
function stopAllServices() {
    console.log('[Electron] Stopping all services...');
    for (var _i = 0, childProcesses_1 = childProcesses; _i < childProcesses_1.length; _i++) {
        var child = childProcesses_1[_i];
        try {
            // Send SIGTERM for graceful shutdown
            if (process.platform === 'win32') {
                child.kill('SIGTERM');
            }
            else {
                child.kill('SIGTERM');
            }
            console.log("[Electron] Killed process: ".concat(child.pid));
        }
        catch (error) {
            console.error("[Electron] Error killing process:", error);
        }
    }
    childProcesses = [];
}
// ============================================================================
// Window Management
// ============================================================================
/**
 * Get the appropriate URL to load based on environment
 */
function getLoadUrl() {
    var isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        return 'http://localhost:9992';
    }
    // Production: load from file system
    var prodPath = path.join(__dirname, '..', 'out', 'index.html');
    return "file://".concat(prodPath);
}
/**
 * Create the main application window
 */
function createWindow() {
    var isDev = process.env.NODE_ENV === 'development';
    var loadUrl = getLoadUrl();
    console.log("[Electron] Loading URL: ".concat(loadUrl));
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow(__assign(__assign({}, WINDOW_DEFAULTS), { webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: !isDev, // Disable in dev for local development
            allowRunningInsecureContent: isDev,
        }, titleBarStyle: 'hiddenInset', frame: false, resizable: true, show: false, backgroundColor: '#000000', icon: path.join(__dirname, '..', '..', '..', 'assets', 'icon.png') }));
    // Load the application
    mainWindow.loadURL(loadUrl).catch(function (error) {
        console.error('[Electron] Failed to load URL:', error);
    });
    // Handle page load events
    mainWindow.webContents.on('did-finish-load', function () {
        console.log('[Electron] Page finished loading successfully');
    });
    mainWindow.webContents.on('did-fail-load', function (_event, errorCode, errorDescription) {
        console.error("[Electron] Page failed to load: ".concat(errorCode, " - ").concat(errorDescription));
        // Retry loading in dev mode
        if (isDev) {
            console.log('[Electron] Retrying in 3 seconds...');
            setTimeout(function () {
                if (mainWindow) {
                    mainWindow.loadURL(loadUrl).catch(console.error);
                }
            }, 3000);
        }
    });
    // Open dev tools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', function () {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
    });
    // Handle window closed
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
    // Security: Prevent new window creation
    mainWindow.webContents.setWindowOpenHandler(function (_a) {
        var url = _a.url;
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
    return mainWindow;
}
// ============================================================================
// IPC Handlers
// ============================================================================
/**
 * Setup IPC handlers for renderer communication
 */
function setupIpcHandlers() {
    var _this = this;
    // Window control handlers
    electron_1.ipcMain.handle('minimize-window', function () {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.minimize();
    });
    electron_1.ipcMain.handle('maximize-window', function () {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            }
            else {
                mainWindow.maximize();
            }
        }
    });
    electron_1.ipcMain.handle('close-window', function () {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.close();
    });
    electron_1.ipcMain.handle('restore-window', function () {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.restore();
    });
    // Tab expansion handler
    electron_1.ipcMain.handle('expand-to-tab', function (_event, tab) {
        if (!mainWindow)
            return;
        var targetSize = TAB_SIZE_CONFIG[tab] || TAB_SIZE_CONFIG.default;
        var currentBounds = mainWindow.getBounds();
        // Center the new window
        var x = Math.round(currentBounds.x + (currentBounds.width - targetSize.width) / 2);
        var y = Math.round(currentBounds.y + (currentBounds.height - targetSize.height) / 2);
        // Animate resize where supported (macOS)
        mainWindow.setBounds({ x: x, y: y, width: targetSize.width, height: targetSize.height }, true);
    });
    // Get window bounds
    electron_1.ipcMain.handle('get-window-bounds', function () {
        if (!mainWindow)
            return null;
        return mainWindow.getBounds();
    });
    // Set window bounds
    electron_1.ipcMain.handle('set-window-bounds', function (_event, bounds) {
        if (!mainWindow)
            return false;
        mainWindow.setBounds(bounds, true);
        return true;
    });
    // Service status handler
    electron_1.ipcMain.handle('get-service-status', function () { return __awaiter(_this, void 0, void 0, function () {
        var status, _i, SERVICES_2, service, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    status = {};
                    _i = 0, SERVICES_2 = SERVICES;
                    _c.label = 1;
                case 1:
                    if (!(_i < SERVICES_2.length)) return [3 /*break*/, 4];
                    service = SERVICES_2[_i];
                    _a = status;
                    _b = service.name;
                    return [4 /*yield*/, isPortInUse(service.port)];
                case 2:
                    _a[_b] = _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, status];
            }
        });
    }); });
    // Restart service handler
    electron_1.ipcMain.handle('restart-service', function (_event, serviceName) { return __awaiter(_this, void 0, void 0, function () {
        var service, existingProcess;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    service = SERVICES.find(function (s) { return s.name === serviceName; });
                    if (!service) {
                        throw new Error("Service not found: ".concat(serviceName));
                    }
                    existingProcess = childProcesses.find(function (cp) { var _a, _b; return ((_a = cp.spawnfile) === null || _a === void 0 ? void 0 : _a.includes(service.name)) || ((_b = cp.spawnfile) === null || _b === void 0 ? void 0 : _b.includes(service.cwd)); });
                    if (existingProcess) {
                        existingProcess.kill('SIGTERM');
                        // Remove from tracking
                        childProcesses = childProcesses.filter(function (cp) { return cp !== existingProcess; });
                    }
                    // Start the service again
                    startService(service);
                    // Wait for it to be ready
                    return [4 /*yield*/, waitForPort(service.port)];
                case 1:
                    // Wait for it to be ready
                    _a.sent();
                    return [2 /*return*/, true];
            }
        });
    }); });
    // App info handler
    electron_1.ipcMain.handle('get-app-info', function () {
        return {
            version: electron_1.app.getVersion(),
            platform: process.platform,
            isDev: process.env.NODE_ENV === 'development',
        };
    });
    // Clipboard handlers
    electron_1.ipcMain.handle('clipboard-write', function (_event, text) {
        var clipboard = require('electron').clipboard;
        clipboard.writeText(text);
    });
    electron_1.ipcMain.handle('clipboard-read', function () {
        var clipboard = require('electron').clipboard;
        return clipboard.readText();
    });
    // Environment handlers
    electron_1.ipcMain.handle('set-env', function (_event, key, value) {
        process.env[key] = value;
        return true;
    });
    // Console handlers (for development logging)
    electron_1.ipcMain.handle('console-log', function (_event, args) {
        console.log.apply(console, __spreadArray(['[Renderer]'], args, false));
    });
    electron_1.ipcMain.handle('console-error', function (_event, args) {
        console.error.apply(console, __spreadArray(['[Renderer]'], args, false));
    });
    electron_1.ipcMain.handle('console-warn', function (_event, args) {
        console.warn.apply(console, __spreadArray(['[Renderer]'], args, false));
    });
    // Error handler
    electron_1.ipcMain.handle('renderer-error', function (_event, error) {
        console.error("[Renderer Error] ".concat(error.type, ": ").concat(error.message), error.stack || '');
    });
}
// ============================================================================
// App Lifecycle
// ============================================================================
/**
 * Cleanup on app quit
 */
function cleanup() {
    isQuitting = true;
    stopAllServices();
}
/**
 * Setup application menu
 */
function setupMenu() {
    var template = [
        {
            label: 'Bytebot',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'close' },
            ],
        },
    ];
    var menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
// ============================================================================
// Main Entry Point
// ============================================================================
// Register IPC handlers
setupIpcHandlers();
// Handle app events
electron_1.app.whenReady().then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('[Electron] App ready');
                // Start services
                return [4 /*yield*/, startServices()];
            case 1:
                // Start services
                _a.sent();
                // Create main window
                createWindow();
                // Setup menu
                setupMenu();
                // Handle activate event (macOS dock click)
                electron_1.app.on('activate', function () {
                    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                        console.log('[Electron] Activating app, creating new window...');
                        createWindow();
                    }
                    else {
                        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
                    }
                });
                return [2 /*return*/];
        }
    });
}); });
// Handle all windows closed
electron_1.app.on('window-all-closed', function () {
    console.log('[Electron] All windows closed');
    cleanup();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Handle app quit
electron_1.app.on('will-quit', function () {
    console.log('[Electron] App will quit');
    cleanup();
});
// Handle web contents created
electron_1.app.on('web-contents-created', function (_event, contents) {
    contents.setWindowOpenHandler(function (_a) {
        var url = _a.url;
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
});
// Handle uncaught exceptions
process.on('uncaughtException', function (error) {
    console.error('[Electron] Uncaught exception:', error);
});
// Handle unhandled rejections
process.on('unhandledRejection', function (reason) {
    console.error('[Electron] Unhandled rejection:', reason);
});
