"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { UITARSViewer } from "@/components/os-ai/UITARSViewer";

type ViewerStatus = "idle" | "connecting" | "connected" | "error" | "unavailable";

type ScreenshotEvent = {
  method?: string;
  params?: {
    mime?: string;
    data?: string;
  };
};

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_OS_AI_WS_URL || "";
const FALLBACK_WS_URLS = [
  DEFAULT_WS_URL,
  "ws://localhost:8765/ws?token=secret",
  "ws://127.0.0.1:8765/ws?token=secret",
];

type LocalScreenViewerProps = {
  preferredBackend?: "os-ai" | "ui-tars";
};

export function LocalScreenViewer({ preferredBackend }: LocalScreenViewerProps) {
  const [status, setStatus] = useState<ViewerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const wsUrls = useMemo(() => {
    const unique = new Set(
      FALLBACK_WS_URLS.filter((url) => url && url.trim().length > 0),
    );
    return Array.from(unique);
  }, []);
  const wsUrl = wsUrls[activeUrlIndex];
  const hasWsUrl = wsUrls.length > 0;

  useEffect(() => {
    if (!hasWsUrl) {
      // No WebSocket URL configured - show unavailable state
      setStatus("unavailable");
      return;
    }

    let cancelled = false;

    const scheduleReconnect = () => {
      if (cancelled) return;
      if (reconnectAttempts.current >= 3) {
        setShowFallbackOptions(true);
        return;
      }
      const delay = Math.min(15000, 1000 * 2 ** reconnectAttempts.current);
      reconnectAttempts.current += 1;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!cancelled) connect();
      }, delay);
    };

    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");
      setErrorMessage(null);

      if (!wsUrl) {
        setStatus("error");
        setErrorMessage("OS AI WebSocket URL is not configured.");
        return;
      }

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (cancelled) return;
          reconnectAttempts.current = 0;
          setStatus("connected");
        };

        socket.onerror = () => {
          if (cancelled) return;
          if (activeUrlIndex < wsUrls.length - 1) {
            setActiveUrlIndex((prev) => prev + 1);
            return;
          }
          setStatus("error");
          setErrorMessage("WebSocket error. OS AI backend may not be running.");
          scheduleReconnect();
        };

        socket.onclose = () => {
          if (cancelled) return;
          if (activeUrlIndex < wsUrls.length - 1) {
            setActiveUrlIndex((prev) => prev + 1);
            return;
          }
          setStatus("error");
          setErrorMessage("Disconnected from OS AI backend.");
          scheduleReconnect();
        };

        socket.onmessage = (event) => {
          let payload: ScreenshotEvent | null = null;

          try {
            payload = JSON.parse(event.data) as ScreenshotEvent;
          } catch (error) {
            return;
          }

          if (payload?.method !== "event.screenshot") {
            return;
          }

          const mime = payload.params?.mime || "image/jpeg";
          const data = payload.params?.data;

          if (!data) {
            return;
          }

          setLastScreenshot(`data:${mime};base64,${data}`);
          setLastUpdated(new Date().toLocaleTimeString());
        };
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Failed to create WebSocket connection.");
          scheduleReconnect();
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [activeUrlIndex, hasWsUrl, wsUrl, wsUrls.length]);

  // UI-TARS backend (always available as fallback)
  if (preferredBackend === "ui-tars") {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-4">
        <div className="rounded-md border border-white/10 bg-[#0f1012] px-3 py-2 text-[11px] text-[#bdbdbd]">
          Local screen using UI-TARS backend (screen capture via mobile-mcp)
        </div>
        <div className="flex-1">
          <UITARSViewer />
        </div>
      </div>
    );
  }

  // No WebSocket URL configured
  if (!hasWsUrl) {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-4">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          ⚠️ OS-AI WebSocket URL not configured. Set NEXT_PUBLIC_OS_AI_WS_URL environment variable.
        </div>
        <div className="rounded-md border border-white/10 bg-[#0f1012] px-3 py-2 text-[11px] text-[#bdbdbd]">
          Falling back to UI-TARS viewer (uses mobile-mcp for screen capture).
        </div>
        <div className="flex-1">
          <UITARSViewer />
        </div>
      </div>
    );
  }

  // OS-AI unavailable after retries
  if (status === "unavailable" || showFallbackOptions) {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-4">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          ⚠️ OS-AI backend is not responding. Make sure the service is running on port 8765.
        </div>
        <div className="rounded-md border border-white/10 bg-[#0f1012] px-3 py-2 text-[11px] text-[#bdbdbd]">
          Switching to UI-TARS backend (uses mobile-mcp for screen capture).
        </div>
        <div className="flex-1">
          <UITARSViewer />
        </div>
        <div className="text-[10px] text-gray-500">
          Expected WebSocket: {wsUrl || DEFAULT_WS_URL || "Not configured"}
        </div>
      </div>
    );
  }

  // Error state - show fallback option
  if (status === "error") {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-4">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          ⚠️ {errorMessage || "OS-AI WebSocket connection failed."}
        </div>
        <div className="flex-1">
          <UITARSViewer />
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              setShowFallbackOptions(false);
              reconnectAttempts.current = 0;
              setActiveUrlIndex(0);
            }}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-gray-300 hover:bg-white/10"
          >
            Retry Connection
          </button>
          <span className="text-[9px] text-gray-500">
            Last checked: {wsUrl}
          </span>
        </div>
      </div>
    );
  }

  // Connected - show screenshot
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a9a9a]">
        <span className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          {status === 'connected' ? 'OS-AI Connected' : 'Connecting...'}
        </span>
        {wsUrl && (
          <span className="rounded-md border border-white/10 bg-[#1a1b1d] px-2 py-1 text-[#bdbdbd]">
            {wsUrl}
          </span>
        )}
        {lastUpdated && (
          <span className="rounded-md border border-white/10 bg-[#1a1b1d] px-2 py-1 text-[#bdbdbd]">
            Last frame {lastUpdated}
          </span>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-[#0f1012]">
        {lastScreenshot ? (
          <img
            src={lastScreenshot}
            alt="Local screen capture"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center text-sm text-[#9a9a9a]">
            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
            Waiting for screenshots from OS AI backend...
          </div>
        )}
      </div>
    </div>
  );
}

export default LocalScreenViewer;
