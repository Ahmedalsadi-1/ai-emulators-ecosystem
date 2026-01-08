"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { VncViewer } from "@/components/vnc/VncViewer";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { LocalScreenViewer } from "@/components/local-screen/LocalScreenViewer";
import { TracePanel } from "@/components/trace/TracePanel";
import {
  fetchModels,
  ControllerStatus
} from "@/utils/taskUtils";
import { useQuickTaskSession } from "@/hooks/useQuickTaskSession";
import { useControllerKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMultiControllerState } from "@/hooks/useMultiControllerState";
import type { Model } from "@/types";
import type { ControllerOption } from "@/types/controller.types";
import {
  Globe,
  Keyboard,
  MessageSquarePlus,
  Send,
  Settings,
  Terminal,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { KronosLogo } from "@/components/branding/KronosLogo";

type DesktopSessionType = 'bytebot' | 'debian' | 'kali';

type DesktopSession = {
  id: string;
  name: string;
  type: DesktopSessionType;
  port: number | null;
  status: 'running' | 'exited' | 'unknown';
  wsUrl?: string;
};

type WorkspaceOption = {
  id: string;
  label: string;
  screen: 'bytebot' | 'debian' | 'kali' | 'custom';
  directUrl?: string;
  sessionId?: string;
  sessionPort?: number | null;
};

const WORKSPACE_STORAGE_VERSION = "2";
const WORKSPACE_STORAGE_VERSION_KEY = "bytebot:desktop:workspaceVersion";

const pickRoutewayDefault = (candidates: Model[]): Model | null =>
  candidates.find((model) => model.provider === "routeway" && model.capabilities?.toolCalling) ||
  candidates[0] ||
  null;

// VNC Environment Warning Component
function VncEnvWarning() {
  const [dismissed, setDismissed] = useState(false);

  // Check for missing env vars (only check once on mount)
  useEffect(() => {
    const missing: string[] = [];
    const hasBytebotVnc =
      !!process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_VNC_URL ||
      !!process.env.BYTEBOT_DESKTOP_VNC_URL;
    const hasDebianVnc =
      !!process.env.NEXT_PUBLIC_DEBIAN_DESKTOP_VNC_URL ||
      !!process.env.DEBIAN_DESKTOP_VNC_URL ||
      hasBytebotVnc;
    const hasKaliVnc =
      !!process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_KALI_VNC_URL ||
      !!process.env.BYTEBOT_DESKTOP_KALI_VNC_URL ||
      !!process.env.KALI_DESKTOP_VNC_URL;

    // Check Debian VNC
    if (!hasBytebotVnc) {
      missing.push('BYTEBOT_DESKTOP_VNC_URL (Debian/Bytebot VNC)');
    }

    // Check explicit Debian VNC (falls back to Bytebot if not set)
    if (!hasDebianVnc) {
      missing.push('DEBIAN_DESKTOP_VNC_URL (Desktop 2 Debian VNC)');
    }

    // Check Kali VNC
    if (!hasKaliVnc) {
      missing.push('BYTEBOT_DESKTOP_KALI_VNC_URL (Kali VNC)');
    }

    if (missing.length > 0) {
      console.warn('[VNC] Missing environment variables:', missing);
    }
  }, []);

  // Don't render if dismissed or in production with proper config
  if (dismissed) return null;

  // Only show warning if we're in dev mode or env vars are actually missing
  const showWarning =
    (!process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_VNC_URL &&
      !process.env.BYTEBOT_DESKTOP_VNC_URL) ||
    (!process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_KALI_VNC_URL &&
      !process.env.BYTEBOT_DESKTOP_KALI_VNC_URL &&
      !process.env.KALI_DESKTOP_VNC_URL);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-200">VNC Configuration Needed</h4>
          <p className="mt-1 text-xs text-amber-300/80">
            To enable desktop VNC viewing, set these environment variables:
          </p>
          <div className="mt-2 space-y-1">
            <code className="block rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
              BYTEBOT_DESKTOP_VNC_URL=ws://localhost:9990/websockify
            </code>
            <code className="block rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
              DEBIAN_DESKTOP_VNC_URL=ws://localhost:9995/websockify
            </code>
            <code className="block rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
              BYTEBOT_DESKTOP_KALI_VNC_URL=ws://localhost:9993/websockify
            </code>
          </div>
          <p className="mt-2 text-xs text-amber-400/60">
            Start the VNC containers and restart the UI server.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-200"
          aria-label="Dismiss warning"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const controllerOptions: ControllerOption[] = [
  { id: "bytebot", label: "Bytebot" },
  { id: "local-screen", label: "Local Screen" },
  { id: "browseros", label: "BrowserOS" },
  { id: "turix", label: "Turix" },
  { id: "factif-ai", label: "Factif-AI" },
  { id: "open-interface", label: "Open Interface" },
];

const defaultWorkspaces: WorkspaceOption[] = [
  { id: "desktop-1", label: "Desktop 1", screen: "bytebot" },
  { id: "desktop-2", label: "Desktop 2", screen: "debian" },
  { id: "desktop-3", label: "Desktop 3", screen: "kali" },
];

function ControlPill({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-sm border px-3 py-1 text-[8px] font-semibold tracking-[0.1em] transition-all ${
        active
          ? "border-[#4a4a4a] bg-[#2a2a2a] text-[#e0e0e0]"
          : "border-[#3a3a3a] bg-[#1a1a1a] text-[#888888] hover:bg-[#222222] hover:text-[#b0b0b0]"
      }`}
    >
      <span className="text-[#666666]">{icon}</span>
      {label}
    </button>
  );
}

function VncToolbar() {
  return (
    <div className="flex items-center justify-between px-2 h-7 border-b border-[#3a3a3a] bg-[#1e1e1e]">
      <span className="text-[8px] uppercase tracking-[0.1em] text-[#888888]">Live Desktop View</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="p-1 text-[#666666] hover:text-[#e0e0e0] transition-colors"
          title="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-[#666666] hover:text-[#e0e0e0] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-[#666666] hover:text-[#e0e0e0] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-[#666666] hover:text-[#e0e0e0] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-[#666666] hover:text-[#e0e0e0] transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function DesktopPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const getModelKey = (model: Model) => `${model.provider}:${model.name}`;
  const [modelFetchError, setModelFetchError] = useState<{url: string; message: string} | null>(null);
  const [command, setCommand] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>(
    defaultWorkspaces,
  );
  const [activeWorkspace, setActiveWorkspace] = useState<string>(
    defaultWorkspaces[0].id,
  );
  const [sessions, setSessions] = useState<DesktopSession[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [newSessionType, setNewSessionType] = useState<DesktopSessionType>('bytebot');
  const [controllerStatuses] = useState<Record<string, ControllerStatus>>({});
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [keyboardNavigationActive, setKeyboardNavigationActive] = useState(false);
  const [unavailableControllers, setUnavailableControllers] = useState<Record<string, { transient: boolean; message: string }>>({});
  const taskStorageKey = `bytebot:desktopTask:${activeWorkspace}`;
  const modelStorageKey = `bytebot:desktopModel:${activeWorkspace}`;
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL ||
    'http://localhost:9991';

  // Derive current screen from active workspace
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  const currentScreen = currentWorkspace?.screen || 'debian';
  const currentDirectUrl = currentWorkspace?.directUrl;
  const vncControllerType = currentScreen === 'custom' ? undefined : currentScreen;

  // Load workspaces and active workspace from localStorage
  useEffect(() => {
    const savedWorkspaces = localStorage.getItem('bytebot:desktop:workspaces');
    const savedActiveWorkspace = localStorage.getItem('bytebot:desktop:activeWorkspace');
    const storedVersion = localStorage.getItem(WORKSPACE_STORAGE_VERSION_KEY);

    if (storedVersion !== WORKSPACE_STORAGE_VERSION) {
      localStorage.removeItem('bytebot:desktop:workspaces');
      localStorage.removeItem('bytebot:desktop:activeWorkspace');
      localStorage.setItem(WORKSPACE_STORAGE_VERSION_KEY, WORKSPACE_STORAGE_VERSION);
      setWorkspaces(defaultWorkspaces);
      setActiveWorkspace(defaultWorkspaces[0].id);
      return;
    }

    if (savedWorkspaces) {
      try {
        const parsed = JSON.parse(savedWorkspaces);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorkspaces(parsed);
          setActiveWorkspace(savedActiveWorkspace && parsed.find((w: WorkspaceOption) => w.id === savedActiveWorkspace)
            ? savedActiveWorkspace
            : parsed[0].id);
        }
      } catch (error) {
        console.error('Failed to parse saved workspaces:', error);
      }
    }
  }, []);

  // Save workspaces and active workspace to localStorage
  useEffect(() => {
    localStorage.setItem('bytebot:desktop:workspaces', JSON.stringify(workspaces));
    localStorage.setItem('bytebot:desktop:activeWorkspace', activeWorkspace);
  }, [workspaces, activeWorkspace]);

  const addWorkspaceFromSession = useCallback((session: DesktopSession) => {
    if (!session.wsUrl) return;
    const workspaceId = `session-${session.id}`;
    setWorkspaces((prev) => {
      const exists = prev.find((w) => w.id === workspaceId);
      if (exists) return prev.map((w) => (w.id === workspaceId ? {
        ...w,
        label: session.name || `Session ${session.port ?? ''}`.trim(),
        screen: 'custom',
        directUrl: session.wsUrl,
        sessionId: session.id,
        sessionPort: session.port,
      } : w));
      return [
        ...prev,
        {
          id: workspaceId,
          label: session.name || `Session ${session.port ?? ''}`.trim(),
          screen: 'custom',
          directUrl: session.wsUrl,
          sessionId: session.id,
          sessionPort: session.port,
        },
      ];
    });
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setSessionError(null);
      const response = await fetch(`${apiBase}/desktop-sessions`);
      if (!response.ok) {
        throw new Error(`Failed to load sessions (${response.status})`);
      }
      const data = await response.json();
      setSessions(data);
      data.forEach((session: DesktopSession) => addWorkspaceFromSession(session));
    } catch (error: any) {
      setSessionError(error?.message || 'Failed to load sessions');
    }
  }, [apiBase, addWorkspaceFromSession]);

  const handleCreateSession = useCallback(async () => {
    try {
      setCreatingSession(true);
      setSessionError(null);
      const response = await fetch(`${apiBase}/desktop-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newSessionType }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create session (${response.status})`);
      }
      const session = await response.json();
      setSessions((prev) => [...prev, session]);
      addWorkspaceFromSession(session);
    } catch (error: any) {
      setSessionError(error?.message || 'Failed to create session');
    } finally {
      setCreatingSession(false);
    }
  }, [apiBase, newSessionType, addWorkspaceFromSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const {
    messages,
    isLoading,
    taskStatus,
    currentTaskId,
    sendMessage,
    clearMessages,
    addLog,
    resetSession,
    traceEntries,
    clearTrace,
  } = useQuickTaskSession({ storageKey: taskStorageKey });

  // Multi-controller state management
  const {
    controllers,
    activeControllerIds,
    primaryControllerId,
    toggleController,
    clearSelection,
    navigateControllers,
  } = useMultiControllerState(controllerOptions);

  // Keyboard shortcuts
  useControllerKeyboardShortcuts({
    onControllerToggle: (controllerId: string, multiSelect: boolean = false) => {
      toggleController(controllerId, multiSelect);
      const controller = controllerOptions.find(c => c.id === controllerId);
      if (controller) {
        addLog(`${multiSelect ? 'Toggled' : 'Switched to'} controller: ${controller.label}`);
      }
    },
    onClearSelection: () => {
      clearSelection();
      addLog('Controller selection cleared');
    },
    onNavigateControllers: (direction: 'next' | 'prev') => {
      navigateControllers(direction);
      const controller = controllerOptions.find(c => c.id === primaryControllerId);
      if (controller) {
        addLog(`Navigated to controller: ${controller.label}`);
      }
    },
    controllerIds: controllerOptions.map(c => c.id),
    onKeyboardNavigation: setKeyboardNavigationActive,
  });

  const handleModelChange = (modelKey: string) => {
    const match = models.find((model) => getModelKey(model) === modelKey);
    if (match) {
      setSelectedModel(match);
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!command.trim() || !selectedModel) return;
    const nextMessage = command.trim();
    setCommand("");
    const activeSession =
      workspaces.find((workspace) => workspace.id === activeWorkspace) || workspaces[0];
    const sessionId = activeSession?.sessionId || activeSession?.screen;
    const sessionPrefix = sessionId
      ? `Use session_id="${sessionId}" for all computer tools in this task.\n`
      : "";
    const messageToSend = currentTaskId ? nextMessage : `${sessionPrefix}${nextMessage}`;
    await sendMessage(messageToSend, selectedModel);
  };

  const handleToggleTerminal = () => {
    setShowTerminal((prev) => !prev);
  };

  const handleOpenWeb = () => {
    router.push("/web");
  };

  const handleNewChat = () => {
    resetSession();
    addLog("Started new chat session");
  };

  const handleControllerChange = async (controllerId: string, multiSelect: boolean = false) => {
    toggleController(controllerId, multiSelect);

    const label =
      controllerOptions.find((item) => item.id === controllerId)?.label ||
      controllerId;

    // Controllers that can be launched via /computer-use/launch
    const launchableControllers = ['turix', 'open-interface', 'browseros', 'aios', 'factif-ai'];

    // Check if this controller should be launched
    if (launchableControllers.includes(controllerId)) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('/api/proxy/desktop/computer-use/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application: controllerId }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check HTTP status code for proper error classification
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Ignore JSON parse errors
          }

          // Classify HTTP errors
          if (response.status === 500) {
            errorMessage = `bytebotd service error: ${errorMessage}`;
          } else if (response.status === 404) {
            errorMessage = `${label} endpoint not found`;
          } else if (response.status >= 400 && response.status < 500) {
            errorMessage = `Request failed: ${errorMessage}`;
          }

          addLog(`Failed to launch ${label}: ${errorMessage}`);
          // HTTP errors from service are typically transient
          setUnavailableControllers(prev => ({
            ...prev,
            [controllerId]: { transient: true, message: errorMessage },
          }));
          return;
        }

        const result = await response.json();

        if (result.success) {
          addLog(`Launched ${label} application`);
          // Clear unavailable state on successful launch
          setUnavailableControllers(prev => {
            const next = { ...prev };
            delete next[controllerId];
            return next;
          });
        } else {
          // Classify the error for actionable feedback
          const message = result.message || 'Unknown error';
          let errorMessage = `Failed to launch ${label}: ${message}`;
          let isPermanent = false;

          if (message.includes('not found') || message.includes('not installed')) {
            errorMessage = `${label} is not installed`;
            isPermanent = true;
          } else if (message.includes('ENOENT') || message.includes('command not found')) {
            errorMessage = `${label} application not found`;
            isPermanent = true;
          }

          addLog(errorMessage);

          // Mark controller as unavailable (permanent or transient based on error type)
          if (isPermanent) {
            setUnavailableControllers(prev => ({
              ...prev,
              [controllerId]: { transient: false, message: errorMessage },
            }));
          } else {
            // Transient failure - allow retry
            setUnavailableControllers(prev => ({
              ...prev,
              [controllerId]: { transient: true, message: errorMessage },
            }));
          }
        }
      } catch (error) {
        // Classify network/timeout errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userMessage = `Error launching ${label}: ${errorMessage}`;
        let isTransient = false;

        if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
          userMessage = `${label} launch timed out after 10s`;
          isTransient = true;
        } else if (
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('ERR_CONNECTION_REFUSED') ||
          errorMessage.includes('ERR_NAME_NOT_RESOLVED')
        ) {
          userMessage = `Network error - check connection to bytebotd service`;
          isTransient = true;
        }

        addLog(userMessage);

        // Mark controller as unavailable for transient failures
        if (isTransient) {
          setUnavailableControllers(prev => ({
            ...prev,
            [controllerId]: { transient: true, message: userMessage },
          }));
        } else {
          // For unknown errors, assume transient (could be temporary)
          setUnavailableControllers(prev => ({
            ...prev,
            [controllerId]: { transient: true, message: userMessage },
          }));
        }
      }
      return;
    }

    // For non-launchable controllers, just log the selection
    addLog(`${multiSelect ? 'Toggled' : 'Switched to'} controller: ${label}`);
  };

  const handleClearPanel = () => {
    clearMessages();
  };

  const activeControllerLabel = primaryControllerId
    ? controllerOptions.find((item) => item.id === primaryControllerId)?.label || "Multiple"
    : activeControllerIds.length > 0 ? "Multiple" : "None";
  const isLocalScreen = primaryControllerId === "local-screen";

  // Load models on component mount
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        const result = await fetchModels();
        if (!isMounted) return;

        const allowedProviders = new Set(["routeway", "groq", "openai", "proxy", "google"]);
        const filteredModels = result.filter(
          (model) =>
            model.capabilities?.toolCalling &&
            allowedProviders.has(model.provider),
        );
        setModels(filteredModels);
        setModelFetchError(null);
      } catch (error) {
        if (!isMounted) return;
        const errorMessage = error instanceof Error ? error.message : String(error);
        setModelFetchError({
          url: '/api/tasks/models',
          message: errorMessage,
        });
        addLog(`Failed to fetch models: ${errorMessage}`);
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (models.length === 0) return;
    const storedModel = window.localStorage.getItem(modelStorageKey);
    const stored =
      storedModel &&
      models.find(
        (model) =>
          getModelKey(model) === storedModel ||
          model.name === storedModel ||
          model.title === storedModel,
      );
    setSelectedModel(stored || pickRoutewayDefault(models) || null);
  }, [models, modelStorageKey]);

  // Save selected model to localStorage
  useEffect(() => {
    if (!selectedModel) return;
    window.localStorage.setItem(
      modelStorageKey,
      getModelKey(selectedModel),
    );
  }, [modelStorageKey, selectedModel?.name, selectedModel?.provider]);

  useEffect(() => {
    if (keyboardNavigationActive) {
      const timeout = setTimeout(() => setKeyboardNavigationActive(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [keyboardNavigationActive]);

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] text-[#e0e0e0]">
      <FloatingNav />
      <VncEnvWarning />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-7xl"
        >
          {/* Main Container - Matte Black with thin beveled borders */}
          <div className="rounded-sm border border-[#3a3a3a] bg-[#1a1a1a]">
            {/* Header Bar */}
            <div className="flex items-center justify-between gap-3 rounded-t-sm border-b border-[#3a3a3a] bg-[#1e1e1e] px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#e0e0e0]">
                  <KronosLogo size={48} className="h-6 w-auto" />
                  Kron-Desktop
                </div>
                {keyboardNavigationActive && (
                  <span className="rounded-sm border border-[#4a4a4a] bg-[#2a2a2a] px-2 py-0.5 text-[8px] text-[#b0b0b0]">
                    Keyboard Mode
                  </span>
                )}
                {activeControllerIds.length > 0 && (
                  <span className="rounded-sm border border-[#4a4a4a] bg-[#2a2a2a] px-2 py-0.5 text-[8px] text-[#b0b0b0]">
                    {activeControllerIds.length} active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1.5 text-[8px] tracking-[0.08em] text-[#b0b0b0]">
                  <span className="mr-2 text-[7px] uppercase tracking-[0.1em] text-[#666666]">
                    Model
                  </span>
                  {modelFetchError ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[8px] text-[#c9a227]">
                        Fetch failed
                      </span>
                      <span className="text-[7px] text-[#888888] max-w-[120px] truncate" title={modelFetchError.message}>
                        {modelFetchError.message}
                      </span>
                      <button
                        onClick={() => {
                          setModelFetchError(null);
                          fetchModels().then(result => {
                            setModels(result);
                            setModelFetchError(null);
                          }).catch(error => {
                            setModelFetchError({
                              url: '/api/tasks/models',
                              message: error instanceof Error ? error.message : String(error),
                            });
                          });
                        }}
                        className="text-[7px] text-[#888888] hover:text-[#b0b0b0] underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedModel ? getModelKey(selectedModel) : ""}
                      onChange={(event) => handleModelChange(event.target.value)}
                      className="bg-transparent text-[8px] font-medium tracking-[0.08em] text-[#b0b0b0] focus:outline-none"
                    >
                      {models.map((model) => (
                        <option key={getModelKey(model)} value={getModelKey(model)}>
                          {model.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {taskStatus && (
                  <span className="rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                    {taskStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
              {/* Left Column: Agent Feed + Controllers */}
              <div className="flex flex-col border-r border-[#3a3a3a]">
                {/* Agent Feed Panel */}
                <div className="border-b border-[#3a3a3a] bg-[#1e1e1e] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#888888]">Agent Feed</span>
                    <button
                      type="button"
                      onClick={handleClearPanel}
                      className="rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-0.5 text-[7px] font-medium tracking-[0.1em] text-[#666666] transition-all hover:bg-[#222222] hover:text-[#888888]"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="mt-3 h-[280px] space-y-2 overflow-auto pr-1">
                    {messages.length === 0 && (
                      <div className="text-[8px] text-[#555555]">No messages yet.</div>
                    )}

                    {messages.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1.5 text-[8px] text-[#b0b0b0]"
                      >
                        <div className="flex items-center justify-between text-[7px] uppercase tracking-[0.1em] text-[#666666]">
                          <span>
                            {entry.role === "USER" ? "You" : "Bytebot"}
                          </span>
                          <span>{entry.time}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-[8px] leading-snug text-[#b0b0b0]">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <TracePanel entries={traceEntries} onClear={clearTrace} />

                {/* Controllers Panel */}
                <div className="bg-[#1e1e1e] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#888888]">Controllers</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {controllerOptions.map((controller) => {
                      const controllerState = controllers.find(c => c.id === controller.id);
                      const isActive = controllerState?.isActive || false;
                      const isPrimary = primaryControllerId === controller.id;
                      const status = controllerStatuses[controller.id];

                      return (
                        <div key={controller.id} className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              const unavailable = unavailableControllers[controller.id];
                              if (unavailable?.transient) {
                                handleControllerChange(controller.id, e.ctrlKey || e.metaKey);
                              } else if (!unavailable) {
                                handleControllerChange(controller.id, e.ctrlKey || e.metaKey);
                              }
                            }}
                            title={`${controller.label} controller${isActive ? ' (active)' : ''}${isPrimary ? ' (primary)' : ''}${unavailableControllers[controller.id] ? ` - ${unavailableControllers[controller.id].message}` : ''} - Press Ctrl/Cmd+click for multi-selection`}
                            aria-label={`${controller.label} controller${isActive ? ' (active)' : ''}${isPrimary ? ' (primary)' : ''}${unavailableControllers[controller.id] ? ` - Unavailable: ${unavailableControllers[controller.id].message}` : ''} - Press Ctrl/Cmd+click for multi-selection`}
                            aria-pressed={isActive}
                            aria-disabled={!!unavailableControllers[controller.id] && !unavailableControllers[controller.id]?.transient}
                            disabled={!!unavailableControllers[controller.id] && !unavailableControllers[controller.id]?.transient}
                            className={`flex items-center gap-1 rounded-sm border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] transition-all focus:outline-none focus:ring-1 focus:ring-[#4a4a4a] ${
                              unavailableControllers[controller.id]
                                ? unavailableControllers[controller.id].transient
                                  ? "border-[#5a4a3a] bg-[#2a251a] text-[#c9a227] cursor-pointer hover:bg-[#352a1a]"
                                  : "border-[#4a3a3a] bg-[#251a1a] text-[#888888] cursor-not-allowed opacity-50"
                                : isPrimary
                                  ? "border-[#4a4a4a] bg-[#2a2a2a] text-[#e0e0e0]"
                                  : isActive
                                    ? "border-[#3a3a3a] bg-[#222222] text-[#b0b0b0]"
                                    : "border-[#3a3a3a] bg-[#1a1a1a] text-[#888888] hover:bg-[#222222] hover:text-[#b0b0b0]"
                            }`}
                          >
                            {status && (
                              <span
                                className={`inline-block w-1 h-1 rounded-full ${
                                  status.status === 'connected'
                                    ? 'bg-[#4ade80]'
                                    : status.status === 'disconnected' || status.status === 'error'
                                    ? 'bg-[#ef4444]'
                                    : 'bg-[#c9a227]'
                                }`}
                              />
                            )}
                            {controller.label}
                            {unavailableControllers[controller.id]?.transient && (
                              <span className="text-[6px] text-[#c9a227]">(retry)</span>
                            )}
                          </button>
                          {status && status.status !== 'connected' && (
                            <div className="absolute top-full mt-1 left-0 z-10">
                              <div className="bg-[#111] text-[#888] text-[7px] px-2 py-0.5 rounded-sm whitespace-nowrap max-w-32 truncate border border-[#3a3a3a]">
                                {status.message}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: VNC + Smart Prompt */}
              <div className="flex flex-col">
                {/* VNC Section with Toolbar */}
                <div className="border-b border-[#3a3a3a] bg-[#1a1a1a]">
                  <VncToolbar />

                  {/* Workspace Tabs */}
                  <div className="flex items-center gap-1 border-b border-[#3a3a3a] bg-[#1e1e1e] px-2 py-1.5">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => setActiveWorkspace(workspace.id)}
                        className={`rounded-sm border px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.1em] transition-all ${
                          activeWorkspace === workspace.id
                            ? "border-[#4a4a4a] bg-[#2a2a2a] text-[#e0e0e0]"
                            : "border-[#3a3a3a] bg-[#1a1a1a] text-[#888888] hover:bg-[#222222] hover:text-[#b0b0b0]"
                        }`}
                      >
                        {workspace.label}
                      </button>
                    ))}
                    <span className="ml-auto text-[7px] uppercase tracking-[0.1em] text-[#666666]">
                      {activeControllerLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-b border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1.5 text-[8px]">
                    <span className="text-[7px] uppercase tracking-[0.1em] text-[#666666]">
                      Sessions
                    </span>
                    <select
                      value={newSessionType}
                      onChange={(event) =>
                        setNewSessionType(event.target.value as DesktopSessionType)
                      }
                      className="rounded-sm border border-[#3a3a3a] bg-[#111111] px-2 py-1 text-[8px] text-[#c0c0c0]"
                    >
                      <option value="bytebot">Bytebot</option>
                      <option value="debian">Debian</option>
                      <option value="kali">Kali</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleCreateSession}
                      disabled={creatingSession}
                      className="rounded-sm border border-[#3a3a3a] bg-[#111111] px-2.5 py-1 text-[8px] uppercase tracking-[0.08em] text-[#c0c0c0] transition-all hover:bg-[#1d1d1d] disabled:opacity-50"
                    >
                      {creatingSession ? 'Creating…' : 'Create Desktop'}
                    </button>
                    <button
                      type="button"
                      onClick={loadSessions}
                      className="rounded-sm border border-[#3a3a3a] bg-[#111111] px-2.5 py-1 text-[8px] uppercase tracking-[0.08em] text-[#c0c0c0] transition-all hover:bg-[#1d1d1d]"
                    >
                      Refresh
                    </button>
                    {sessionError && (
                      <span className="text-[8px] text-[#ef4444]">{sessionError}</span>
                    )}
                    <span className="ml-auto text-[7px] uppercase tracking-[0.1em] text-[#666666]">
                      {sessions.length} active
                    </span>
                  </div>

                  {/* Viewer Container */}
                  <div className="bg-[#0f0f0f]">
                    <div className="aspect-[4/3] w-full">
                      {isLocalScreen ? (
                        <LocalScreenViewer />
                      ) : (
                        <VncViewer
                          viewOnly={false}
                          controllerType={vncControllerType}
                          directUrl={currentDirectUrl}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Smart Prompt Section */}
                <div className="bg-[#1e1e1e] p-3">
                  <div className="mb-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#888888]">
                    Smart Prompt
                  </div>
                  <form
                    onSubmit={handleSend}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <div className="flex flex-1 items-center gap-2 rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-1.5">
                      <input
                        value={command}
                        onChange={(event) => setCommand(event.target.value)}
                        placeholder="Describe what you want to automate"
                        className="flex-1 bg-transparent text-[10px] text-[#b0b0b0] focus:outline-none placeholder:text-[#555555]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !command.trim() || !selectedModel}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] text-[#888888] transition-all hover:bg-[#222222] disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ControlPill
                      label="New Chat"
                      icon={<MessageSquarePlus className="h-3 w-3" />}
                      onClick={handleNewChat}
                    />
                    <ControlPill
                      label="Open Web"
                      icon={<Globe className="h-3 w-3" />}
                      onClick={handleOpenWeb}
                    />
                    <ControlPill
                      label="Terminal"
                      icon={<Terminal className="h-3 w-3" />}
                      onClick={handleToggleTerminal}
                      active={showTerminal}
                    />
                    <ControlPill
                      label="Shortcuts"
                      icon={<Keyboard className="h-3 w-3" />}
                      onClick={() => setShowKeyboardHelp(true)}
                    />
                    <ControlPill
                      label="Settings"
                      icon={<Settings className="h-3 w-3" />}
                      onClick={() => router.push("/settings")}
                    />
                  </div>
                </div>

                {showTerminal && (
                  <TerminalPanel onClose={() => setShowTerminal(false)} />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#e0e0e0]">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="rounded-sm p-1 text-[#666666] hover:text-[#b0b0b0]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                  Controller Selection
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[8px] text-[#666666]">1-5</span>
                    <span className="text-[8px] text-[#b0b0b0]">Switch to controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px] text-[#666666]">Ctrl/Cmd + 1-5</span>
                    <span className="text-[8px] text-[#b0b0b0]">Toggle multi-selection</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px] text-[#666666]">Escape</span>
                    <span className="text-[8px] text-[#b0b0b0]">Clear selection</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px] text-[#666666]">Tab</span>
                    <span className="text-[8px] text-[#b0b0b0]">Next controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px] text-[#666666]">Shift + Tab</span>
                    <span className="text-[8px] text-[#b0b0b0]">Previous controller</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                  Tips
                </h4>
                <ul className="text-[8px] text-[#666666] space-y-0.5">
                  <li>• Brighter panel indicates primary controller</li>
                  <li>• Dimmer panel indicates active secondary controllers</li>
                  <li>• Use Ctrl/Cmd+click for multi-selection in UI</li>
                  <li>• Controllers maintain individual configurations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
