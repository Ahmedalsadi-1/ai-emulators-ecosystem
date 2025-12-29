"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface VncViewerProps {
  viewOnly?: boolean;
  proxyPath?: string; // e.g., "/api/proxy/websockify" or "/api/proxy/kali-websockify"
}

export function VncViewer({ viewOnly = true, proxyPath = "/api/proxy/websockify" }: VncViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [VncComponent, setVncComponent] = useState<any>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [vncError, setVncError] = useState<string | null>(null);
  const [isVncConnecting, setIsVncConnecting] = useState(false);

  useEffect(() => {
    // Dynamically import the VncScreen component only on the client side
    import("react-vnc").then(({ VncScreen }) => {
      setVncComponent(() => VncScreen);
    });
  }, []);

  const testWebSocketConnection = useCallback(() => {
    if (typeof window === "undefined") return; // SSR safety‑net
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}${proxyPath}`;
    setWsUrl(url);

    // Test WebSocket connectivity
    setIsVncConnecting(true);
    setVncError(null);

    let connectionOpened = false;
    let closedEarly = false;
    const testWs = new WebSocket(url);
    const timeout = setTimeout(() => {
      if (!connectionOpened && !closedEarly) {
        setVncError("VNC connection timeout - unable to reach websockify server");
        setIsVncConnecting(false);
      }
    }, 5000);

    testWs.onopen = () => {
      connectionOpened = true;
      clearTimeout(timeout);
      testWs.close();
      setIsVncConnecting(false);
    };

    testWs.onerror = () => {
      clearTimeout(timeout);
      if (!connectionOpened) {
        setVncError("VNC connection failed - websockify server may be down");
        setIsVncConnecting(false);
      }
    };

    testWs.onclose = (event) => {
      clearTimeout(timeout);
      if (connectionOpened) return;
      closedEarly = true;
      if (!event.wasClean && event.code !== 1000 && event.code !== 1001) {
        setVncError("VNC connection failed - unable to establish connection");
        setIsVncConnecting(false);
      }
    };

    return () => {
      clearTimeout(timeout);
      testWs.close();
    };
  }, [proxyPath]);

  useEffect(() => {
    const cleanup = testWebSocketConnection();
    return cleanup; // Properly cleanup WebSocket connections
  }, [testWebSocketConnection]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {vncError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-red-500/50 bg-red-500/10 p-4">
          <div className="text-center">
            <div className="mb-2 text-sm font-semibold text-red-200">VNC Connection Error</div>
            <div className="text-xs text-red-300">{vncError}</div>
            <button
              onClick={testWebSocketConnection}
              className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-200 transition-all hover:bg-red-400/20"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
      
      {isVncConnecting && !vncError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-blue-500/50 bg-blue-500/10">
          <div className="text-center">
            <div className="mb-2 text-sm font-semibold text-blue-200">Connecting to VNC...</div>
            <div className="text-xs text-blue-300">Establishing websockify connection</div>
          </div>
        </div>
      )}
      
      {VncComponent && wsUrl && !vncError && (
        <VncComponent
          rfbOptions={{
            secure: false,
            shared: true,
            wsProtocols: ["binary"],
          }}
          onDisconnect={() => {
            setVncError("VNC connection lost - please retry");
          }}
          onError={(error: any) => {
            setVncError(`VNC Error: ${error?.message || 'Unknown VNC error'}`);
          }}
          key={viewOnly ? "view-only" : "interactive"}
          url={wsUrl}
          scaleViewport
          viewOnly={viewOnly}
          style={{ width: "100%", height: "100%" }}
        />
      )}
      
      {!VncComponent && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-400">
            <div className="mb-2 text-sm">Loading VNC Viewer...</div>
          </div>
        </div>
      )}
    </div>
  );
}
