"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_proxy_middleware_1 = require("http-proxy-middleware");
var http_proxy_1 = require("http-proxy");
var next_1 = __importDefault(require("next"));
var http_1 = require("http");
var dotenv_1 = __importDefault(require("dotenv"));
var path_1 = __importDefault(require("path"));
// Load environment variables - .env.local takes precedence
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env.local') });
var dev = process.env.NODE_ENV !== "production";
var hostname = process.env.HOSTNAME || "0.0.0.0";
var port = parseInt(process.env.PORT || "9992", 10);
// Backend URLs - Use NEXT_PUBLIC_* for consistency (works in both server and client)
var BYTEBOT_AGENT_BASE_URL = process.env.NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL || process.env.BYTEBOT_AGENT_BASE_URL;
var BYTEBOT_DESKTOP_VNC_URL = process.env.BYTEBOT_DESKTOP_VNC_URL;
var BYTEBOT_DESKTOP_BASE_URL = process.env.BYTEBOT_DESKTOP_BASE_URL;
var DEBIAN_DESKTOP_VNC_URL = process.env.DEBIAN_DESKTOP_VNC_URL ||
    process.env.NEXT_PUBLIC_DEBIAN_DESKTOP_VNC_URL ||
    "ws://localhost:9995/websockify";
var KALI_DESKTOP_VNC_URL = process.env.BYTEBOT_DESKTOP_KALI_VNC_URL ||
    process.env.KALI_DESKTOP_VNC_URL ||
    "ws://localhost:9993/websockify";
var BROWSEROS_DESKTOP_VNC_URL = process.env.BROWSEROS_DESKTOP_VNC_URL ||
    process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL;
var resolveDesktopBaseUrl = function () {
    if (BYTEBOT_DESKTOP_BASE_URL)
        return BYTEBOT_DESKTOP_BASE_URL;
    if (!BYTEBOT_DESKTOP_VNC_URL)
        return undefined;
    try {
        var vncUrl = new URL(BYTEBOT_DESKTOP_VNC_URL);
        var protocol = vncUrl.protocol === "wss:" ? "https:" : "http:";
        return "".concat(protocol, "//").concat(vncUrl.host);
    }
    catch (error) {
        console.warn("BYTEBOT_DESKTOP_VNC_URL is invalid; falling back to default desktop URL.", error);
        return undefined;
    }
};
var DESKTOP_BASE_URL = resolveDesktopBaseUrl() || "http://localhost:9990";
var app = (0, next_1.default)({ dev: dev, hostname: hostname, port: port });
var expressApp = (0, express_1.default)();
var server = (0, http_1.createServer)(expressApp);
// Set up proxies immediately
var vncProxy = (0, http_proxy_1.createProxyServer)({ changeOrigin: true, ws: true });
// Guards for required environment variables
if (!BYTEBOT_AGENT_BASE_URL) {
    console.error("BYTEBOT_AGENT_BASE_URL is not set! Task API calls will fail.");
}
// HTTP proxy for REST API calls to backend
var tasksHttpProxy = BYTEBOT_AGENT_BASE_URL ? (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: BYTEBOT_AGENT_BASE_URL,
    changeOrigin: true,
    pathRewrite: function (path) {
        // For /api/proxy/tasks/* → /tasks/*
        if (path.startsWith('/api/proxy/tasks')) {
            return path.replace('/api/proxy/tasks', '/tasks');
        }
        // For /api/tasks/* → /tasks/* (remainder path after mount point)
        // Path here is the remainder after /api/tasks, e.g., /models, /?query
        if (path === '/' || path.startsWith('/?')) {
            // Root path /api/tasks → /tasks
            return '/tasks' + path;
        }
        // For other paths like /models → /tasks/models
        return '/tasks' + path;
    },
}) : null;
// WebSocket proxy for Socket.IO connections to backend
var tasksWsProxy = BYTEBOT_AGENT_BASE_URL
    ? (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: BYTEBOT_AGENT_BASE_URL,
        ws: true,
        changeOrigin: true,
    })
    : null;
var desktopProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: DESKTOP_BASE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/proxy/desktop": "" },
});
var terminalProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: DESKTOP_BASE_URL,
    ws: true,
    changeOrigin: true,
    pathRewrite: { "^/api/proxy/terminal": "/terminal" },
});
var authProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: DESKTOP_BASE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "/auth" },
});
// General API proxy to backend
console.log("Setting up API proxy with target:", BYTEBOT_AGENT_BASE_URL || "(not configured - using fallback handlers)");
var apiProxy = BYTEBOT_AGENT_BASE_URL ? (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: BYTEBOT_AGENT_BASE_URL,
    changeOrigin: true,
    // Don't strip /api - bytebot-agent uses global prefix "api"
    // So /api/tasks/models → /api/tasks/models on target
}) : null;
vncProxy.on("error", function (error, req, res) {
    console.error("VNC proxy error:", error);
    // Only handle ServerResponse, not Socket
    if (res && 'writeHead' in res && !res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "VNC proxy error",
            message: error.message,
        }));
    }
});
// Apply HTTP proxies in correct order (specific routes before generic)
if (tasksHttpProxy) {
    expressApp.use("/api/proxy/tasks", tasksHttpProxy);
    // Also proxy /api/tasks (used by frontend directly)
    expressApp.use("/api/tasks", tasksHttpProxy);
}
else {
    expressApp.use("/api/proxy/tasks", function (req, res) {
        res.status(500).json({ error: "BYTEBOT_AGENT_BASE_URL not configured" });
    });
    expressApp.use("/api/tasks", function (req, res) {
        res.status(500).json({ error: "BYTEBOT_AGENT_BASE_URL not configured" });
    });
}
expressApp.use("/api/auth", authProxy);
expressApp.use("/api/proxy/desktop", desktopProxy);
expressApp.use("/api/proxy/terminal", terminalProxy);
// Debian VNC proxy (must be before generic /api proxy)
expressApp.use("/api/proxy/websockify", function (req, res) {
    var _a;
    if (!BYTEBOT_DESKTOP_VNC_URL) {
        console.error("BYTEBOT_DESKTOP_VNC_URL not configured");
        res.status(500).json({ error: "BYTEBOT_DESKTOP_VNC_URL not configured" });
        return;
    }
    console.log("Proxying debian websockify request");
    // Rewrite path
    var targetUrl;
    try {
        targetUrl = new URL(BYTEBOT_DESKTOP_VNC_URL);
    }
    catch (error) {
        res.status(400).json({ error: "BYTEBOT_DESKTOP_VNC_URL is invalid" });
        return;
    }
    req.url =
        targetUrl.pathname +
            (((_a = req.url) === null || _a === void 0 ? void 0 : _a.replace(/^\/api\/proxy\/websockify/, "")) || "");
    vncProxy.web(req, res, {
        target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
    });
});
// Debian VNC proxy (explicit desktop 2)
expressApp.use("/api/proxy/debian-websockify", function (req, res) {
    var _a;
    if (!DEBIAN_DESKTOP_VNC_URL) {
        console.error("DEBIAN_DESKTOP_VNC_URL not configured");
        res.status(500).json({ error: "DEBIAN_DESKTOP_VNC_URL not configured" });
        return;
    }
    console.log("Proxying debian websockify request");
    var targetUrl;
    try {
        targetUrl = new URL(DEBIAN_DESKTOP_VNC_URL);
    }
    catch (error) {
        res.status(400).json({ error: "DEBIAN_DESKTOP_VNC_URL is invalid" });
        return;
    }
    req.url =
        targetUrl.pathname +
            (((_a = req.url) === null || _a === void 0 ? void 0 : _a.replace(/^\/api\/proxy\/debian-websockify/, "")) || "");
    vncProxy.web(req, res, {
        target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
    });
});
// Kali VNC proxy (must be before generic /api proxy)
expressApp.use("/api/proxy/kali-websockify", function (req, res) {
    var _a;
    console.log("Proxying kali websockify request");
    var targetUrl;
    try {
        targetUrl = new URL(KALI_DESKTOP_VNC_URL);
    }
    catch (error) {
        res.status(400).json({ error: "KALI_DESKTOP_VNC_URL is invalid" });
        return;
    }
    req.url =
        targetUrl.pathname +
            (((_a = req.url) === null || _a === void 0 ? void 0 : _a.replace(/^\/api\/proxy\/kali-websockify/, "")) || "");
    vncProxy.web(req, res, {
        target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
    });
});
// BrowserOS VNC proxy (must be before generic /api proxy)
expressApp.use("/api/proxy/browseros-websockify", function (req, res) {
    var _a;
    if (!BROWSEROS_DESKTOP_VNC_URL) {
        console.error("BROWSEROS_DESKTOP_VNC_URL not configured");
        res.status(500).json({ error: "BROWSEROS_DESKTOP_VNC_URL not configured" });
        return;
    }
    console.log("Proxying browseros websockify request");
    var targetUrl;
    try {
        targetUrl = new URL(BROWSEROS_DESKTOP_VNC_URL);
    }
    catch (error) {
        res.status(400).json({ error: "BROWSEROS_DESKTOP_VNC_URL is invalid" });
        return;
    }
    req.url =
        targetUrl.pathname +
            (((_a = req.url) === null || _a === void 0 ? void 0 : _a.replace(/^\/api\/proxy\/browseros-websockify/, "")) || "");
    vncProxy.web(req, res, {
        target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
    });
});
// Generic API proxy for all other /api/* routes (runs after specific routes)
expressApp.use("/api", function (req, res, next) {
    // Mounted at /api, so req.url is the remainder (e.g., "/tasks/models")
    // Prepend /api to get the full path for bytebot-agent (which uses global prefix "api")
    var originalUrl = req.url;
    req.url = "/api" + req.url;
    console.log("API request: ".concat(req.method, " ").concat(originalUrl, " \u2192 proxying to ").concat(req.url));
    if (apiProxy) {
        apiProxy(req, res, function (err) {
            // Restore URL after proxy (for logging/cleanup)
            req.url = originalUrl;
            if (err)
                next(err);
        });
    }
    else {
        req.url = originalUrl; // restore for error response
        res.status(500).json({ error: "BYTEBOT_AGENT_BASE_URL not configured" });
    }
});
app
    .prepare()
    .then(function () {
    var handle = app.getRequestHandler();
    var nextUpgradeHandler = app.getUpgradeHandler();
    // Handle all other requests with Next.js
    expressApp.all("*", function (req, res) { return handle(req, res); });
    // Properly upgrade WebSocket connections
    server.on("upgrade", function (request, socket, head) {
        var _a, _b, _c, _d;
        var pathname = new URL(request.url, "http://".concat(request.headers.host)).pathname;
        if (pathname.startsWith("/api/proxy/tasks")) {
            if (tasksWsProxy) {
                return tasksWsProxy.upgrade(request, socket, head);
            }
            else {
                socket.destroy();
                return;
            }
        }
        if (pathname.startsWith("/api/proxy/terminal")) {
            return terminalProxy.upgrade(request, socket, head);
        }
        if (pathname.startsWith("/api/proxy/kali-websockify")) {
            var targetUrl = void 0;
            try {
                targetUrl = new URL(KALI_DESKTOP_VNC_URL);
            }
            catch (error) {
                socket.destroy();
                return;
            }
            request.url =
                targetUrl.pathname +
                    (((_a = request.url) === null || _a === void 0 ? void 0 : _a.replace(/^\/api\/proxy\/kali-websockify/, "")) || "");
            console.log("Proxying kali-websockify upgrade request: ", request.url);
            return vncProxy.ws(request, socket, head, {
                target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
            });
        }
        if (pathname.startsWith("/api/proxy/debian-websockify")) {
            if (!DEBIAN_DESKTOP_VNC_URL) {
                socket.destroy();
                return;
            }
            var targetUrl = void 0;
            try {
                targetUrl = new URL(DEBIAN_DESKTOP_VNC_URL);
            }
            catch (error) {
                socket.destroy();
                return;
            }
            request.url =
                targetUrl.pathname +
                    (((_b = request.url) === null || _b === void 0 ? void 0 : _b.replace(/^\/api\/proxy\/debian-websockify/, "")) || "");
            console.log("Proxying debian websockify upgrade request: ", request.url);
            return vncProxy.ws(request, socket, head, {
                target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
            });
        }
        if (pathname.startsWith("/api/proxy/browseros-websockify")) {
            if (!BROWSEROS_DESKTOP_VNC_URL) {
                socket.destroy();
                return;
            }
            var targetUrl = void 0;
            try {
                targetUrl = new URL(BROWSEROS_DESKTOP_VNC_URL);
            }
            catch (error) {
                socket.destroy();
                return;
            }
            request.url =
                targetUrl.pathname +
                    (((_c = request.url) === null || _c === void 0 ? void 0 : _c.replace(/^\/api\/proxy\/browseros-websockify/, "")) || "");
            console.log("Proxying browseros websockify upgrade request: ", request.url);
            return vncProxy.ws(request, socket, head, {
                target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
            });
        }
        if (pathname.startsWith("/api/proxy/websockify")) {
            if (!BYTEBOT_DESKTOP_VNC_URL) {
                socket.destroy();
                return;
            }
            var targetUrl = void 0;
            try {
                targetUrl = new URL(BYTEBOT_DESKTOP_VNC_URL);
            }
            catch (error) {
                socket.destroy();
                return;
            }
            request.url =
                targetUrl.pathname +
                    (((_d = request.url) === null || _d === void 0 ? void 0 : _d.replace(/^\/api\/proxy\/websockify/, "")) || "");
            console.log("Proxying websockify upgrade request: ", request.url);
            return vncProxy.ws(request, socket, head, {
                target: "".concat(targetUrl.protocol, "//").concat(targetUrl.host),
            });
        }
        nextUpgradeHandler(request, socket, head);
    });
    server.listen(port, hostname, function () {
        console.log("> Ready on http://".concat(hostname, ":").concat(port));
    });
})
    .catch(function (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
});
