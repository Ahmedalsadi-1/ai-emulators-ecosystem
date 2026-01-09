"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Globe } from "lucide-react";

interface UITarsBrowserProps {
  initialUrl?: string;
  onStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
  onScreenshot?: (screenshot: string) => void;
  className?: string;
}

interface BrowserState {
  status: "connecting" | "connected" | "disconnected" | "error";
  url: string;
  screenshot: string | null;
}

// UI-TARS WebSocket URL - connects to local UI-TARS server
const getUiTarsWsUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/browser/ws`;
};

export function UITarsBrowserView({
  initialUrl = "https://www.google.com",
  onStatusChange,
  onScreenshot,
  className = "h-full w-full",
}: UITarsBrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [browserState, setBrowserState] = useState<BrowserState>({
    status: "connecting",
    url: initialUrl,
    screenshot: null,
  });
  const [error, setError] = useState<string | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const connectToBrowser = useCallback(() => {
    try {
      const wsUrl = getUiTarsWsUrl();
      console.log("[UITarsBrowser] Connecting to:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[UITarsBrowser] Connected to UI-TARS browser server");
        onStatusChange?.("connected");
        setBrowserState((prev) => ({ ...prev, status: "connected" }));
        // Navigate to initial URL
        ws.send(JSON.stringify({ type: "navigate", url: initialUrl }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "screenshot") {
            const screenshotData = data.image;
            setBrowserState((prev) => ({
              ...prev,
              screenshot: screenshotData,
              url: data.url || prev.url,
            }));
            onScreenshot?.(screenshotData);
          } else if (data.type === "urlchange") {
            setBrowserState((prev) => ({
              ...prev,
              url: data.url,
            }));
          } else if (data.type === "error") {
            setError(data.message);
            onStatusChange?.("error");
            setBrowserState((prev) => ({ ...prev, status: "error" }));
          } else if (data.type === "status") {
            if (data.status === "disconnected") {
              onStatusChange?.("disconnected");
              setBrowserState((prev) => ({ ...prev, status: "disconnected" }));
            }
          }
        } catch (e) {
          console.error("[UITarsBrowser] Error parsing message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[UITarsBrowser] WebSocket error:", error);
        setError("Connection to UI-TARS browser server failed");
        onStatusChange?.("error");
        setBrowserState((prev) => ({ ...prev, status: "error" }));
      };

      ws.onclose = () => {
        console.log("[UITarsBrowser] WebSocket closed");
        onStatusChange?.("disconnected");
        setBrowserState((prev) => ({ ...prev, status: "disconnected" }));
        
        // Auto-reconnect after delay
        reconnectTimerRef.current = window.setTimeout(() => {
          console.log("[UITarsBrowser] Attempting to reconnect...");
          connectToBrowser();
        }, 3000);
      };
    } catch (e) {
      console.error("[UITarsBrowser] Failed to connect:", e);
      setError("Failed to connect to UI-TARS browser server");
      onStatusChange?.("error");
      setBrowserState((prev) => ({ ...prev, status: "error" }));
    }
  }, [initialUrl, onStatusChange, onScreenshot]);

  useEffect(() => {
    connectToBrowser();
    
    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectToBrowser]);

  const handleNavigate = useCallback((url: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "navigate", url }));
    }
  }, []);

  const handleAction = useCallback((action: string, params?: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: action, ...params }));
    }
  }, []);

  const handleClick = useCallback((x: number, y: number) => {
    handleAction("click", { x, y });
  }, [handleAction]);

  const handleScroll = useCallback((deltaY: number) => {
    handleAction("scroll", { delta_y: deltaY });
  }, [handleAction]);

  const handleKeyPress = useCallback((key: string) => {
    handleAction("key", { key });
  }, [handleAction]);

  const handleMouseClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (browserState.status !== "connected") return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      // Scale to browser resolution (typically 1366x768)
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 1366);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 768);
      handleClick(x, y);
    },
    [browserState.status, handleClick]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (browserState.status !== "connected") return;
      handleScroll(e.deltaY > 0 ? 100 : -100);
    },
    [browserState.status, handleScroll]
  );

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[#141417] ${className}`}>
        <div className="text-center text-red-400">
          <div className="mb-2 text-sm font-semibold">UI-TARS Browser Error</div>
          <div className="text-xs">{error}</div>
          <div className="mt-2 text-[10px] text-gray-500">
            Make sure UI-TARS server is running on port 8766
          </div>
          <button
            onClick={connectToBrowser}
            className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-200 transition-all hover:bg-red-400/20"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className} bg-[#0b0b0d]`}
      onClick={handleMouseClick}
      onWheel={handleWheel}
      tabIndex={0}
    >
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 bg-[#1a1b1d] px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => connectToBrowser()}
            className="rounded p-1 hover:bg-white/10"
            title="Refresh"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <input
            type="text"
            value={browserState.url}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value) {
                let url = e.currentTarget.value;
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                  url = "https://" + url;
                }
                handleNavigate(url);
              }
            }}
            className="flex-1 rounded bg-[#0b0b0c] px-3 py-1 text-xs text-[#e6e6e6] border border-white/10 focus:outline-none focus:border-blue-500/50"
            placeholder="Enter URL..."
          />
        </div>
        <div className="text-[10px] text-[#666]">
          {browserState.status === "connected" ? (
            <span className="text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              UI-TARS Live
            </span>
          ) : (
            <span className="text-yellow-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Browser Content */}
      <div className="pt-10 h-full">
        {browserState.screenshot ? (
          <div
            className="relative h-full w-full cursor-crosshair"
            style={{
              backgroundImage: `url(${browserState.screenshot})`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-slate-400">
              <div className="mb-2 animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <div className="text-sm">Starting UI-TARS Browser...</div>
              <div className="text-xs mt-1 text-slate-500">Waiting for screenshot stream</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[#1a1b1d] px-3 py-1 border-t border-white/10">
        <div className="flex items-center gap-2 text-[9px] text-[#666]">
          <Globe className="w-3 h-3 text-blue-400" />
          <span className="font-mono">UI-TARS Browser</span>
        </div>
        <div className="text-[9px] text-[#555] font-mono">
          {browserState.url || "about:blank"}
        </div>
      </div>
    </div>
  );
}

export default UITarsBrowserView;
