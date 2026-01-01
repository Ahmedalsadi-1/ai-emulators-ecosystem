import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createProxyServer } from "http-proxy";
import next from "next";
import { createServer } from "http";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "9992", 10);

// Backend URLs - Use NEXT_PUBLIC_* for consistency (works in both server and client)
const BYTEBOT_AGENT_BASE_URL = process.env.NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL || process.env.BYTEBOT_AGENT_BASE_URL;
const BYTEBOT_DESKTOP_VNC_URL = process.env.BYTEBOT_DESKTOP_VNC_URL;
const BYTEBOT_DESKTOP_BASE_URL = process.env.BYTEBOT_DESKTOP_BASE_URL;
const DEBIAN_DESKTOP_VNC_URL =
  process.env.DEBIAN_DESKTOP_VNC_URL ||
  process.env.NEXT_PUBLIC_DEBIAN_DESKTOP_VNC_URL ||
  "ws://localhost:9995/websockify";
const KALI_DESKTOP_VNC_URL =
  process.env.BYTEBOT_DESKTOP_KALI_VNC_URL ||
  process.env.KALI_DESKTOP_VNC_URL ||
  "ws://localhost:9993/websockify";
const BROWSEROS_DESKTOP_VNC_URL =
  process.env.BROWSEROS_DESKTOP_VNC_URL ||
  process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL;

const resolveDesktopBaseUrl = () => {
  if (BYTEBOT_DESKTOP_BASE_URL) return BYTEBOT_DESKTOP_BASE_URL;
  if (!BYTEBOT_DESKTOP_VNC_URL) return undefined;
  try {
    const vncUrl = new URL(BYTEBOT_DESKTOP_VNC_URL);
    const protocol = vncUrl.protocol === "wss:" ? "https:" : "http:";
    return `${protocol}//${vncUrl.host}`;
  } catch (error) {
    console.warn(
      "BYTEBOT_DESKTOP_VNC_URL is invalid; falling back to default desktop URL.",
      error,
    );
    return undefined;
  }
};

const DESKTOP_BASE_URL = resolveDesktopBaseUrl() || "http://localhost:9990";

const app = next({ dev, hostname, port });

const expressApp = express();
const server = createServer(expressApp);

// Set up proxies immediately
const vncProxy = createProxyServer({ changeOrigin: true, ws: true });

// Guards for required environment variables
if (!BYTEBOT_AGENT_BASE_URL) {
  console.error("BYTEBOT_AGENT_BASE_URL is not set! Task API calls will fail.");
}

// HTTP proxy for REST API calls to backend
const tasksHttpProxy = BYTEBOT_AGENT_BASE_URL ? createProxyMiddleware({
  target: BYTEBOT_AGENT_BASE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/proxy/tasks": "/tasks" },
}) : null;

// WebSocket proxy for Socket.IO connections to backend
const tasksWsProxy = BYTEBOT_AGENT_BASE_URL
  ? createProxyMiddleware({
      target: BYTEBOT_AGENT_BASE_URL,
      ws: true,
      changeOrigin: true,
    })
  : null;

const desktopProxy = createProxyMiddleware({
  target: DESKTOP_BASE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/proxy/desktop": "" },
});

const terminalProxy = createProxyMiddleware({
  target: DESKTOP_BASE_URL,
  ws: true,
  changeOrigin: true,
  pathRewrite: { "^/api/proxy/terminal": "/terminal" },
});

const authProxy = createProxyMiddleware({
  target: DESKTOP_BASE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "/auth" },
});

// General API proxy to backend
console.log("Setting up API proxy with target:", BYTEBOT_AGENT_BASE_URL || "(not configured - using fallback handlers)");
const apiProxy = BYTEBOT_AGENT_BASE_URL ? createProxyMiddleware({
  target: BYTEBOT_AGENT_BASE_URL,
  changeOrigin: true,
  // Don't strip /api - bytebot-agent uses global prefix "api"
  // So /api/tasks/models → /api/tasks/models on target
}) : null;

vncProxy.on("error", (error, req, res) => {
  console.error("VNC proxy error:", error);
  // Only handle ServerResponse, not Socket
  if (res && 'writeHead' in res && !res.headersSent) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "VNC proxy error",
        message: error.message,
      }),
    );
  }
});

