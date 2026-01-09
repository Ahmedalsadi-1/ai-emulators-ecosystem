"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { VncViewer } from "@/components/vnc/VncViewer";
import { GboxAndroidView } from "@/components/gbox/GboxAndroidView";
import { useQuickTaskSession } from "@/hooks/useQuickTaskSession";
import { fetchModels } from "@/utils/taskUtils";
import type { Model } from "@/types";
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

/**
 * BrowserOS Control Endpoint Configuration
 * =========================================
 *
 * This page provides a VNC-based BrowserOS interface. The control endpoint
 * can be configured via environment variable or will use a placeholder.
 *
 * ENVIRONMENT VARIABLE CONFIGURATION:
 * -----------------------------------
 * Set the following in your environment or .env file:
 *
 *   NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL=ws://localhost:9994/websockify
 *
 * PLACEHOLDER BEHAVIOR:
 * ---------------------
 * - When NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL is not set, the system
 *   falls back to the default websockify proxy at /api/proxy/browseros-websockify
 * - The placeholder string "BROWSEROS_ENDPOINT_PLACEHOLDER" is used for
 *   identification and debugging purposes only
 *
 * CONSTANT DEFINITION:
 * --------------------
 * BROWSEROS_CONTROL_ENDPOINT: The WebSocket URL for BrowserOS control
 *   - Environment: process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL
 *   - Fallback: "BROWSEROS_ENDPOINT_PLACEHOLDER"
 *
 * @example
 * # .env file
 * NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL=ws://192.168.1.100:9994/websockify
 *
 * ENDPOINT REQUIREMENTS:
 * ----------------------
 * The BrowserOS control endpoint should:
 * - Accept WebSocket connections at the configured path
 * - Proxy VNC traffic between the browser and the BrowserOS desktop
 * - Support the websockify protocol for VNC transmission
 * - Return appropriate connection status/errors for debugging
 *
 * PROXY PATH CONFIGURATION:
 * -------------------------
 * The VNC viewer uses one of the following proxy paths:
 * - /api/proxy/browseros-websockify (default, for BrowserOS)
 * - /api/proxy/kali-websockify (for Kali Linux desktop)
 *
 * Set NEXT_PUBLIC_BROWSEROS_WEBSOCKIFY_PATH env var to override.
 */
const BROWSEROS_CONTROL_ENDPOINT =
  process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL ||
  process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT ||
  "BROWSEROS_ENDPOINT_PLACEHOLDER";

// Default proxy path for BrowserOS VNC connection
// Can be overridden via NEXT_PUBLIC_BROWSEROS_WEBSOCKIFY_PATH environment variable
const BROWSEROS_WEBSOCKIFY_PATH =
  process.env.NEXT_PUBLIC_BROWSEROS_WEBSOCKIFY_PATH ||
  "/api/proxy/browseros-websockify";
const BROWSEROS_NOVNC_URL =
  process.env.NEXT_PUBLIC_BROWSEROS_NOVNC_URL ||
  "http://localhost:9994/vnc.html?autoconnect=1&resize=scale&reconnect=1";

// FACTIF-AI Browser Control Endpoint Configuration
const FACTIFAI_CONTROL_ENDPOINT =
  process.env.NEXT_PUBLIC_FACTIFAI_VNC_URL ||
  "ws://localhost:6082/websockify"; // From docker-compose.ecosystem.yml

const FACTIFAI_WEBSOCKIFY_PATH =
  process.env.NEXT_PUBLIC_FACTIFAI_WEBSOCKIFY_PATH ||
  "/api/proxy/factifai-websockify";

const FACTIFAI_NOVNC_URL =
  process.env.NEXT_PUBLIC_FACTIFAI_NOVNC_URL ||
  "http://localhost:6082/vnc.html?autoconnect=1&resize=scale&reconnect=1";

