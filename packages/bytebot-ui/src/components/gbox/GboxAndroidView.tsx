"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Smartphone,
  AlertCircle,
  Loader2,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";

type GboxAndroidViewProps = {
  className?: string;
};

const DEFAULT_GBOX_ANDROID_URL = "http://localhost:6080";

interface GBoxState {
  connected: boolean;
  loading: boolean;
  error: string | null;
  isFullscreen: boolean;
}

export function GboxAndroidView({ className }: GboxAndroidViewProps) {
  const [state, setState] = useState<GBoxState>({
    connected: false,
    loading: true,
    error: null,
    isFullscreen: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const gboxAndroidUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_GBOX_ANDROID_URL ||
      process.env.NEXT_PUBLIC_ANDROID_WEB_URL ||
      DEFAULT_GBOX_ANDROID_URL,
    [],
  );

  useEffect(() => {
    const checkGBoxHealth = async () => {
      try {
        const response = await fetch(`${gboxAndroidUrl}/health`, {
          mode: 'no-cors',
        });
        setState(prev => ({
          ...prev,
          connected: response.ok || response.status === 0,
          loading: false,
          error: response.ok ? null : 'GBox service health check failed',
        }));
      } catch (error) {
        console.error('GBox health check failed:', error);
        setState(prev => ({
          ...prev,
          connected: false,
          loading: false,
          error: 'Unable to connect to GBox service',
        }));
      }
    };

    // Initial check
    checkGBoxHealth();

    // Periodic health checks
    const interval = setInterval(checkGBoxHealth, 30000);
    return () => clearInterval(interval);
  }, [gboxAndroidUrl]);

  const handleIframeLoad = () => {
    setState(prev => ({
      ...prev,
      loading: false,
      connected: true,
      error: null,
    }));
  };

  const handleIframeError = () => {
    setState(prev => ({
      ...prev,
      loading: false,
      connected: false,
      error: 'Failed to load GBox Android interface',
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = gboxAndroidUrl;
      setState(prev => ({ ...prev, loading: true }));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-kronos-obsidian rounded-lg overflow-hidden flex flex-col border border-glass ${className ?? ""}`}
    >
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-kronos-glass backdrop-blur-glass border-b border-glass flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                state.connected
                  ? "bg-green-500 animate-pulse"
                  : state.error
                    ? "bg-red-500"
                    : "bg-yellow-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {state.loading
                ? "GBox Connecting..."
                : state.connected
                  ? "GBox Connected"
                  : "GBox Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-white/5 text-kronos-text-secondary hover:text-white hover:bg-white/10 transition-all"
            title="Refresh GBox view"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/5 text-kronos-text-secondary hover:text-white hover:bg-white/10 transition-all"
            title={state.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {state.isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 pt-10 pb-4 px-4 overflow-hidden">
        {state.error ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 text-sm font-medium">
                GBox Connection Failed
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {state.error}
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Make sure GBox is running on port 6080
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition-all"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : state.loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <p className="text-gray-400 text-sm">
                Loading GBox Android...
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Connecting to GBox service at {gboxAndroidUrl}
              </p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="GBox Android Live View"
            src={gboxAndroidUrl}
            className="w-full h-full border-0 rounded-lg"
            allow="camera; microphone; clipboard-read; clipboard-write; display-capture; fullscreen"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock allow-top-navigation allow-presentation"
          />
        )}
      </div>

      {/* Info footer */}
      {state.connected && !state.loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-black/40 border-t border-white/10 text-xs text-gray-500"
        >
          <span className="font-mono">{gboxAndroidUrl}</span>
        </motion.div>
      )}
    </div>
  );
}