// Apply HTTP proxies in correct order (specific routes before generic)
if (tasksHttpProxy) {
  expressApp.use("/api/proxy/tasks", tasksHttpProxy);
} else {
  expressApp.use("/api/proxy/tasks", (req, res) => {
    res.status(500).json({ error: "BYTEBOT_AGENT_BASE_URL not configured" });
  });
}

expressApp.use("/api/auth", authProxy);
expressApp.use("/api/proxy/desktop", desktopProxy);
expressApp.use("/api/proxy/terminal", terminalProxy);

// Debian VNC proxy (must be before generic /api proxy)
expressApp.use("/api/proxy/websockify", (req, res) => {
  if (!BYTEBOT_DESKTOP_VNC_URL) {
    console.error("BYTEBOT_DESKTOP_VNC_URL not configured");
    res.status(500).json({ error: "BYTEBOT_DESKTOP_VNC_URL not configured" });
    return;
  }

  console.log("Proxying debian websockify request");
  // Rewrite path
  let targetUrl: URL;
  try {
    targetUrl = new URL(BYTEBOT_DESKTOP_VNC_URL);
  } catch (error) {
    res.status(400).json({ error: "BYTEBOT_DESKTOP_VNC_URL is invalid" });
    return;
  }

  req.url =
    targetUrl.pathname +
    (req.url?.replace(/^\/api\/proxy\/websockify/, "") || "");
  vncProxy.web(req, res, {
    target: `${targetUrl.protocol}//${targetUrl.host}`,
  });
});

// Debian VNC proxy (explicit desktop 2)
expressApp.use("/api/proxy/debian-websockify", (req, res) => {
  if (!DEBIAN_DESKTOP_VNC_URL) {
    console.error("DEBIAN_DESKTOP_VNC_URL not configured");
    res.status(500).json({ error: "DEBIAN_DESKTOP_VNC_URL not configured" });
    return;
  }

  console.log("Proxying debian websockify request");
  let targetUrl: URL;
  try {
    targetUrl = new URL(DEBIAN_DESKTOP_VNC_URL);
  } catch (error) {
    res.status(400).json({ error: "DEBIAN_DESKTOP_VNC_URL is invalid" });
    return;
  }

  req.url =
    targetUrl.pathname +
    (req.url?.replace(/^\/api\/proxy\/debian-websockify/, "") || "");
  vncProxy.web(req, res, {
    target: `${targetUrl.protocol}//${targetUrl.host}`,
  });
});

// Kali VNC proxy (must be before generic /api proxy)
expressApp.use("/api/proxy/kali-websockify", (req, res) => {
  console.log("Proxying kali websockify request");
  let targetUrl: URL;
  try {
    targetUrl = new URL(KALI_DESKTOP_VNC_URL);
  } catch (error) {
    res.status(400).json({ error: "KALI_DESKTOP_VNC_URL is invalid" });
    return;
  }

  req.url =
    targetUrl.pathname +
    (req.url?.replace(/^\/api\/proxy\/kali-websockify/, "") || "");
  vncProxy.web(req, res, {
    target: `${targetUrl.protocol}//${targetUrl.host}`,
  });
});

// BrowserOS VNC proxy (must be before generic /api proxy)
expressApp.use("/api/proxy/browseros-websockify", (req, res) => {
  if (!BROWSEROS_DESKTOP_VNC_URL) {
    console.error("BROWSEROS_DESKTOP_VNC_URL not configured");
    res.status(500).json({ error: "BROWSEROS_DESKTOP_VNC_URL not configured" });
    return;
  }

  console.log("Proxying browseros websockify request");
  let targetUrl: URL;
  try {
    targetUrl = new URL(BROWSEROS_DESKTOP_VNC_URL);
  } catch (error) {
    res.status(400).json({ error: "BROWSEROS_DESKTOP_VNC_URL is invalid" });
    return;
  }

  req.url =
    targetUrl.pathname +
    (req.url?.replace(/^\/api\/proxy\/browseros-websockify/, "") || "");
  vncProxy.web(req, res, {
    target: `${targetUrl.protocol}//${targetUrl.host}`,
  });
});

