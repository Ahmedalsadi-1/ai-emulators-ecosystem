"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { VncViewer } from "@/components/vnc/VncViewer";
import {
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";

/**
 * BrowserOS Control Endpoint Configuration
 * =========================================
 *
 * This page provides a VNC-based BrowserOS interface. The control endpoint
 * can be configured via environment variable or will use a placeholder.
 *
 * ENVIRONMENT VARIABLE CONFIGURATION:
 * -----------------------------------
 * Set the following in your environment or .env file:
 *
 *   NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL=ws://localhost:9994/websockify
 *
 * PLACEHOLDER BEHAVIOR:
 * ---------------------
 * - When NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL is not set, the system
 *   falls back to the default websockify proxy at /api/proxy/browseros-websockify
 * - The placeholder string "BROWSEROS_ENDPOINT_PLACEHOLDER" is used for
 *   identification and debugging purposes only
 *
 * CONSTANT DEFINITION:
 * --------------------
 * BROWSEROS_CONTROL_ENDPOINT: The WebSocket URL for BrowserOS control
 *   - Environment: process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL
 *   - Fallback: "BROWSEROS_ENDPOINT_PLACEHOLDER"
 *
 * @example
 * # .env file
 * NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL=ws://192.168.1.100:9994/websockify
 *
 * ENDPOINT REQUIREMENTS:
 * ----------------------
 * The BrowserOS control endpoint should:
 * - Accept WebSocket connections at the configured path
 * - Proxy VNC traffic between the browser and the BrowserOS desktop
 * - Support the websockify protocol for VNC transmission
 * - Return appropriate connection status/errors for debugging
 *
 * PROXY PATH CONFIGURATION:
 * -------------------------
 * The VNC viewer uses one of the following proxy paths:
 * - /api/proxy/browseros-websockify (default, for BrowserOS)
 * - /api/proxy/kali-websockify (for Kali Linux desktop)
 *
 * Set NEXT_PUBLIC_BROWSEROS_WEBSOCKIFY_PATH env var to override.
 */
const BROWSEROS_CONTROL_ENDPOINT =
  process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL ||
  process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT ||
  "BROWSEROS_ENDPOINT_PLACEHOLDER";

// Default proxy path for BrowserOS VNC connection
// Can be overridden via NEXT_PUBLIC_BROWSEROS_WEBSOCKIFY_PATH environment variable
const BROWSEROS_WEBSOCKIFY_PATH =
  process.env.NEXT_PUBLIC_BROWSEROS_WEBSOCKIFY_PATH ||
  "/api/proxy/browseros-websockify";
const BROWSEROS_NOVNC_URL =
  process.env.NEXT_PUBLIC_BROWSEROS_NOVNC_URL ||
  "http://localhost:9994/vnc.html";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
type BrowserDisplayMode = "vnc" | "novnc";

// VNC Environment Warning Component
function VncEnvWarning() {
  const [dismissed, setDismissed] = useState(false);

  // Check for missing env vars (only check once on mount)
  useEffect(() => {
    const missing: string[] = [];

    // Check BrowserOS VNC
    if (!process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL &&
        !process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT) {
      missing.push('BROWSEROS_DESKTOP_VNC_URL (BrowserOS VNC)');
    }

    if (missing.length > 0) {
      console.warn('[VNC] Missing environment variables:', missing);
    }
  }, []);

  // Don't render if dismissed
  if (dismissed) return null;

  // Only show warning if env vars are actually missing
  const showWarning =
    !process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL &&
    !process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT;

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-200">VNC Configuration Needed</h4>
          <p className="mt-1 text-xs text-amber-300/80">
            To enable BrowserOS VNC viewing, set:
          </p>
          <div className="mt-2 space-y-1">
            <code className="block rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
              BROWSEROS_DESKTOP_VNC_URL=ws://localhost:9994/websockify
            </code>
            <p className="text-xs text-amber-400/60">
              Start the BrowserOS VNC container and restart the UI server.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-200"
          aria-label="Dismiss warning"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function WebPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    "connecting"
  );
  const [retryKey, setRetryKey] = useState(0);
  const [useNoVncFallback, setUseNoVncFallback] = useState(false);
  const [displayMode, setDisplayMode] = useState<BrowserDisplayMode>("vnc");

  const handleRefresh = useCallback(() => {
    setConnectionStatus("connecting");
    setUseNoVncFallback(false);
    setDisplayMode("vnc");
    setRetryKey((prev) => prev + 1);
  }, []);

  const handleConnectionStatus = useCallback(
    (status: "connecting" | "connected" | "disconnected" | "error") => {
      setConnectionStatus(status);
      if (status === "error") {
        setUseNoVncFallback(true);
        setDisplayMode("novnc");
      }
    },
    []
  );

  useEffect(() => {
    if (displayMode !== "vnc") return;
    if (connectionStatus === "connected") return;
    const timeout = window.setTimeout(() => {
      setUseNoVncFallback(true);
      setDisplayMode("novnc");
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [connectionStatus, displayMode]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => {
      const next = prev === "vnc" ? "novnc" : "vnc";
      if (next === "vnc") {
        setUseNoVncFallback(false);
      }
      return next;
    });
  }, []);

  const shouldUseNoVnc = displayMode === "novnc" || useNoVncFallback;

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0b0b0c] text-[#e6e6e6]"
      data-browseros-endpoint={BROWSEROS_CONTROL_ENDPOINT}
    >
      {/* Ambient radial gradients for matte black depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_top,_rgba(42,42,42,0.35),_transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_bottom,_rgba(16,16,16,0.8),_transparent_70%)]" />

      <VncEnvWarning />

      <main className="relative z-10 flex min-h-screen w-full flex-col px-4 py-6">
        {/* Top Bar - BrowserOS UI Framing */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 flex items-center justify-between rounded-lg border border-white/10 bg-[#141417]/85 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_8px_24px_rgba(0,0,0,0.4)]"
        >
          {/* Left: BrowserOS Label */}
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e6e6e6]">
              BrowserOS
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              {/* Connection Status Indicator */}
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-400 animate-pulse"
                    : connectionStatus === "error"
                    ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bdbdbd]">
                {connectionStatus === "connected"
                  ? "Live"
                  : connectionStatus === "connecting"
                  ? "Connecting"
                  : connectionStatus === "error"
                  ? "Error"
                  : "Offline"}
              </span>
            </div>
          </div>

          {/* Right: BrowserOS Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
              title="Refresh connection"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              type="button"
              onClick={toggleDisplayMode}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
              title={displayMode === "vnc" ? "Switch to noVNC" : "Switch to VNC"}
            >
              {displayMode === "vnc" ? "Use noVNC" : "Use VNC"}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
          </div>
        </motion.div>

        {/* VNC Viewer Container - Full Screen BrowserOS View */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#141417]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_40px_90px_rgba(0,0,0,0.65)]"
        >
          <div className="h-full w-full">
            {shouldUseNoVnc ? (
              <iframe
                key={`novnc-${retryKey}`}
                src={BROWSEROS_NOVNC_URL}
                className="h-full w-full"
                title="BrowserOS noVNC"
              />
            ) : (
              <VncViewer
                key={`${retryKey}-${displayMode}`}
                viewOnly={false}
                controllerType="browseros"
                proxyPath={BROWSEROS_WEBSOCKIFY_PATH}
                onStatusChange={handleConnectionStatus}
              />
            )}
          </div>
        </motion.div>

        {/* Bottom Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-3 flex items-center justify-between px-1"
        >
          <div className="flex items-center gap-2 text-[9px] text-[#666]">
            <span className="font-mono">{BROWSEROS_CONTROL_ENDPOINT}</span>
            <span className="text-white/20">|</span>
            <span>{shouldUseNoVnc ? "noVNC fallback" : "VNC Interactive Mode"}</span>
          </div>
          <div className="text-[9px] text-[#555]">
            BrowserOS Control Surface
          </div>
        </motion.div>
      </main>
    </div>
  );
}
