"use client";

import React, { useRef, useEffect, useState } from "react";

interface VncViewerProps {
  viewOnly?: boolean;
  controllerType?: 'bytebot' | 'debian' | 'kali' | 'browseros';
  proxyPath?: string;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

// Map controller type to proxy path
const getProxyPathForController = (controllerType?: string): string => {
  switch (controllerType) {
    case 'debian':
      return '/api/proxy/debian-websockify';
    case 'kali':
      return '/api/proxy/kali-websockify';
    case 'browseros':
      return '/api/proxy/browseros-websockify';
    case 'bytebot':
    default:
      return '/api/proxy/websockify';
  }
};

// Get VNC password based on controller type
const getVncPassword = (controllerType?: string): string | undefined => {
  switch (controllerType) {
    case 'debian':
      return process.env.NEXT_PUBLIC_DEBIAN_VNC_PASSWORD || process.env.NEXT_PUBLIC_BYTEBOT_VNC_PASSWORD;
    case 'kali':
      return process.env.NEXT_PUBLIC_KALI_VNC_PASSWORD;
    case 'browseros':
      return process.env.NEXT_PUBLIC_BROWSEROS_VNC_PASSWORD || process.env.NEXT_PUBLIC_BYTEBOT_VNC_PASSWORD;
    case 'bytebot':
    default:
      return process.env.NEXT_PUBLIC_BYTEBOT_VNC_PASSWORD;
  }
};

// Build RFB credentials object
const getRfbCredentials = (controllerType?: string) => {
  const password = getVncPassword(controllerType);
  if (!password) return undefined;
  return {
    username: '',
    password: password,
  };
};

export function VncViewer({
  viewOnly = true,
  controllerType,
  proxyPath = getProxyPathForController(controllerType),
  onStatusChange
}: VncViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [VncComponent, setVncComponent] = useState<any>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [vncError, setVncError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import the VncScreen component only on the client side
    import("react-vnc").then(({ VncScreen }) => {
      setVncComponent(() => VncScreen);
    });
  }, []);

  // Set wsUrl and notify connecting
  useEffect(() => {
    if (typeof window === "undefined") return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}${proxyPath}`;
    setWsUrl(url);
    onStatusChange?.('connecting');
  }, [proxyPath, onStatusChange]);

  const retryConnection = () => {
    setVncError(null);
    if (typeof window === "undefined") return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}${proxyPath}`;
    setWsUrl(url);
    onStatusChange?.('connecting');
  };

  // Get credentials for this controller type
  const credentials = getRfbCredentials(controllerType);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {vncError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-red-500/50 bg-red-500/10 p-4">
          <div className="text-center">
            <div className="mb-2 text-sm font-semibold text-red-200">VNC Connection Error</div>
            <div className="text-xs text-red-300">{vncError}</div>
            <button
              onClick={retryConnection}
              className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-200 transition-all hover:bg-red-400/20"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
      
      {VncComponent && wsUrl && !vncError && (
        <VncComponent
          rfbOptions={{
            secure: false,
            shared: true,
            wsProtocols: ["binary"],
            credentials: credentials,
          }}
          onDisconnect={() => {
            // Only notify, don't set error (disconnects are normal during reconnection)
            onStatusChange?.('disconnected');
          }}
          onError={(error: any) => {
            console.error('VNC Error:', error);
            onStatusChange?.('error');
          }}
          key={`${controllerType}-${viewOnly ? 'view' : 'interactive'}`}
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