// Generic API proxy for all other /api/* routes (runs after specific routes)
expressApp.use("/api", (req, res, next) => {
  // Mounted at /api, so req.url is the remainder (e.g., "/tasks/models")
  // Prepend /api to get the full path for bytebot-agent (which uses global prefix "api")
  const originalUrl = req.url;
  req.url = "/api" + req.url;
  console.log(`API request: ${req.method} ${originalUrl} → proxying to ${req.url}`);
  
  if (apiProxy) {
    apiProxy(req, res, (err) => {
      // Restore URL after proxy (for logging/cleanup)
      req.url = originalUrl;
      if (err) next(err);
    });
  } else {
    req.url = originalUrl; // restore for error response
    res.status(500).json({ error: "BYTEBOT_AGENT_BASE_URL not configured" });
  }
});
app
  .prepare()
  .then(() => {
    const handle = app.getRequestHandler();
    const nextUpgradeHandler = app.getUpgradeHandler();

    // Handle all other requests with Next.js
    expressApp.all("*", (req, res) => handle(req, res));

    // Properly upgrade WebSocket connections
    server.on("upgrade", (request, socket, head) => {
      const { pathname } = new URL(
        request.url!,
        `http://${request.headers.host}`,
      );

      if (pathname.startsWith("/api/proxy/tasks")) {
        if (tasksWsProxy) {
          return tasksWsProxy.upgrade(request, socket as any, head);
        } else {
          socket.destroy();
          return;
        }
      }

      if (pathname.startsWith("/api/proxy/terminal")) {
        return terminalProxy.upgrade(request, socket as any, head);
      }

      if (pathname.startsWith("/api/proxy/kali-websockify")) {
        let targetUrl: URL;
        try {
          targetUrl = new URL(KALI_DESKTOP_VNC_URL);
        } catch (error) {
          socket.destroy();
          return;
        }
        request.url =
          targetUrl.pathname +
          (request.url?.replace(/^\/api\/proxy\/kali-websockify/, "") || "");
        console.log("Proxying kali-websockify upgrade request: ", request.url);
        return vncProxy.ws(request, socket as any, head, {
          target: `${targetUrl.protocol}//${targetUrl.host}`,
        });
      }

      if (pathname.startsWith("/api/proxy/debian-websockify")) {
        if (!DEBIAN_DESKTOP_VNC_URL) {
          socket.destroy();
          return;
        }
        let targetUrl: URL;
        try {
          targetUrl = new URL(DEBIAN_DESKTOP_VNC_URL);
        } catch (error) {
          socket.destroy();
          return;
        }
        request.url =
          targetUrl.pathname +
          (request.url?.replace(/^\/api\/proxy\/debian-websockify/, "") || "");
        console.log("Proxying debian websockify upgrade request: ", request.url);
        return vncProxy.ws(request, socket as any, head, {
          target: `${targetUrl.protocol}//${targetUrl.host}`,
        });
      }

      if (pathname.startsWith("/api/proxy/browseros-websockify")) {
        if (!BROWSEROS_DESKTOP_VNC_URL) {
          socket.destroy();
          return;
        }
        let targetUrl: URL;
        try {
          targetUrl = new URL(BROWSEROS_DESKTOP_VNC_URL);
        } catch (error) {
          socket.destroy();
          return;
        }
        request.url =
          targetUrl.pathname +
          (request.url?.replace(/^\/api\/proxy\/browseros-websockify/, "") || "");
        console.log("Proxying browseros websockify upgrade request: ", request.url);
        return vncProxy.ws(request, socket as any, head, {
          target: `${targetUrl.protocol}//${targetUrl.host}`,
        });
      }

      if (pathname.startsWith("/api/proxy/websockify")) {
        if (!BYTEBOT_DESKTOP_VNC_URL) {
          socket.destroy();
          return;
        }

        let targetUrl: URL;
        try {
          targetUrl = new URL(BYTEBOT_DESKTOP_VNC_URL);
        } catch (error) {
          socket.destroy();
          return;
        }
        request.url =
          targetUrl.pathname +
          (request.url?.replace(/^\/api\/proxy\/websockify/, "") || "");
        console.log("Proxying websockify upgrade request: ", request.url);
        return vncProxy.ws(request, socket as any, head, {
          target: `${targetUrl.protocol}//${targetUrl.host}`,
        });
      }

      nextUpgradeHandler(request, socket, head);
    });

    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
  });
