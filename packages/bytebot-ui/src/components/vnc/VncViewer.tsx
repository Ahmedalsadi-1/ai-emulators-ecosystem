"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

type ControllerType = "bytebot" | "debian" | "kali" | "browseros" | "bytebot-edge-1" | "bytebot-edge-2" | "bytebot-edge-3";

interface VncViewerProps {
  viewOnly?: boolean;
  controllerType?: ControllerType;
  proxyPath?: string;
  directUrl?: string;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

// Map controller type to proxy path
const getProxyPathForController = (controllerType?: ControllerType): string => {
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

const getDirectVncUrlForController = (controllerType?: ControllerType): string | undefined => {
  switch (controllerType) {
    case 'debian':
      return process.env.NEXT_PUBLIC_DEBIAN_DESKTOP_VNC_URL;
    case 'kali':
      return (
        process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_KALI_VNC_URL ||
        process.env.NEXT_PUBLIC_KALI_DESKTOP_VNC_URL
      );
    case 'browseros':
      return process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL;
    case 'bytebot':
    default:
      return process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_VNC_URL;
  }
};

const normalizeWsUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "http:") url.protocol = "ws:";
    if (url.protocol === "https:") url.protocol = "wss:";
    return url.toString();
  } catch {
    return rawUrl;
  }
};

// Get VNC password based on controller type
const getVncPassword = (controllerType?: ControllerType): string | undefined => {
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
const getRfbCredentials = (controllerType?: ControllerType) => {
  const password = getVncPassword(controllerType);
  if (!password) return undefined;
  return {
    username: '',
    password: password,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VncScreenComponent = React.ComponentType<any>;

export function VncViewer({
  viewOnly = true,
  controllerType,
  proxyPath = getProxyPathForController(controllerType),
  directUrl,
  onStatusChange
}: VncViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [VncComponent, setVncComponent] = useState<VncScreenComponent | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [vncError, setVncError] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(true);
  const [connectionKey, setConnectionKey] = useState(0);
  
  // Track if component is mounted to avoid state updates on unmounted components
  const isMountedRef = useRef(true);
  
  // Store the current VncScreen instance ref to properly disconnect
  const vncScreenRef = useRef<{ disconnect: () => void } | null>(null);
  const disconnectingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Disconnect VNC on unmount
      if (vncScreenRef.current && !disconnectingRef.current) {
        disconnectingRef.current = true;
        try {
          vncScreenRef.current.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
        vncScreenRef.current = null;
        disconnectingRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    // Dynamically import the VncScreen component only on the client side
    import("react-vnc").then(({ VncScreen }) => {
      if (isMountedRef.current) {
        setVncComponent(() => VncScreen);
      }
    });
  }, []);

  // Set wsUrl and notify connecting
  const resolveWsUrl = useCallback((): string | null => {
    if (directUrl) return normalizeWsUrl(directUrl);
    const envDirectUrl = getDirectVncUrlForController(controllerType);
    if (envDirectUrl) return normalizeWsUrl(envDirectUrl);
    if (typeof window === "undefined" || !proxyPath) return null;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}${proxyPath}`;
  }, [controllerType, proxyPath, directUrl]);

  // Reset connection when controller type or URL changes
  useEffect(() => {
    // Disconnect existing connection before creating a new one
    if (vncScreenRef.current && !disconnectingRef.current) {
      disconnectingRef.current = true;
      try {
        vncScreenRef.current.disconnect();
      } catch (e) {
        // Ignore cleanup errors
      }
      vncScreenRef.current = null;
      disconnectingRef.current = false;
    }
    
    const url = resolveWsUrl();
    if (!url) return;
    
    setWsUrl(url);
    setVncError(null);
    setShouldRender(true);
    // Increment connection key to force fresh RFB instance
    setConnectionKey(prev => prev + 1);
    onStatusChange?.('connecting');
  }, [controllerType, proxyPath, directUrl, onStatusChange, resolveWsUrl]);

  const retryConnection = useCallback(() => {
    // Disconnect existing connection before retrying
    if (vncScreenRef.current && !disconnectingRef.current) {
      disconnectingRef.current = true;
      try {
        vncScreenRef.current.disconnect();
      } catch (e) {
        // Ignore cleanup errors
      }
      vncScreenRef.current = null;
      disconnectingRef.current = false;
    }
    
    setVncError(null);
    setShouldRender(true);
    // Increment connection key to force fresh RFB instance
    setConnectionKey(prev => prev + 1);
    onStatusChange?.('connecting');
  }, [onStatusChange]);

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
      
      {VncComponent && wsUrl && !vncError && shouldRender && (
        <VncComponent
          ref={(el: { disconnect: () => void } | null) => {
            // Store the ref to the VncScreen instance for proper cleanup
            vncScreenRef.current = el;
          }}
          rfbOptions={{
            secure: false,
            shared: true,
            wsProtocols: ["binary"],
            credentials: credentials,
          }}
          onDisconnect={() => {
            if (!isMountedRef.current) return;
            setShouldRender(false);
            vncScreenRef.current = null;
            onStatusChange?.('disconnected');
          }}
          onError={(error: Error) => {
            if (!isMountedRef.current) return;
            setVncError(error.message || 'VNC connection error');
            setShouldRender(false);
            vncScreenRef.current = null;
            onStatusChange?.('error');
          }}
          // Use connectionKey in key to force fresh RFB instance on retry/switch
          key={`${controllerType}-${viewOnly ? 'view' : 'interactive'}-${connectionKey}`}
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