const GBOX_ANDROID_URL =
  process.env.NEXT_PUBLIC_GBOX_ANDROID_URL ||
  process.env.NEXT_PUBLIC_ANDROID_WEB_URL ||
  "http://localhost:6080";

const ACTIVE_BROWSER_AGENT =
  (process.env.NEXT_PUBLIC_ACTIVE_BROWSER_AGENT as
    | "browseros"
    | "factif-ai"
    | "gbox-android") || "browseros";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
type BrowserDisplayMode = "vnc" | "novnc";

type BrowserAgentId = "browseros" | "factif-ai" | "gbox-android";

type BrowserAgentOption = {
  id: BrowserAgentId;
  label: string;
  description: string;
  mode: "vnc" | "android";
};

const BROWSER_AGENT_OPTIONS: BrowserAgentOption[] = [
  {
    id: "browseros",
    label: "BrowserOS",
    description: "Default BrowserOS controller",
    mode: "vnc",
  },
  {
    id: "factif-ai",
    label: "Factif-AI",
    description: "Factif AI browser desktop",
    mode: "vnc",
  },
  {
    id: "gbox-android",
    label: "GBox Android",
    description: "GBox Android live view",
    mode: "android",
  },
];

const pickRoutewayDefault = (candidates: Model[]): Model | null =>
  candidates.find((model) => model.provider === "routeway" && model.capabilities?.toolCalling) ||
  candidates[0] ||
  null;

