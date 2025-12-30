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
import { KronosLogo } from "@/components/branding/KronosLogo";

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
      className={`flex items-center gap-2 rounded-md border px-4 py-2 text-[10px] font-semibold tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all ${
        active
          ? "border-white/20 bg-[#2a2b2e] text-[#f2f2f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          : "border-white/10 bg-[#1a1b1d] text-[#b0b0b0] hover:bg-[#222327] hover:text-[#e0e0e0]"
      }`}
    >
      <span className="text-[#bdbdbd]">{icon}</span>
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
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0c] text-[#e6e6e6]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_top,_rgba(42,42,42,0.35),_transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_bottom,_rgba(8,8,8,0.9),_transparent_70%)]" />

      <FloatingNav />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          <div className="rounded-lg border border-white/10 bg-[#141517]/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_40px_90px_rgba(0,0,0,0.65)]">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#1b1c1e]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#e6e6e6]">
                  <KronosLogo size={48} className="h-8 w-auto" />
                  KRON-DESKTOP
                </div>
                {panelTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePanel(tab.id)}
                    className={`rounded-md border border-white/10 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] transition-all ${
                      activePanel === tab.id
                        ? "bg-[#2a2b2e] text-[#f3f3f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                        : "bg-[#1a1b1d] text-[#9a9a9a] hover:bg-[#222327] hover:text-[#d0d0d0]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-2 text-[9px] font-semibold tracking-[0.08em] text-[#c7c7c7] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="mr-2 text-[8px] uppercase tracking-[0.16em] text-[#9a9a9a]">
                    Model
                  </span>
                  <select
                    value={selectedModel?.name || ""}
                    onChange={(event) => handleModelChange(event.target.value)}
                    className="bg-transparent text-[9px] font-semibold tracking-[0.08em] text-[#cfcfcf] focus:outline-none"
                  >
                    {models.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="ml-2 h-4 w-4 text-[#8f8f8f]" />
                </div>
                {taskStatus && (
                  <span className="rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#9a9a9a]">
                    {taskStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a6a6a6]">
                    <span>{activePanel === "agent" ? "Agent Feed" : "Code Log"}</span>
                    <button
                      type="button"
                      onClick={handleClearPanel}
                      className="rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1 text-[9px] font-semibold tracking-[0.14em] text-[#9a9a9a] transition-all hover:bg-[#222327] hover:text-[#d0d0d0]"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="mt-4 h-[360px] space-y-2 overflow-auto pr-1">
                    {activePanel === "agent" && messages.length === 0 && (
                      <div className="text-xs text-[#8f8f8f]">No messages yet.</div>
                    )}
                    {activePanel === "code" && logs.length === 0 && (
                      <div className="text-xs text-[#8f8f8f]">No logs yet.</div>
                    )}

                    {activePanel === "agent" &&
                      messages.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-md border border-white/10 bg-[#1b1c1e] px-2 py-2 text-[10px] text-[#cfcfcf] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        >
                          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-[#9a9a9a]">
                            <span>
                              {entry.role === "USER" ? "You" : "Bytebot"}
                            </span>
                            <span>{entry.time}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-line text-[10px] leading-snug text-[#d8d8d8]">
                            {entry.text}
                          </p>
                        </div>
                      ))}

                    {activePanel === "code" &&
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-md border border-white/10 bg-[#1b1c1e] px-2 py-2 text-[10px] text-[#cfcfcf] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        >
                          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-[#9a9a9a]">
                            <span>Log</span>
                            <span>{log.time}</span>
                          </div>
                          <p className="mt-1 text-[10px] leading-snug text-[#d8d8d8]">
                            {log.message}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className={`rounded-lg border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 ${
                  keyboardNavigationActive
                    ? 'border-white/20 bg-[#222327]'
                    : 'border-white/10 bg-[#17181b]/85'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a6a6a6]">
                    <span>Controllers</span>
                    <div className="flex items-center gap-2">
                      {keyboardNavigationActive && (
                        <span className="rounded-md border border-white/15 bg-[#2a2b2e] px-2 py-0.5 text-[9px] text-[#d0d0d0]">
                          Keyboard Mode
                        </span>
                      )}
                      {activeControllerIds.length > 0 && (
                        <span className="rounded-md border border-white/15 bg-[#2a2b2e] px-2 py-0.5 text-[9px] text-[#cfcfcf]">
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
                            className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${
                              isPrimary
                                ? "border-white/20 bg-[#2a2b2e] text-[#f3f3f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                                : isActive
                                ? "border-white/15 bg-[#222327] text-[#d0d0d0]"
                                : "border-white/10 bg-[#1a1b1d] text-[#9a9a9a] hover:bg-[#222327] hover:text-[#d0d0d0]"
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
                <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a6a6a6]">
                    <span>Live Desktop View</span>
                    <span className="rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1 text-[8px] font-semibold tracking-[0.14em] text-[#bdbdbd]">
                      Controlled by {activeControllerLabel}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a9a9a]">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => setActiveWorkspace(workspace.id)}
                        className={`rounded-md border px-3 py-1.5 transition-all ${
                          activeWorkspace === workspace.id
                            ? "border-white/15 bg-[#2a2b2e] text-[#f3f3f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                            : "border-white/10 bg-[#1a1b1d] text-[#9a9a9a] hover:bg-[#222327] hover:text-[#d0d0d0]"
                        }`}
                      >
                        {workspace.label}
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowNewWorkspaceDropdown(!showNewWorkspaceDropdown)}
                        className="flex items-center gap-2 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1.5 text-[#9a9a9a] transition-all hover:bg-[#222327] hover:text-[#d0d0d0]"
                      >
                        <Plus className="h-3 w-3" />
                        New
                        <ChevronDown className={`h-3 w-3 transition-transform ${showNewWorkspaceDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showNewWorkspaceDropdown && (
                        <div className="absolute top-full z-20 mt-1 w-52 rounded-md border border-white/10 bg-[#1b1c1e] shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
                          <div className="p-2 text-[10px] text-[#b6b6b6]">
                            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9a9a9a]">
                              Screen Type
                            </label>
                            <select
                              value={newWorkspaceScreen}
                              onChange={(e) => setNewWorkspaceScreen(e.target.value as 'bytebot' | 'debian' | 'kali')}
                              className="w-full rounded border border-white/10 bg-[#111214] px-2 py-1 text-[10px] text-[#d0d0d0]"
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
                              className="mt-2 w-full rounded border border-white/10 bg-[#2a2b2e] px-2 py-1 text-[10px] font-semibold text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                            >
                              Create Workspace
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>



                   <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-[#0f1012] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_18px_40px_rgba(0,0,0,0.65)]">
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
                   <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                     <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a6a6a6]">
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
                        className="rounded-md border border-white/10 bg-[#1a1b1d] px-2 py-1 text-[9px] font-semibold tracking-[0.2em] text-[#9a9a9a] transition-all hover:bg-[#222327] hover:text-[#d0d0d0]"
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
                             className="rounded-md border border-white/10 bg-[#1a1b1d] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a6a6a6] transition-all hover:bg-[#222327] hover:text-[#d0d0d0]"
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
                             className="rounded-md border border-[#3b2a2a] bg-[#1a1414] px-1 py-1 text-[8px] font-semibold text-[#d5a8a8] transition-all hover:bg-[#241b1b]"
                           >
                             ✕
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

                <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9a9a9a]">
                    Smart Prompt
                  </div>
                  <form
                    onSubmit={handleSend}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <div className="flex flex-1 items-center gap-3 rounded-md border border-white/10 bg-[#101113] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <input
                        value={command}
                        onChange={(event) => setCommand(event.target.value)}
                        placeholder="Describe what you want to automate"
                        className="flex-1 bg-transparent text-[12px] text-[#d4d4d4] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !command.trim() || !selectedModel}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#1a1b1d] text-[#c7c7c7] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:bg-[#222327] disabled:opacity-50"
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
                    <button className="flex items-center gap-2 rounded-md border border-white/10 bg-[#1a1b1d] px-4 py-2 text-[9px] font-semibold tracking-[0.12em] text-[#b0b0b0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:bg-[#222327] hover:text-[#e0e0e0]">
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
          <div className="max-h-[80vh] w-full max-w-md overflow-auto rounded-lg border border-white/10 bg-[#151618] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_30px_80px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#e6e6e6]">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="rounded-md p-1 text-[#9a9a9a] hover:text-[#d0d0d0]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold text-[#cfcfcf]">
                  Controller Selection
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#9a9a9a]">1-5</span>
                    <span className="text-[#e0e0e0]">Switch to controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9a9a]">Ctrl/Cmd + 1-5</span>
                    <span className="text-[#e0e0e0]">Toggle multi-selection</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9a9a]">Escape</span>
                    <span className="text-[#e0e0e0]">Clear selection</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9a9a]">Tab</span>
                    <span className="text-[#e0e0e0]">Next controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9a9a]">Shift + Tab</span>
                    <span className="text-[#e0e0e0]">Previous controller</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9a9a]">Arrow Keys</span>
                    <span className="text-[#e0e0e0]">Navigate controllers</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-[#cfcfcf]">
                  Tips
                </h4>
                <ul className="text-sm text-[#b0b0b0] space-y-1">
                  <li>• Brighter panel indicates primary controller</li>
                  <li>• Dimmer panel indicates active secondary controllers</li>
                  <li>• Use Ctrl/Cmd+click for multi-selection in UI</li>
                  <li>• Controllers maintain individual configurations</li>
                </ul>
              </div>
                  </div>
                </div>

                 {/* Controller Workflows */}
                 {workflows.length > 0 && (
                   <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                     <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a6a6a6]">
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
                         className="rounded-md border border-white/10 bg-[#1a1b1d] px-2 py-1 text-[9px] font-semibold tracking-[0.2em] text-[#9a9a9a] transition-all hover:bg-[#222327] hover:text-[#d0d0d0]"
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
                                 ? 'border-white/20 bg-[#2a2b2e] text-[#f0f0f0]'
                                 : 'border-white/10 bg-[#1a1b1d] text-[#9a9a9a] hover:bg-[#222327] hover:text-[#d0d0d0]'
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
                             className="rounded-md border border-[#3b2a2a] bg-[#1a1414] px-1 py-1 text-[8px] font-semibold text-[#d5a8a8] transition-all hover:bg-[#241b1b]"
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
