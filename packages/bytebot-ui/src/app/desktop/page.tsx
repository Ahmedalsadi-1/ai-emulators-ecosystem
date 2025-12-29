"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { VncViewer } from "@/components/vnc/VncViewer";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import {
  fetchModels,
  getAIOSStatus,
  getFactifAIStatus,
  ControllerStatus
} from "@/utils/taskUtils";
import { useQuickTaskSession } from "@/hooks/useQuickTaskSession";
import { useControllerKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMultiControllerState } from "@/hooks/useMultiControllerState";
import { useControllerWorkflows } from "@/hooks/useControllerWorkflows";
import type { Model } from "@/types";
import type { ControllerOption } from "@/types/controller.types";
import {
  ChevronDown,
  EyeOff,
  Globe,
  Keyboard,
  MessageSquarePlus,
  Plus,
  Send,
  Settings,
  Terminal,

} from "lucide-react";

type PanelTab = "agent" | "code";



type WorkspaceOption = {
  id: string;
  label: string;
  screen: 'bytebot' | 'debian' | 'kali';
};

const panelTabs: { id: PanelTab; label: string }[] = [
  { id: "code", label: "Code" },
  { id: "agent", label: "Agent" },
];

const controllerOptions: ControllerOption[] = [
  { id: "bytebot", label: "Bytebot" },
  { id: "browseros", label: "BrowserOS" },
  { id: "turix", label: "Turix" },
  { id: "aios", label: "AIOS" },
  { id: "factif-ai", label: "Factif-AI" },
  { id: "open-interface", label: "Open Interface" },
];

const defaultWorkspaces: WorkspaceOption[] = [
  { id: "desktop-1", label: "Desktop 1 (Bytebot)", screen: "bytebot" },
  { id: "desktop-2", label: "Desktop 2 (Debian)", screen: "debian" },
  { id: "desktop-3", label: "Desktop 3 (Kali)", screen: "kali" },
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
      className={`flex items-center gap-2 rounded-md border px-4 py-2 text-[11px] font-semibold tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
        active
          ? "border-sky-200/80 bg-white/80 text-slate-600 shadow-[0_0_16px_rgba(56,189,248,0.25)] dark:border-sky-400/40 dark:bg-white/10 dark:text-white"
          : "border-white/70 bg-white/65 text-slate-500 hover:bg-white/80 hover:text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
      }`}
    >
      <span className="text-slate-400 dark:text-slate-200">{icon}</span>
      {label}
    </button>
  );
}