// VNC Environment Warning Component
function VncEnvWarning({ agentId }: { agentId: BrowserAgentId }) {
  const [dismissed, setDismissed] = useState(false);

  // Check for missing env vars (only check once on mount)
  useEffect(() => {
    const missing: string[] = [];

    if (agentId === "browseros") {
      if (
        !process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL &&
        !process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT
      ) {
        missing.push("BROWSEROS_DESKTOP_VNC_URL (BrowserOS VNC)");
      }
    } else if (agentId === "factif-ai") {
      if (!process.env.NEXT_PUBLIC_FACTIFAI_VNC_URL) {
        missing.push("NEXT_PUBLIC_FACTIFAI_VNC_URL (Factif-AI VNC)");
      }
    } else if (agentId === "gbox-android") {
      if (!process.env.NEXT_PUBLIC_GBOX_ANDROID_URL) {
        missing.push("NEXT_PUBLIC_GBOX_ANDROID_URL (GBox Android)");
      }
    }

    if (missing.length > 0) {
      console.warn("[VNC] Missing environment variables:", missing);
    }
  }, [agentId]);

  if (dismissed) return null;

  const showWarning =
    agentId === "browseros"
      ? !process.env.NEXT_PUBLIC_BROWSEROS_DESKTOP_VNC_URL &&
        !process.env.NEXT_PUBLIC_BROWSEROS_CONTROL_ENDPOINT
      : agentId === "factif-ai"
        ? !process.env.NEXT_PUBLIC_FACTIFAI_VNC_URL
        : !process.env.NEXT_PUBLIC_GBOX_ANDROID_URL;

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-200">
            VNC Configuration Needed
          </h4>
          <p className="mt-1 text-xs text-amber-300/80">
            To enable {agentId === "browseros" ? "BrowserOS" : agentId === "factif-ai" ? "Factif-AI" : "GBox Android"} control, set:
          </p>
          <div className="mt-2 space-y-1">
            <code className="block rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
              {agentId === "browseros"
                ? "BROWSEROS_DESKTOP_VNC_URL=ws://localhost:9994/websockify"
                : agentId === "factif-ai"
                  ? "NEXT_PUBLIC_FACTIFAI_VNC_URL=ws://localhost:6082/websockify"
                  : "NEXT_PUBLIC_GBOX_ANDROID_URL=http://localhost:6080"}
            </code>
            <p className="text-xs text-amber-400/60">
              Start the {agentId === "browseros" ? "BrowserOS" : agentId === "factif-ai" ? "Factif-AI" : "GBox Android"} service and restart the UI server.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-200"
          aria-label="Dismiss warning"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function WebPage() {
  const [selectedAgent, setSelectedAgent] = useState<BrowserAgentId>(
    ACTIVE_BROWSER_AGENT,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    "connecting",
  );
  const [retryKey, setRetryKey] = useState(0);
  const [useNoVncFallback, setUseNoVncFallback] = useState(false);
  const [displayMode, setDisplayMode] = useState<BrowserDisplayMode>("vnc");
  const [showConsole, setShowConsole] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);
  const [command, setCommand] = useState("");
  const [showLocalOnly, setShowLocalOnly] = useState(false);

  const localProviders = useMemo(
    () => new Set(["ollama-local", "opencode-local", "lm-studio"]),
    [],
  );

  const storageKey = useMemo(
    () => `bytebot:webTask:${selectedAgent}`,
    [selectedAgent],
  );

  const {
    messages,
    isLoading,
    currentTaskId,
    sendMessage,
    addLog,
  } = useQuickTaskSession({ storageKey });

  const activeAgent = useMemo(
    () =>
      BROWSER_AGENT_OPTIONS.find((option) => option.id === selectedAgent) ||
      BROWSER_AGENT_OPTIONS[0],
    [selectedAgent],
  );

  const browserAgentName = activeAgent.label;

  const controlEndpoint =
    selectedAgent === "browseros"
      ? BROWSEROS_CONTROL_ENDPOINT
      : selectedAgent === "factif-ai"
        ? FACTIFAI_CONTROL_ENDPOINT
        : GBOX_ANDROID_URL;

  const websockifyPath =
    selectedAgent === "browseros"
      ? BROWSEROS_WEBSOCKIFY_PATH
      : FACTIFAI_WEBSOCKIFY_PATH;

  const noVncUrl =
    selectedAgent === "browseros" ? BROWSEROS_NOVNC_URL : FACTIFAI_NOVNC_URL;

  const sessionId =
    selectedAgent === "gbox-android" ? "gbox-android" : selectedAgent;

  useEffect(() => {
    const storedAgent = localStorage.getItem("bytebot:web:agent") as
      | BrowserAgentId
      | null;
    if (storedAgent && storedAgent !== selectedAgent) {
      setSelectedAgent(storedAgent);
    }
  }, [selectedAgent]);

  useEffect(() => {
    localStorage.setItem("bytebot:web:agent", selectedAgent);
    setConnectionStatus("connecting");
    setUseNoVncFallback(false);
    setDisplayMode("vnc");
    setRetryKey((prev) => prev + 1);
  }, [selectedAgent]);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        const result = await fetchModels({ toolCalling: true });
        if (!isMounted) return;

        const allowedProviders = new Set([
          "routeway",
          "groq",
          "openai",
          "proxy",
          "google",
          "ollama-local",
          "opencode-local",
          "lm-studio",
        ]);
        const filteredModels = result.filter(
          (model) =>
            model.capabilities?.toolCalling &&
            allowedProviders.has(model.provider),
        );
        setModels(filteredModels);
        setSelectedModel((prev) => prev || pickRoutewayDefault(filteredModels));
        setModelFetchError(null);
      } catch (error) {
        if (!isMounted) return;
        const errorMessage = error instanceof Error ? error.message : String(error);
        setModelFetchError(errorMessage);
        addLog(`Failed to fetch models: ${errorMessage}`);
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, [addLog]);

  const displayModels = useMemo(
    () =>
      showLocalOnly
        ? models.filter((model) => localProviders.has(model.provider))
        : models,
    [localProviders, models, showLocalOnly],
  );

  useEffect(() => {
    if (!displayModels.length) return;
    if (!selectedModel || !displayModels.includes(selectedModel)) {
      setSelectedModel(displayModels[0]);
    }
  }, [displayModels, selectedModel]);

  const handleRefresh = useCallback(() => {
    setConnectionStatus("connecting");
    setUseNoVncFallback(false);
    setDisplayMode("vnc");
    setRetryKey((prev) => prev + 1);
  }, []);

  const handleConnectionStatus = useCallback(
    (status: "connecting" | "connected" | "disconnected" | "error") => {
      setConnectionStatus(status);
      if (status === "error") {
        setUseNoVncFallback(true);
        setDisplayMode("novnc");
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedAgent === "gbox-android") return;
    if (displayMode !== "vnc") return;
    if (connectionStatus === "connected") return;
    const timeout = window.setTimeout(() => {
      setUseNoVncFallback(true);
      setDisplayMode("novnc");
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [connectionStatus, displayMode, selectedAgent]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => {
      const next = prev === "vnc" ? "novnc" : "vnc";
      if (next === "vnc") {
        setUseNoVncFallback(false);
      }
      return next;
    });
  }, []);

  const handleSend = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!command.trim() || !selectedModel) return;
      const nextMessage = command.trim();
      setCommand("");
      const sessionPrefix = sessionId
        ? `Use session_id=\"${sessionId}\" for all computer tools in this task.\n`
        : "";
      const messageToSend = currentTaskId
        ? nextMessage
        : `${sessionPrefix}${nextMessage}`;
      await sendMessage(messageToSend, selectedModel);
    },
    [command, selectedModel, sessionId, currentTaskId, sendMessage],
  );

  const shouldUseNoVnc = displayMode === "novnc" || useNoVncFallback;
  const supportsVnc = activeAgent.mode === "vnc";
  const consoleVisible = showConsole || selectedAgent === "gbox-android";

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0b0b0e] text-[#e6e6e6]"
      data-browseros-endpoint={controlEndpoint}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_top,_rgba(84,110,255,0.18),_transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_bottom,_rgba(18,18,18,0.9),_transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.04),_transparent_50%)] opacity-60" />

      <VncEnvWarning agentId={selectedAgent} />

      <main className="relative z-10 flex min-h-screen w-full flex-col px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141417]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f2f2f2]">
              {browserAgentName}
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  selectedAgent === "gbox-android"
                    ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.55)]"
                    : connectionStatus === "connected"
                      ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                      : connectionStatus === "connecting"
                        ? "bg-yellow-400 animate-pulse"
                        : connectionStatus === "error"
                          ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                          : "bg-gray-400"
                }`}
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bdbdbd]">
                {selectedAgent === "gbox-android"
                  ? "Android"
                  : connectionStatus === "connected"
                    ? "Live"
                    : connectionStatus === "connecting"
                      ? "Connecting"
                      : connectionStatus === "error"
                        ? "Error"
                        : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-white/10 bg-black/30 p-1 text-[9px] uppercase tracking-[0.24em] text-[#bdbdbd]">
              {BROWSER_AGENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedAgent(option.id)}
                  className={`rounded-full px-3 py-1.5 transition-all ${
                    selectedAgent === option.id
                      ? "bg-white/10 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]"
                      : "hover:bg-white/5"
                  }`}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {supportsVnc && (
              <button
                type="button"
                onClick={toggleDisplayMode}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
                title={
                  displayMode === "vnc"
                    ? `Switch to noVNC for ${browserAgentName}`
                    : `Switch to VNC for ${browserAgentName}`
                }
              >
                {displayMode === "vnc" ? "Use noVNC" : "Use VNC"}
              </button>
            )}

            {selectedAgent === "gbox-android" && (
              <button
                type="button"
                onClick={() => window.open(GBOX_ANDROID_URL, "_blank", "noopener,noreferrer")}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
                title="Open GBox Android in a new window"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Popout
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
              title="Refresh connection"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>

            <button
              type="button"
              onClick={() => setShowConsole((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
              title={consoleVisible ? "Hide console" : "Show console"}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Console
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-[#222327] hover:text-[#e6e6e6]"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`overflow-hidden rounded-2xl border border-white/10 bg-[#141417]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_40px_90px_rgba(0,0,0,0.65)] ${
            consoleVisible ? "flex-1" : "flex-1"
          }`}
        >
          <div className="h-full w-full">
            {selectedAgent === "gbox-android" ? (
              <GboxAndroidView className="h-full w-full" />
            ) : shouldUseNoVnc ? (
              <iframe
                key={`novnc-${retryKey}`}
                src={noVncUrl}
                className="h-full w-full"
                title={`${browserAgentName} noVNC`}
              />
            ) : (
              <VncViewer
                key={`${retryKey}-${displayMode}`}
                viewOnly={false}
                controllerType={selectedAgent === "browseros" ? "browseros" : undefined}
                proxyPath={websockifyPath}
                directUrl={selectedAgent === "factif-ai" ? controlEndpoint : undefined}
                onStatusChange={handleConnectionStatus}
              />
            )}
          </div>
        </motion.div>

        {consoleVisible && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4 rounded-2xl border border-white/10 bg-[#101013]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_18px_40px_rgba(0,0,0,0.45)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 text-[10px] uppercase tracking-[0.2em] text-[#8f8f90]">
              <span>Command Console</span>
              <div className="flex items-center gap-2 text-[9px] text-[#636366]">
                <span className="font-mono">session_id={sessionId}</span>
                {modelFetchError && (
                  <span className="text-amber-300">Models unavailable</span>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-[#7c7c80]">
                    Model
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLocalOnly((prev) => !prev)}
                    className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
                      showLocalOnly
                        ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-black/40 text-[#7c7c80]"
                    }`}
                  >
                    {showLocalOnly ? "Local" : "All"}
                  </button>
                </div>
                <select
                  value={selectedModel ? `${selectedModel.provider}:${selectedModel.name}` : ""}
                  onChange={(event) => {
                    const key = event.target.value;
                    const match = displayModels.find(
                      (model) => `${model.provider}:${model.name}` === key,
                    );
                    if (match) {
                      setSelectedModel(match);
                    }
                  }}
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white focus:outline-none"
                >
                  <option value="" disabled>
                    Select model
                  </option>
                  {displayModels.map((model) => (
                    <option
                      key={`${model.provider}:${model.name}`}
                      value={`${model.provider}:${model.name}`}
                    >
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleSend} className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-[#7c7c80]">
                  Task Prompt
                </label>
                <textarea
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  placeholder={
                    selectedAgent === "gbox-android"
                      ? "Describe the Android action you want GBox to take..."
                      : "Describe the browser automation you want..."
                  }
                  className="min-h-[96px] w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white placeholder:text-[#555] focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-[#666]">
                    {selectedAgent === "gbox-android"
                      ? "Chat is anchored to the Android controller."
                      : "Commands route to the active browser controller."}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !selectedModel}
                    className="rounded-md border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>

            {messages.length > 0 && (
              <div className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/5 bg-black/30 p-3 text-[11px]">
                {[...messages].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-md border px-3 py-2 ${
                      entry.role === "USER"
                        ? "border-white/10 bg-white/5 text-white"
                        : "border-white/5 bg-black/40 text-[#b8b8b8]"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-[#666]">
                      <span>{entry.role === "USER" ? "User" : "Agent"}</span>
                      <span>{entry.time}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-3 flex items-center justify-between px-1"
        >
          <div className="flex items-center gap-2 text-[9px] text-[#666]">
            <span className="font-mono">{controlEndpoint}</span>
            <span className="text-white/20">|</span>
            <span>
              {selectedAgent === "gbox-android"
                ? "Android live surface"
                : shouldUseNoVnc
                  ? "noVNC fallback"
                  : "VNC Interactive Mode"}
            </span>
          </div>
          <div className="text-[9px] text-[#555]">
            {browserAgentName} Control Surface
          </div>
        </motion.div>
      </main>
    </div>
  );
}
