"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface PlaywrightBrowserProps {
  initialUrl?: string;
  onStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
  className?: string;
}

interface BrowserState {
  status: "connecting" | "connected" | "disconnected" | "error";
  url: string;
  screenshot: string | null;
}

export function PlaywrightBrowser({
  initialUrl = "about:blank",
  onStatusChange,
  className = "h-full w-full",
}: PlaywrightBrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [browserState, setBrowserState] = useState<BrowserState>({
    status: "connecting",
    url: initialUrl,
    screenshot: null,
  });
  const [error, setError] = useState<string | null>(null);

  const connectToBrowser = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/browser/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[PlaywrightBrowser] Connected to browser server");
        onStatusChange?.("connected");
        setBrowserState((prev) => ({ ...prev, status: "connected" }));
        ws.send(JSON.stringify({ type: "navigate", url: initialUrl }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "screenshot") {
            setBrowserState((prev) => ({
              ...prev,
              screenshot: data.image,
              url: data.url || prev.url,
            }));
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
          console.error("[PlaywrightBrowser] Error parsing message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[PlaywrightBrowser] WebSocket error:", error);
        setError("Connection to browser server failed");
        onStatusChange?.("error");
        setBrowserState((prev) => ({ ...prev, status: "error" }));
      };

      ws.onclose = () => {
        console.log("[PlaywrightBrowser] WebSocket closed");
        onStatusChange?.("disconnected");
        setBrowserState((prev) => ({ ...prev, status: "disconnected" }));
      };
    } catch (e) {
      console.error("[PlaywrightBrowser] Failed to connect:", e);
      setError("Failed to connect to browser server");
      onStatusChange?.("error");
      setBrowserState((prev) => ({ ...prev, status: "error" }));
    }
  }, [initialUrl, onStatusChange]);

  useEffect(() => {
    connectToBrowser();
    
    return () => {
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

  const handleClick = useCallback((x: number, y: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "click", x, y }));
    }
  }, []);

  const handleScroll = useCallback((deltaY: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "scroll", deltaY }));
    }
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "key", key }));
    }
  }, []);

  const handleMouseClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (browserState.status !== "connected") return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 1366;
      const y = ((e.clientY - rect.top) / rect.height) * 768;
      handleClick(Math.round(x), Math.round(y));
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
          <div className="mb-2 text-sm font-semibold">Browser Error</div>
          <div className="text-xs">{error}</div>
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
      className={`relative ${className}`}
      onClick={handleMouseClick}
      onWheel={handleWheel}
      tabIndex={0}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 bg-[#1a1b1d] px-3 py-2 border-b border-white/10">
        <button
          onClick={() => handleNavigate(browserState.url)}
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
        <div className="text-[10px] text-[#666]">
          {browserState.status === "connected" ? (
            <span className="text-green-400">● Live</span>
          ) : (
            <span className="text-yellow-400 animate-pulse">● Connecting</span>
          )}
        </div>
      </div>

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
              <div className="text-sm">Starting browser...</div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[#1a1b1d] px-3 py-1 border-t border-white/10">
        <div className="text-[9px] text-[#666] font-mono">
          Playwright Browser
        </div>
        <div className="text-[9px] text-[#555]">
          {browserState.url || "about:blank"}
        </div>
      </div>
    </div>
  );
}