export default function DesktopPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [command, setCommand] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelTab>("agent");
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>(
    defaultWorkspaces,
  );
  const [activeWorkspace, setActiveWorkspace] = useState<string>(
    defaultWorkspaces[0].id,
  );
  const [controllerStatuses, setControllerStatuses] = useState<Record<string, ControllerStatus>>({});
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [keyboardNavigationActive, setKeyboardNavigationActive] = useState(false);
  const [launchControllerApps, setLaunchControllerApps] = useState(false);
  const [showNewWorkspaceDropdown, setShowNewWorkspaceDropdown] = useState(false);
  const [newWorkspaceScreen, setNewWorkspaceScreen] = useState<'bytebot' | 'debian' | 'kali'>('debian');

  // Derive current screen from active workspace
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  const currentScreen = currentWorkspace?.screen || 'debian';

  // Load workspaces and active workspace from localStorage
  useEffect(() => {
    const savedWorkspaces = localStorage.getItem('bytebot:desktop:workspaces');
    const savedActiveWorkspace = localStorage.getItem('bytebot:desktop:activeWorkspace');

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

  const {
    messages,
    logs,
    isLoading,
    taskStatus,
    sendMessage,
    clearMessages,
    clearLogs,
    addLog,
    resetSession,
  } = useQuickTaskSession({ storageKey: "bytebot:desktopTask" });

  // Multi-controller state management
  const {
    controllers,
    activeControllerIds,
    primaryControllerId,
    presets,
    toggleController,
    clearSelection,
    navigateControllers,
    savePreset,
    loadPreset,
    deletePreset,
  } = useMultiControllerState(controllerOptions);

  // Workflow management
  const {
    workflows,
    activeWorkflow,
    createWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    deleteWorkflow,
    executeWorkflow,
  } = useControllerWorkflows();

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

  const handleModelChange = (modelName: string) => {
    const match = models.find((model) => model.name === modelName);
    if (match) {
      setSelectedModel(match);
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!command.trim() || !selectedModel) return;
    const nextMessage = command.trim();
    setCommand("");
    await sendMessage(nextMessage, selectedModel);
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

    // Check controller status when activating
    try {
      let status: ControllerStatus | null = null;

      switch (controllerId) {
        case 'aios':
          status = await getAIOSStatus();
          break;
        case 'factif-ai':
          status = await getFactifAIStatus();
          break;
        default:
          addLog(`${multiSelect ? 'Toggled' : 'Switched to'} controller: ${label}`);
          return;
      }

      if (status && status.status === 'connected') {
        addLog(`✅ ${label} controller connected successfully`);
      } else {
        addLog(`⚠️ ${label} controller: ${status?.message || 'Connection issue'}`);
      }
    } catch (error) {
      addLog(`❌ Failed to connect to ${label} controller: ${error}`);
    }
  };

  const handleClearPanel = () => {
    if (activePanel === "agent") {
      clearMessages();
      return;
    }

    clearLogs();
  };

  const handleAddWorkspace = (screen: 'bytebot' | 'debian' | 'kali') => {
    setWorkspaces((prev) => {
      const nextIndex = prev.length + 1;
      const newWorkspace = {
        id: `desktop-${nextIndex}`,
        label: `Desktop ${nextIndex}`,
        screen,
      };
      return [...prev, newWorkspace];
    });
  };

  const activeControllerLabel = primaryControllerId
    ? controllerOptions.find((item) => item.id === primaryControllerId)?.label || "Multiple"
    : activeControllerIds.length > 0 ? "Multiple" : "None";

  // Reset keyboard navigation active state after 3 seconds of inactivity
  // Load models on component mount
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      const result = await fetchModels();
      if (!isMounted) return;

      setModels(result);

      // Set default selected model
      const storedModel = window.localStorage.getItem("bytebot:model");
      const stored =
        storedModel &&
        result.find(
          (model) =>
            model.name === storedModel || model.title === storedModel,
        );
      setSelectedModel(stored || result[0] || null);
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save selected model to localStorage
  useEffect(() => {
    if (!selectedModel) return;
    window.localStorage.setItem(
      "bytebot:model",
      selectedModel.name || selectedModel.title,
    );
  }, [selectedModel?.name, selectedModel?.title]);

  useEffect(() => {
    if (keyboardNavigationActive) {
      const timeout = setTimeout(() => setKeyboardNavigationActive(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [keyboardNavigationActive]);



  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_rgba(186,220,255,0.65),_transparent_60%),linear-gradient(180deg,_#f4f7ff_0%,_#e9f1ff_55%,_#e2ecf7_100%)] text-slate-700 dark:bg-[radial-gradient(1200px_circle_at_top,_rgba(56,189,248,0.22),_transparent_60%),linear-gradient(180deg,_#05070d_0%,_#0b1220_55%,_#0a0f1a_100%)] dark:text-slate-100">
      <div className="absolute inset-0 bg-white/30 dark:bg-slate-950/60" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-size:14px_14px] [background-image:radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.2)_1px,_transparent_0)] dark:opacity-20" />

      <FloatingNav />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          <div className="rounded-xl border border-white/60 bg-white/45 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                {panelTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePanel(tab.id)}
                    className={`rounded-md px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
                      activePanel === tab.id
                        ? "bg-slate-900/90 text-white shadow-[0_0_12px_rgba(15,23,42,0.25)] dark:bg-white/15 dark:text-white"
                        : "text-slate-400 hover:bg-white/70 hover:text-slate-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border border-white/70 bg-white/70 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    Model
                  </span>
                  <select
                    value={selectedModel?.name || ""}
                    onChange={(event) => handleModelChange(event.target.value)}
                    className="bg-transparent text-[11px] font-semibold tracking-[0.12em] text-slate-500 focus:outline-none dark:text-slate-200"
                  >
                    {models.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                </div>
                {taskStatus && (
                  <span className="rounded-md border border-white/70 bg-white/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                    {taskStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    <span>{activePanel === "agent" ? "Agent Feed" : "Code Log"}</span>
                    <button
                      type="button"
                      onClick={handleClearPanel}
                      className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="mt-4 h-[360px] space-y-2 overflow-auto pr-1">
                    {activePanel === "agent" && messages.length === 0 && (
                      <div className="text-xs text-slate-400 dark:text-slate-300">
                        No messages yet.
                      </div>
                    )}
                    {activePanel === "code" && logs.length === 0 && (
                      <div className="text-xs text-slate-400 dark:text-slate-300">
                        No logs yet.
                      </div>
                    )}

                    {activePanel === "agent" &&
                      messages.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-md border border-white/70 bg-white/70 px-2 py-2 text-[11px] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                        >
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                            <span>
                              {entry.role === "USER" ? "You" : "Bytebot"}
                            </span>
                            <span>{entry.time}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-line text-[12px] leading-snug text-slate-500 dark:text-slate-200">
                            {entry.text}
                          </p>
                        </div>
                      ))}

                    {activePanel === "code" &&
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-md border border-white/70 bg-white/70 px-2 py-2 text-[11px] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                        >
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                            <span>Log</span>
                            <span>{log.time}</span>
                          </div>
                          <p className="mt-1 text-[12px] leading-snug text-slate-500 dark:text-slate-200">
                            {log.message}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className={`rounded-xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all duration-200 ${
                  keyboardNavigationActive
                    ? 'border-blue-300/70 bg-blue-50/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:border-blue-600/40 dark:bg-blue-900/10'
                    : 'border-white/70 bg-white/55 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    <span>Controllers</span>
                    <div className="flex items-center gap-2">
                      {keyboardNavigationActive && (
                        <span className="rounded-md border border-blue-200/60 bg-blue-50/60 px-2 py-0.5 text-[9px] text-blue-600 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400">
                          Keyboard Mode
                        </span>
                      )}
                      {activeControllerIds.length > 0 && (
                        <span className="rounded-md border border-sky-200/60 bg-sky-50/60 px-2 py-0.5 text-[9px] text-sky-600 dark:border-sky-800/40 dark:bg-sky-900/20 dark:text-sky-400">
                          {activeControllerIds.length} active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {controllerOptions.map((controller) => {
                      const controllerState = controllers.find(c => c.id === controller.id);
                      const isActive = controllerState?.isActive || false;
                      const isPrimary = primaryControllerId === controller.id;
                      const status = controllerStatuses[controller.id];

                      return (
                        <div key={controller.id} className="relative">
                          <button
                            type="button"
                            onClick={(e) => handleControllerChange(controller.id, e.ctrlKey || e.metaKey)}
                            title={`${controller.label} controller${isActive ? ' (active)' : ''}${isPrimary ? ' (primary)' : ''} - Press Ctrl/Cmd+click for multi-selection`}
                            aria-label={`${controller.label} controller${isActive ? ' (active)' : ''}${isPrimary ? ' (primary)' : ''} - Press Ctrl/Cmd+click for multi-selection`}
                            aria-pressed={isActive}
                            className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                              isPrimary
                                ? "border-blue-200/80 bg-blue-50/80 text-slate-600 shadow-[0_0_12px_rgba(59,130,246,0.25)] dark:border-blue-400/40 dark:bg-blue-900/20 dark:text-white"
                                : isActive
                                ? "border-sky-200/80 bg-white/80 text-slate-600 shadow-[0_0_12px_rgba(56,189,248,0.25)] dark:border-sky-400/40 dark:bg-white/10 dark:text-white"
                                : "border-white/70 bg-white/70 text-slate-400 hover:bg-white hover:text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                            }`}
                          >
                             {status && (
                               <span
                                 className={`inline-block w-1.5 h-1.5 rounded-full ${
                                   status.status === 'connected'
                                     ? 'bg-green-400'
                                     : status.status === 'disconnected' || status.status === 'error'
                                     ? 'bg-red-400'
                                     : 'bg-yellow-400'
                                 }`}
                               />
                             )}
                            {controller.label}
                          </button>
                          {status && status.status !== 'connected' && (
                            <div className="absolute top-full mt-1 left-0 z-10">
                              <div className="bg-black/80 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap max-w-32 truncate">
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

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    <span>Live Desktop View</span>
                    <span className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      Controller: {activeControllerLabel}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => setActiveWorkspace(workspace.id)}
                        className={`rounded-md border px-3 py-1.5 transition-all ${
                          activeWorkspace === workspace.id
                            ? "border-sky-200/80 bg-white/80 text-slate-600 shadow-[0_0_12px_rgba(56,189,248,0.25)] dark:border-sky-400/40 dark:bg-white/10 dark:text-white"
                            : "border-white/70 bg-white/70 text-slate-400 hover:bg-white hover:text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        {workspace.label}
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowNewWorkspaceDropdown(!showNewWorkspaceDropdown)}
                        className="flex items-center gap-2 rounded-md border border-white/70 bg-white/70 px-3 py-1.5 text-slate-400 hover:bg-white hover:text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                      >
                        <Plus className="h-3 w-3" />
                        New
                        <ChevronDown className={`h-3 w-3 transition-transform ${showNewWorkspaceDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showNewWorkspaceDropdown && (
                        <div className="absolute top-full mt-1 w-48 rounded-md border border-white/70 bg-white/90 shadow-lg dark:border-white/10 dark:bg-white/10">
                          <div className="p-2">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-2">
                              Screen Type
                            </label>
                            <select
                              value={newWorkspaceScreen}
                              onChange={(e) => setNewWorkspaceScreen(e.target.value as 'bytebot' | 'debian' | 'kali')}
                              className="w-full rounded border border-white/70 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-white/5"
                            >
                              <option value="bytebot">Bytebot Desktop</option>
                              <option value="debian">Debian Desktop</option>
                              <option value="kali">Kali Desktop</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddWorkspace(newWorkspaceScreen);
                                setShowNewWorkspaceDropdown(false);
                              }}
                              className="mt-2 w-full rounded bg-sky-500 px-2 py-1 text-xs text-white hover:bg-sky-600"
                            >
                              Create Workspace
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>



                   <div className="mt-2 overflow-hidden rounded-lg border border-white/60 bg-white/50 dark:border-white/10 dark:bg-white/5">
                     <div className="aspect-[4/3] w-full">
                       <VncViewer
                         viewOnly={false}
                         proxyPath={
                          currentScreen === "kali" ? "/api/proxy/kali-websockify" :
                          currentScreen === "debian" ? "/api/proxy/websockify" :
                          "/api/proxy/websockify" // bytebot default
                        }
                       />
                   </div>
                 </div>

                 {/* Controller Presets */}
                 {presets.length > 0 && (
                   <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                     <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                       <span>Controller Presets</span>
                       <button
                         type="button"
                         onClick={() => {
                           const name = prompt('Enter preset name:');
                           if (name && activeControllerIds.length > 0) {
                             const id = savePreset(name);
                             addLog(`✅ Preset "${name}" saved`);
                           } else if (!name) {
                             addLog('❌ Preset name required');
                           } else {
                             addLog('❌ At least one controller must be active');
                           }
                         }}
                         className="rounded-md border border-white/70 bg-white/70 px-2 py-1 text-[9px] font-semibold tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                       >
                         Save
                       </button>
                     </div>
                     <div className="mt-3 flex flex-wrap gap-2">
                       {presets.map((preset) => (
                         <div key={preset.id} className="flex items-center gap-1">
                           <button
                             type="button"
                             onClick={() => {
                               loadPreset(preset.id);
                               addLog(`✅ Preset "${preset.name}" loaded`);
                             }}
                             className="rounded-md border border-white/70 bg-white/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                           >
                             {preset.name}
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                               if (confirm(`Delete preset "${preset.name}"?`)) {
                                 deletePreset(preset.id);
                                 addLog(`🗑️ Preset "${preset.name}" deleted`);
                               }
                             }}
                             className="rounded-md border border-red-200/70 bg-red-50/70 px-1 py-1 text-[8px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
                           >
                             ✕
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

                <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <form
                    onSubmit={handleSend}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <div className="flex flex-1 items-center gap-3 rounded-md border border-white/70 bg-white/70 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-white/10">
                      <input
                        value={command}
                        onChange={(event) => setCommand(event.target.value)}
                        placeholder="Describe what you want to automate"
                        className="flex-1 bg-transparent text-sm text-slate-500 focus:outline-none dark:text-slate-200"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !command.trim() || !selectedModel}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-white/70 bg-white/80 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>

                   <div className="mt-4 flex flex-wrap items-center gap-3">
                     <ControlPill
                       label="New Chat"
                       icon={<MessageSquarePlus className="h-4 w-4" />}
                       onClick={handleNewChat}
                     />
                     <ControlPill
                       label="Open Web"
                       icon={<Globe className="h-4 w-4" />}
                       onClick={handleOpenWeb}
                     />
                     <ControlPill
                       label="Terminal"
                       icon={<Terminal className="h-4 w-4" />}
                       onClick={handleToggleTerminal}
                       active={showTerminal}
                     />
                     <ControlPill
                       label="Shortcuts"
                       icon={<Keyboard className="h-4 w-4" />}
                       onClick={() => setShowKeyboardHelp(true)}
                     />
                     <ControlPill
                       label="Settings"
                       icon={<Settings className="h-4 w-4" />}
                       onClick={() => router.push("/settings")}
                     />
                    <button className="flex items-center gap-2 rounded-md border border-white/70 bg-white/70 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
                      <EyeOff className="h-4 w-4" />
                      Hide Bytebot
                    </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-white/60 bg-white/95 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold text-slate-600 dark:text-slate-300">
                  Controller Selection
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">1-5</span>
                    <span className="text-slate-700 dark:text-slate-200">Switch to controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Ctrl/Cmd + 1-5</span>
                    <span className="text-slate-700 dark:text-slate-200">Toggle multi-selection</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Escape</span>
                    <span className="text-slate-700 dark:text-slate-200">Clear selection</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Tab</span>
                    <span className="text-slate-700 dark:text-slate-200">Next controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Shift + Tab</span>
                    <span className="text-slate-700 dark:text-slate-200">Previous controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Arrow Keys</span>
                    <span className="text-slate-700 dark:text-slate-200">Navigate controllers</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-600 dark:text-slate-300">
                  Tips
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Blue border indicates primary controller</li>
                  <li>• Light blue indicates active secondary controllers</li>
                  <li>• Use Ctrl/Cmd+click for multi-selection in UI</li>
                  <li>• Controllers maintain individual configurations</li>
                </ul>
              </div>
                  </div>
                </div>

                 {/* Controller Workflows */}
                 {workflows.length > 0 && (
                   <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                     <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                       <span>Workflows</span>
                       <button
                         type="button"
                         onClick={() => {
                           const name = prompt('Enter workflow name:');
                           if (name) {
                             const id = createWorkflow(name);
                             addLog(`✅ Workflow "${name}" created`);
                           } else {
                             addLog('❌ Workflow name required');
                           }
                         }}
                         className="rounded-md border border-white/70 bg-white/70 px-2 py-1 text-[9px] font-semibold tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                       >
                         Create
                       </button>
                     </div>
                     <div className="mt-3 flex flex-wrap gap-2">
                       {workflows.map((workflow) => (
                         <div key={workflow.id} className="flex items-center gap-1">
                           <button
                             type="button"
                             onClick={() => {
                               if (workflow.isActive) {
                                 deactivateWorkflow(workflow.id);
                                 addLog(`⏸️ Workflow "${workflow.name}" deactivated`);
                               } else {
                                 activateWorkflow(workflow.id);
                                 addLog(`▶️ Workflow "${workflow.name}" activated`);
                               }
                             }}
                             className={`rounded-md border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] transition-all ${
                               workflow.isActive
                                 ? 'border-green-200/70 bg-green-50/70 text-green-600 dark:border-green-800/40 dark:bg-green-900/20 dark:text-green-400'
                                 : 'border-white/70 bg-white/70 text-slate-400 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-300'
                             }`}
                           >
                             {workflow.isActive ? 'Active' : workflow.name}
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                               if (confirm(`Delete workflow "${workflow.name}"?`)) {
                                 deleteWorkflow(workflow.id);
                                 addLog(`🗑️ Workflow "${workflow.name}" deleted`);
                               }
                             }}
                             className="rounded-md border border-red-200/70 bg-red-50/70 px-1 py-1 text-[8px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
                           >
                             ✕
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
      )}
    </div>
  );
}
