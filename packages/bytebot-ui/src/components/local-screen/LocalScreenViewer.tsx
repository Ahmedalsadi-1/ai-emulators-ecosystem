"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ViewerStatus = "idle" | "connecting" | "connected" | "error";

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

export function LocalScreenViewer() {
  const [status, setStatus] = useState<ViewerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
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
      return;
    }

    let cancelled = false;

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(15000, 1000 * 2 ** reconnectAttempts.current);
      reconnectAttempts.current += 1;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
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

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        setStatus("connected");
      };

      socket.onerror = () => {
        if (activeUrlIndex < wsUrls.length - 1) {
          setActiveUrlIndex((prev) => prev + 1);
          return;
        }
        setStatus("error");
        setErrorMessage("WebSocket error. Check OS AI backend.");
      };

      socket.onclose = () => {
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

  if (!hasWsUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-[#9a9a9a]">
        Set <span className="mx-1 rounded bg-[#1a1b1d] px-2 py-1 text-[#d0d0d0]">NEXT_PUBLIC_OS_AI_WS_URL</span>
        to <span className="mx-1 rounded bg-[#1a1b1d] px-2 py-1 text-[#d0d0d0]">ws://127.0.0.1:8765/ws?token=secret</span>
        to stream the local screen from OS AI.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a9a9a]">
        <span>{status === "connected" ? "Connected" : "Offline"}</span>
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
        {errorMessage && (
          <span className="rounded-md border border-[#3b2a2a] bg-[#1a1414] px-2 py-1 text-[#d5bcbc]">
            {errorMessage}
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
            Waiting for screenshots from OS AI backend.
          </div>
        )}
      </div>
    </div>
  );
}
