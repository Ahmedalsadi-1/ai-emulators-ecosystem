"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

type AndroidControllerType = "android" | "gbox-android";

interface AndroidViewerProps {
  viewOnly?: boolean;
  controllerType?: AndroidControllerType;
  directUrl?: string;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

const DEFAULT_ANDROID_VNC_URL = process.env.NEXT_PUBLIC_ANDROID_DESKTOP_VNC_URL || "http://localhost:6083/android-vnc.html";
const DEFAULT_ANDROID_WS_URL = process.env.NEXT_PUBLIC_ANDROID_WS_URL || "ws://localhost:8767/ws";
const SCREENCAST_URL = process.env.NEXT_PUBLIC_ANDROID_SCREENCAST_URL || "ws://localhost:8766";

export function AndroidViewer({
  viewOnly = true,
  controllerType = "android",
  directUrl,
  onStatusChange,
}: AndroidViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("disconnected");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const resolveUrl = useCallback((): string | null => {
    if (directUrl) return directUrl;
    return DEFAULT_ANDROID_VNC_URL;
  }, [directUrl]);

  // Connect to WebSocket for screenshots
  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      
      setStatus("connecting");
      onStatusChange?.('connecting');

      try {
        wsRef.current = new WebSocket(SCREENCAST_URL);

        wsRef.current.onopen = () => {
          if (cancelled) return;
          setStatus("connected");
          onStatusChange?.('connected');
          setIsLoading(false);
          setHasError(false);
        };

        wsRef.current.onmessage = (event) => {
          if (cancelled) return;
          
          try {
            const data = JSON.parse(event.data);
            if (data.image) {
              setScreenshot(`data:image/jpeg;base64,${data.image}`);
              setLastUpdated(new Date().toLocaleTimeString());
              setIsLoading(false);
            }
          } catch (e) {
            // Not JSON, might be raw frame data
            if (typeof event.data === 'string' && event.data.startsWith('data:image')) {
              setScreenshot(event.data);
              setLastUpdated(new Date().toLocaleTimeString());
              setIsLoading(false);
            }
          }
        };

        wsRef.current.onerror = () => {
          if (cancelled) return;
          setStatus("error");
          onStatusChange?.('error');
        };

        wsRef.current.onclose = () => {
          if (cancelled) return;
          setStatus("disconnected");
          onStatusChange?.('disconnected');
          
          // Reconnect after delay
          reconnectTimerRef.current = window.setTimeout(connect, 3000);
        };
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        onStatusChange?.('error');
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [onStatusChange]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onStatusChange?.('connected');
  }, [onStatusChange]);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onStatusChange?.('error');
  }, [onStatusChange]);

  const retryConnection = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Force reconnection by updating state
    setStatus("connecting");
  }, []);

  const vncUrl = resolveUrl();

  return (
    <div className="relative h-full w-full bg-black">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-500 animate-pulse' : 
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {status === 'connected' ? 'Android Connected' : 
             status === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] text-gray-500">
              Last frame: {lastUpdated}
            </span>
          )}
          <button
            onClick={retryConnection}
            className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      </div>

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-md border border-red-500/50 bg-red-500/10 p-8">
          <div className="text-center">
            <div className="mb-2 text-sm font-semibold text-red-200">Android Connection Error</div>
            <div className="text-xs text-red-300">
              Could not connect to Android emulator. Make sure the Android emulator is running with VNC enabled.
            </div>
            <div className="mt-2 text-[10px] text-gray-500">
              Expected: {vncUrl || DEFAULT_ANDROID_VNC_URL}
            </div>
          </div>
          <button
            onClick={retryConnection}
            className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-2 text-red-200 transition-all hover:bg-red-400/20"
          >
            Retry Connection
          </button>
          <a
            href={vncUrl || DEFAULT_ANDROID_VNC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-gray-300 transition-all hover:bg-white/10"
          >
            Open Directly
          </a>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
            <div className="text-sm text-gray-400">Connecting to Android...</div>
            <div className="mt-2 text-xs text-gray-500">
              {vncUrl || DEFAULT_ANDROID_VNC_URL}
            </div>
          </div>
        </div>
      )}

      {/* Main content - iframe or screenshot */}
      {vncUrl && (
        <div className="h-full w-full pt-8">
          {screenshot ? (
            <div className="h-full w-full flex items-center justify-center">
              <img
                src={screenshot}
                alt="Android screen"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <iframe
              src={vncUrl}
              title="Android VNC Viewer"
              className="h-full w-full border-0"
              allow="clipboard-read; clipboard-write; display-capture"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>
      )}

      {/* Control buttons for interactive mode */}
      {!viewOnly && (
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2">
          <button className="rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[10px] text-gray-400 backdrop-blur-sm">
            Tap Mode
          </button>
          <button className="rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[10px] text-gray-400 backdrop-blur-sm">
            Swipe Mode
          </button>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2">
        <span className="rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[10px] text-gray-400 backdrop-blur-sm">
          Android (KRONOS)
        </span>
      </div>
    </div>
  );
}

export default AndroidViewer;
