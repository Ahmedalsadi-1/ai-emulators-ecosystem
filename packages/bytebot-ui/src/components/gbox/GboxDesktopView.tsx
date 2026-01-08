"use client";

import React, { useState, useEffect, useCallback } from "react";

type GboxControllerType = "gbox";

interface GboxDesktopViewProps {
  viewOnly?: boolean;
  controllerType?: GboxControllerType;
  directUrl?: string;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

const DEFAULT_GBOX_VNC_URL = process.env.NEXT_PUBLIC_GBOX_DESKTOP_VNC_URL || "ws://localhost:5990";
const DEFAULT_GBOX_NOVNC_URL = process.env.NEXT_PUBLIC_GBOX_DESKTOP_NOVNC_URL || "http://localhost:6080";

export function GboxDesktopView({
  viewOnly = true,
  controllerType = "gbox",
  directUrl,
  onStatusChange,
}: GboxDesktopViewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [novncUrl, setNovncUrl] = useState<string | null>(null);

  const resolveNovncUrl = useCallback((): string | null => {
    if (directUrl) {
      return directUrl.replace("ws://", "http://").replace("wss://", "https://");
    }
    return DEFAULT_GBOX_NOVNC_URL;
  }, [directUrl]);

  useEffect(() => {
    const url = resolveNovncUrl();
    if (url) {
      setNovncUrl(url);
      onStatusChange?.('connecting');
    }
  }, [resolveNovncUrl, onStatusChange]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
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
    const url = resolveNovncUrl();
    if (url) {
      setNovncUrl(null);
      setTimeout(() => setNovncUrl(url), 100);
    }
    onStatusChange?.('connecting');
  }, [resolveNovncUrl, onStatusChange]);

  return (
    <div className="relative h-full w-full bg-black">
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-md border border-red-500/50 bg-red-500/10 p-8">
          <div className="text-center">
            <div className="mb-2 text-sm font-semibold text-red-200">GBox Desktop Connection Error</div>
            <div className="text-xs text-red-300">
              Could not connect to GBox desktop viewer. Make sure GBox Docker containers are running.
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <button
              onClick={retryConnection}
              className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-2 text-red-200 transition-all hover:bg-red-400/20"
            >
              Retry Connection
            </button>
            <a
              href={novncUrl || DEFAULT_GBOX_NOVNC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-gray-300 transition-all hover:bg-white/10"
            >
              Open Directly
            </a>
          </div>
        </div>
      )}

      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
            <div className="text-sm text-gray-400">Connecting to GBox Desktop...</div>
            <div className="mt-2 text-xs text-gray-500">{novncUrl || DEFAULT_GBOX_NOVNC_URL}</div>
          </div>
        </div>
      )}

      {novncUrl && (
        <iframe
          src={novncUrl}
          title="GBox Desktop Viewer"
          className="h-full w-full border-0"
          allow="clipboard-read; clipboard-write; display-capture"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}

      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2">
        <span className="rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[10px] text-gray-400 backdrop-blur-sm">
          GBox Desktop
        </span>
      </div>
    </div>
  );
}
