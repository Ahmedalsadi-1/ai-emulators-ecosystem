"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UnifiedDock } from "@/components/layout/UnifiedDock";
import { VncViewer } from "@/components/vnc/VncViewer";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { LocalScreenViewer } from "@/components/local-screen/LocalScreenViewer";
import { GboxDesktopView } from "@/components/gbox/GboxDesktopView";
import { TracePanel } from "@/components/trace/TracePanel";
import {
  fetchModels,
  fetchTasks,
  ControllerStatus
} from "@/utils/taskUtils";
import { useQuickTaskSession } from "@/hooks/useQuickTaskSession";
import { useControllerKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMultiControllerState } from "@/hooks/useMultiControllerState";
import type { Model } from "@/types";
import type { ControllerOption } from "@/types/controller.types";
import {
  Send,
  Terminal,
  X,
  Check,
  Settings,
  Globe,
  Clock,
  Tv
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
  screen: 'bytebot' | 'debian' | 'kali' | 'custom' | 'bytebot-edge-1' | 'bytebot-edge-2' | 'bytebot-edge-3';
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
    <div className="fixed bottom-20 right-4 z-50 max-w-sm border border-amber-500/50 bg-[#111] p-4 text-[10px] font-mono shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-bold text-amber-500 uppercase">VNC Config Needed</h4>
          <div className="mt-2 space-y-1 text-amber-200/80">
            <div className="bg-amber-900/20 px-1 py-0.5">BYTEBOT_DESKTOP_VNC_URL=ws://localhost:9990/websockify</div>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-300">X</button>
      </div>
    </div>
  );
}

// Task Status Badge Component
function TaskStatusBadge({ status, count }: { status: string; count: number }) {
  const colors = {
    running: "text-green-500",
    pending: "text-yellow-500", 
    failing: "text-red-500"
  };
  
  if (count === 0) return null;
  
  return (
    <span className={`${colors[status as keyof typeof colors]} font-mono`}>
      {status.toUpperCase()}:{count}
    </span>
  );
}

const controllerOptions: ControllerOption[] = [
  { id: "bytebot", label: "Bytebot" },
  { id: "local-screen", label: "Local Screen" },
  { id: "browseros", label: "BrowserOS" },
  { id: "turix", label: "Turix" },
  { id: "factif-ai", label: "Factif-AI" },
  { id: "gbox", label: "Gbox" }, // Added Gbox
  { id: "open-interface", label: "Open Interface" },
];

