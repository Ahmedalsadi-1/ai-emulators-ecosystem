"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Ref } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MonitorPlay,
  LayoutGrid,
  Smartphone,
  Zap,
  Maximize2,
  Minimize2,
  RefreshCw,
  MousePointer2,
  ArrowUpDown,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface UITARSViewerProps {
  controllerType?: string;
  viewOnly?: boolean;
}

interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UITARSState {
  connected: boolean;
  screenshot: string | null;
  actionMode: "observe" | "click" | "type" | "scroll";
  lastAction: string | null;
  status: "idle" | "processing" | "error";
  screenWidth?: number;
  screenHeight?: number;
  lastError?: string;
}

// Simulated UI-TARS viewer based on os-ai-computer-use backend
const UI_TARS_WS_URL =
  process.env.NEXT_PUBLIC_UI_TARS_WS_URL ||
  process.env.NEXT_PUBLIC_OS_AI_WS_URL ||
  "ws://localhost:8765/ws";

export function UITARSViewer({
  controllerType,
  viewOnly = false,
}: UITARSViewerProps) {
  const [state, setState] = useState<UITARSState>({
    connected: false,
    screenshot: null,
    actionMode: "observe",
    lastAction: null,
    status: "idle",
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to os-ai-backend WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(UI_TARS_WS_URL);

        wsRef.current.onopen = () => {
          console.log("UI-TARS WebSocket connected");
          setState((prev) => ({ ...prev, connected: true, status: "idle", lastError: undefined }));
          // Request initial screenshot
          wsRef.current?.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "screenshot",
              params: {},
            })
          );
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.result?.image) {
              setState((prev) => ({
                ...prev,
                screenshot: `data:image/png;base64,${data.result.image}`,
                status: "idle",
                lastError: undefined,
              }));
            } else if (data.error) {
              const errorMessage = data.error?.message || String(data.error) || "Unknown connection error";
              console.warn("UI-TARS error:", data.error);
              setState((prev) => ({
                ...prev,
                connected: false,
                status: "error",
                lastError: errorMessage,
              }));
            }
          } catch (error) {
            console.warn("Failed to parse UI-TARS message:", error);
            setState((prev) => ({
              ...prev,
              connected: false,
              status: "error",
              lastError: "Failed to parse server response",
            }));
          }
        };

        wsRef.current.onclose = (event) => {
          console.warn("UI-TARS WebSocket disconnected", event);
          setState((prev) => ({
            ...prev,
            connected: false,
            status: "error",
            lastError: `Connection closed (code: ${event.code})`,
          }));
          // Reconnect after delay
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.warn("UI-TARS WebSocket error:", error);
          setState((prev) => ({
            ...prev,
            connected: false,
            status: "error",
            lastError: `WebSocket connection failed (${UI_TARS_WS_URL})`,
              }));
        };
      } catch (error) {
        console.error("Failed to connect to UI-TARS:", error);
        setState((prev) => ({
          ...prev,
          connected: false,
          status: "error",
          lastError: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleAction = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      if (!wsRef.current || state.status === "processing") return;
      if (wsRef.current.readyState !== WebSocket.OPEN) {
        setState((prev) => ({
          ...prev,
          status: "error",
          lastError: "UI-TARS WebSocket is not ready yet.",
        }));
        return;
      }

      setState((prev) => ({ ...prev, status: "processing", lastAction: action }));

      try {
        wsRef.current.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method: action,
            params,
          })
        );
      } catch (error) {
        console.error(`Failed to execute ${action}:`, error);
        setState((prev) => ({ ...prev, status: "error", lastAction: null }));
      }
    },
    [state.status]
  );

  const handleClick = (e: React.MouseEvent) => {
    if (viewOnly || state.actionMode !== "click") return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Use image dimensions if available, otherwise use standard 3456x2160
    const screenWidth = state.screenWidth || 3456;
    const screenHeight = state.screenHeight || 2160;
    
    const x = Math.round(((e.clientX - rect.left) / rect.width) * screenWidth);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * screenHeight);
    
    console.log(`UI-TARS Click: (${x}, ${y}) on ${screenWidth}x${screenHeight} screen`);
    handleAction("click", { x, y });
  };

  const handleScroll = (e: React.WheelEvent) => {
    if (viewOnly || state.actionMode !== "scroll") return;
    const delta_y = e.deltaY > 0 ? 5 : -5;
    console.log(`UI-TARS Scroll: ${delta_y}`);
    handleAction("scroll", { delta_y });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-kronos-obsidian overflow-hidden rounded-lg border border-glass"
    >
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-kronos-glass backdrop-blur-glass border-b border-glass flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                state.connected
                  ? "bg-green-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {state.connected ? "UI-TARS Connected" : "Connecting..."}
            </span>
          </div>
          {state.status === "processing" && (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Action mode selector */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setState((prev) => ({ ...prev, actionMode: "observe" }))}
              className={`p-1.5 rounded ${
                state.actionMode === "observe"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white"
              }`}
              title="Observe mode"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setState((prev) => ({ ...prev, actionMode: "click" }))}
              className={`p-1.5 rounded ${
                state.actionMode === "click"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white"
              }`}
              title="Click mode"
            >
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setState((prev) => ({ ...prev, actionMode: "scroll" }))}
              className={`p-1.5 rounded ${
                state.actionMode === "scroll"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white"
              }`}
              title="Scroll mode"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => handleAction("screenshot")}
            className="p-1.5 rounded-lg bg-white/5 text-kronos-text-secondary hover:text-white hover:bg-white/10"
            title="Refresh screenshot"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/5 text-kronos-text-secondary hover:text-white hover:bg-white/10"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main screen area */}
      <div
        className={`w-full h-full pt-10 pb-4 px-4 ${
          state.actionMode === "click" ? "cursor-crosshair" : "cursor-default"
        }`}
        onClick={handleClick}
        onWheel={handleScroll}
      >
        {state.screenshot ? (
          <motion.img
            src={state.screenshot}
            alt="UI-TARS screen"
            className="w-full h-full object-contain rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : state.status === "error" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 text-sm font-medium">
                Connection Failed
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {state.lastError || "Unable to connect to UI-TARS backend"}
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Make sure UI-TARS backend is running at {UI_TARS_WS_URL}
              </p>
              <button
                onClick={() => handleAction("screenshot")}
                className="mt-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <p className="text-gray-400 text-sm">
                Connecting to UI-TARS...
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Using UI-TARS backend at {UI_TARS_WS_URL}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Last action indicator */}
      <AnimatePresence>
        {state.lastAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10"
          >
            <span className="text-xs text-gray-400">
              Last action: <span className="text-white">{state.lastAction}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UITARSViewer;