const defaultWorkspaces: WorkspaceOption[] = [
  { id: "bytebot-edge-1", label: "KRON-1", screen: "bytebot-edge-1", directUrl: process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_VNC_URL_1 },
  { id: "bytebot-edge-2", label: "KRON-2", screen: "bytebot-edge-2", directUrl: process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_VNC_URL_2 },
  { id: "bytebot-edge-3", label: "KRON-3", screen: "bytebot-edge-3", directUrl: process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_VNC_URL_3 },
  { id: "factif-ai", label: "FACTIF-AI", screen: "factif-ai", directUrl: process.env.NEXT_PUBLIC_FACTIFAI_VNC_URL || 'ws://localhost:6082/websockify' },
  { id: "gbox", label: "GBOX", screen: "gbox", directUrl: undefined }, // Gbox will use GboxDesktopView component
];

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
  
  // NEW STATES
  const [showControllerPopup, setShowControllerPopup] = useState(false);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [activeTasks, setActiveTasks] = useState({
    running: 0,
    pending: 0,
    failing: 0
  });

  const taskStorageKey = `bytebot:desktopTask:${activeWorkspace}`;
  const modelStorageKey = `bytebot:desktopModel:${activeWorkspace}`;
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL ||
    'http://localhost:9991';

  // Derive current screen from active workspace
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  const currentScreen = currentWorkspace?.screen || 'bytebot-edge-1';
  const currentDirectUrl = currentWorkspace?.directUrl;
  const isCustomScreen = currentScreen === 'custom' || currentScreen.startsWith('bytebot-edge');
  const vncControllerType = isCustomScreen ? undefined : currentScreen;

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

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, traceEntries]);

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

  const isLocalScreen = primaryControllerId === "local-screen";

  // Load models on component mount
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        const result = await fetchModels();
        if (!isMounted) return;

        const allowedProviders = new Set(["routeway", "groq", "openai", "proxy", "google", "ollama-local"]);
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

  // Load active tasks count
  useEffect(() => {
    let isMounted = true;
    
    const loadActiveTasks = async () => {
      try {
        const result = await fetchTasks({ statuses: ["RUNNING", "PENDING", "FAILING"], limit: 100 });
        if (!isMounted) return;
        
        const counts = { running: 0, pending: 0, failing: 0 };
        result.tasks.forEach((task: any) => {
          if (task.status === 'RUNNING') counts.running++;
          else if (task.status === 'PENDING') counts.pending++;
          else if (task.status === 'FAILING') counts.failing++;
        });
        setActiveTasks(counts);
      } catch (error) {
        // Silently fail - task counting is not critical
        console.warn('Failed to load active tasks:', error);
      }
    };
    
    loadActiveTasks();
    const interval = setInterval(loadActiveTasks, 10000); // Refresh every 10 seconds
    
    return () => {
      isMounted = false;
      clearInterval(interval);
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

  // Handlers for Dock Actions
  const handleToggleControllers = () => setShowControllerPopup(!showControllerPopup);
  const handleToggleTasks = () => setShowTaskHistory(!showTaskHistory);
  const handleSwitchDesktop = (desktopId: string) => setActiveWorkspace(desktopId);

  return (
    <div className="flex h-screen flex-col bg-[#000] text-[#e0e0e0] font-mono text-xs overflow-hidden select-none">
      <VncEnvWarning />
      
      {/* Main Content Area - Split Pane */}
      <div className="flex flex-1 overflow-hidden border-x border-[#333] mx-2 mt-2 bg-[#000]">
        
        {/* LEFT COLUMN: CHAT / SECONDARY */}
        <div className="flex w-[450px] flex-col border-r border-[#333] bg-[#000]">
          {/* Header */}
          <div className="border-b border-[#333] bg-[#000] px-3 py-2 text-[#888] font-bold tracking-widest uppercase flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KronosLogo size={14} className="opacity-50" />
              CHAT
            </div>
            
            {/* Task Status Indicator */}
            <div className="flex items-center gap-2 text-[9px]">
              <span className="text-[#444]">TASKS:</span>
              <TaskStatusBadge status="running" count={activeTasks.running} />
              <TaskStatusBadge status="pending" count={activeTasks.pending} />
              <TaskStatusBadge status="failing" count={activeTasks.failing} />
            </div>
          </div>

                      {/* User / AI Dialogue */}

                    <div className="flex-1 flex flex-col overflow-hidden bg-[#000]">

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">

                         {/* Welcome/Placeholder */}

                         {messages.length === 0 && (

                           <div className="border border-[#333] border-dashed p-4 text-center opacity-40">

                             <div className="mb-2 uppercase tracking-widest">[USER / AI DIALOGUE PLACEHOLDER]</div>

                             <div>System Ready. Waiting for input...</div>

                           </div>

                         )}

          

                         {messages.map((entry) => (

                          <div key={entry.id} className="flex flex-col gap-1 group">

                            <div className={`border px-3 py-2 max-w-[90%] ${

                              entry.role === 'USER' 

                                ? 'border-[#333] bg-[#0a0a0a] self-end ml-auto' 

                                : 'border-[#444] bg-[#050505] self-start mr-auto'

                            }`}>

                              <div className="mb-1 flex items-center justify-between gap-4 text-[9px] uppercase tracking-wider text-[#555]">

                                <span className="font-bold">{entry.role === "USER" ? "USER MESSAGE" : "AI RESPONSE"}</span>

                                <span>{entry.time}</span>

                              </div>

                              <div className="whitespace-pre-wrap leading-relaxed text-[#ccc]">

                                {entry.text}

                              </div>

                            </div>

                          </div>

                         ))}

                         <div ref={chatEndRef} />

                      </div>

          

            {/* Input Area */}
            <div className="border-t border-[#333] bg-[#000] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#444] mb-2 flex justify-between items-center">
                <span>&gt; CHAT</span>
                
                {/* Controls: Tasks | Model | Web | Settings */}
                <div className="flex items-center gap-3">
                   {/* Tasks - Navigate to /tasks page */}
                   <button 
                     type="button"
                     onClick={() => router.push('/tasks')}
                     className="text-[#555] hover:text-[#e0e0e0] transition-colors"
                     title="Go to Tasks"
                   >
                     <Clock className="w-3 h-3" />
                   </button>

                   {/* Model Selector - Small and compact */}
                   <select 
                       value={selectedModel ? getModelKey(selectedModel) : ""}
                       onChange={(e) => handleModelChange(e.target.value)}
                       className="bg-[#050505] border border-[#333] text-[#666] text-[8px] px-1 py-0.5 w-24 focus:outline-none focus:border-[#555] uppercase cursor-pointer"
                   >
                       {models.map(m => (
                         <option key={getModelKey(m)} value={getModelKey(m)}>{m.name.split('/').pop()}</option>
                       ))}
                   </select>

                   {/* Web */}
                   <button 
                     type="button"
                     onClick={() => router.push('/web')}
                     className="text-[#555] hover:text-[#e0e0e0] transition-colors"
                     title="Open Web"
                   >
                     <Globe className="w-3 h-3" />
                   </button>

                   {/* Settings */}
                   <button 
                     type="button"
                     onClick={() => router.push('/settings')}
                     className="text-[#555] hover:text-[#e0e0e0] transition-colors"
                     title="Settings"
                   >
                     <Settings className="w-3 h-3" />
                   </button>
                </div>
              </div>
              
              <form onSubmit={handleSend} className="flex flex-col gap-2">
                <div className="w-full border border-[#333] bg-[#000] p-3 focus-within:border-[#666] min-h-[100px] flex flex-col relative">
                  <textarea 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    className="flex-1 bg-transparent text-[#e0e0e0] placeholder-[#333] focus:outline-none resize-none font-mono text-[11px] leading-relaxed"
                    placeholder="Enter command..."
                    autoFocus
                  />
                  
                  {/* Footer of Input Box */}
                  <div className="flex justify-end items-center gap-3 mt-2 pt-2 border-t border-[#333]/30">
                    {/* Controller Toggle (TV) */}
                    <button 
                      type="button"
                      onClick={() => setShowControllerPopup(!showControllerPopup)}
                      className="text-[#555] hover:text-[#e0e0e0] transition-colors"
                      title="Controllers"
                    >
                      <Tv className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      type="submit"
                      disabled={isLoading || !selectedModel}
                      className="flex items-center gap-2 px-4 py-1.5 border border-[#333] bg-[#0a0a0a] hover:bg-[#111] text-[#888] hover:text-[#e0e0e0] transition-colors uppercase tracking-widest text-[9px]"
                    >
                      <span>SEND COMMAND</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

                    </div>

                  </div>

        {/* RIGHT COLUMN: LIVE DESKTOP PREVIEW */}
        <div className="flex flex-1 flex-col bg-[#000] relative">
           {/* Header */}
           <div className="border-b border-[#333] bg-[#000] px-3 py-2 text-[#888] font-bold tracking-widest uppercase flex justify-between items-center">
            <span>LIVE DESKTOP PREVIEW (RIGHT / PRIMARY)</span>
            {activeWorkspace && (
              <span className="text-[#444] px-2 border border-[#333] text-[9px]">{workspaces.find(w => w.id === activeWorkspace)?.label}</span>
            )}
           </div>

           {/* Desktop Content */}
           <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
              {/* Top Bar inside Desktop Preview (from ASCII) */}
              <div className="w-full border border-[#333] bg-[#000] py-1 text-center text-[#444] text-[10px] uppercase tracking-[0.2em]">
                [       KRONOS SCREEN       ]
              </div>

              {/* Main Desktop Area */}
              <div className="flex-1 border border-[#333] bg-[#050505] relative overflow-hidden flex items-center justify-center group">
                                {isLocalScreen ? (
                                  <LocalScreenViewer />
                                ) : currentScreen === 'gbox' ? (
                                  <GboxDesktopView />
                                ) : (
                                  <div className="w-full h-full relative">
                                     <VncViewer
                                        viewOnly={false}
                                        controllerType={vncControllerType}
                                        directUrl={currentDirectUrl}
                                      />
                                     {/* Overlay when not connected or loading, or just for aesthetic when empty */}
                                     {(!currentDirectUrl && !vncControllerType && currentScreen !== 'gbox') && (
                                       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
                                          <div className="text-center space-y-2">
                                            <div className="text-[14px] font-bold text-[#fff] tracking-widest">[ LIVE DESKTOP PREVIEW PLACEHOLDER AREA — LARGE ]</div>
                                            <div className="text-[10px] text-[#fff] tracking-wider">[ DESKTOP CAPTURE STREAM / SCREENSHOT PLACEHOLDER ]</div>
                                          </div>
                                       </div>
                                     )}
                                  </div>
                                )}                  
                  {/* Corner accents for cyberpunk feel */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#666] opacity-50" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#666] opacity-50" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#666] opacity-50" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#666] opacity-50" />
              </div>
           </div>

           {/* POPUPS LAYER (Above Desktop but below Dock if needed, or z-50 to overlap everything) */}
           {/* Controller Popup */}
           {showControllerPopup && (
             <div className="absolute bottom-4 right-4 z-40 w-64 border border-[#333] bg-[#0a0a0a] shadow-2xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-[#333] pb-2">
                  <span className="text-[#888] font-bold uppercase tracking-widest">CONTROLLERS</span>
                  <button onClick={() => setShowControllerPopup(false)} className="text-[#555] hover:text-[#fff]"><X className="w-3 h-3"/></button>
                </div>
                <div className="space-y-1">
                  {controllerOptions.map(c => {
                    const isActive = activeControllerIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleController(c.id)}
                        className={`w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider flex items-center justify-between border ${ 
                          isActive ? "border-[#444] bg-[#111] text-[#e0e0e0]" : "border-transparent text-[#666] hover:bg-[#050505] hover:text-[#aaa]"
                        }`}
                      >
                        {c.label}
                        {isActive && <Check className="w-3 h-3" />}
                      </button>
                    )
                  })}
                </div>
             </div>
           )}

           {/* Tasks Popup */}
           {showTaskHistory && (
             <div className="absolute bottom-4 right-16 z-40 w-80 h-96 border border-[#333] bg-[#0a0a0a] shadow-2xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-[#333] pb-2">
                  <span className="text-[#888] font-bold uppercase tracking-widest">RECENT TASKS</span>
                  <button onClick={() => setShowTaskHistory(false)} className="text-[#555] hover:text-[#fff]"><X className="w-3 h-3"/></button>
                </div>
                <div className="flex-1 overflow-y-auto text-[#666] italic text-center py-10">
                   No recent tasks found in history.
                </div>
             </div>
           )}

        </div>
      </div>

      {/* Terminal Panel Overlay */}
      {showTerminal && (
        <div className="fixed inset-x-0 bottom-32 z-50 mx-auto max-w-4xl border border-[#333] bg-[#000] shadow-2xl">
           <TerminalPanel onClose={() => setShowTerminal(false)} />
        </div>
      )}

      {/* Unified Dock */}
      <div className="mt-auto relative z-50">
        <UnifiedDock 
          activeDesktop={activeWorkspace}
          onSwitchDesktop={handleSwitchDesktop}
          onToggleControllers={handleToggleControllers}
          onToggleTasks={handleToggleTasks}
        />
      </div>
    </div>
  );
}