"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Send,
  ChevronDown,
  CheckCircle2,
  Terminal,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { VncViewer } from "@/components/vnc/VncViewer";
import { LocalScreenViewer } from "@/components/local-screen/LocalScreenViewer";
import { UITARSViewer } from "@/components/os-ai/UITARSViewer";
import { fetchModels } from "@/utils/taskUtils";
import { Model } from "@/types";
import { OrganizedChatPanel } from "@/components/desktop/OrganizedChatPanel";
import { ToolTraceSlideshow } from "@/components/desktop/ToolTraceSlideshow";
import { GboxAndroidView } from "@/components/gbox/GboxAndroidView";
import { useQuickTaskSession } from "@/hooks/useQuickTaskSession";
import { useMultiControllerState } from "@/hooks/useMultiControllerState";

type DesktopSessionType = "bytebot" | "debian" | "kali";

type DesktopSession = {
  id: string;
  name: string;
  type: DesktopSessionType;
  port: number | null;
  status: "running" | "exited" | "unknown";
  wsUrl?: string;
};

type WorkspaceOption = {
  id: string;
  label: string;
  screen: "bytebot" | "debian" | "kali" | "custom";
  directUrl?: string;
  sessionId?: string;
  sessionPort?: number | null;
};

type ControllerOption = {
  id: string;
  label: string;
};

const WORKSPACE_STORAGE_VERSION = "2";
const WORKSPACE_STORAGE_VERSION_KEY = "bytebot:desktop:workspaceVersion";

const defaultWorkspaces: WorkspaceOption[] = [
  { id: "bytebot", label: "Bytebot Desktop", screen: "bytebot" },
  { id: "debian", label: "Debian Desktop", screen: "debian" },
  { id: "kali", label: "Kali Desktop", screen: "kali" },
  { id: "browseros", label: "BrowserOS", screen: "custom" },
];

const controllerOptions: ControllerOption[] = [
  { id: "bytebot", label: "Bytebot Desktop" },
  { id: "local-screen", label: "Local Screen" },
  { id: "os-ai", label: "UI-TARS" },
  { id: "gbox-android", label: "GBox Android" },
];

const pickRoutewayDefault = (candidates: Model[]): Model | null =>
  candidates.find((model) => model.provider === "routeway" && model.capabilities?.toolCalling) ||
  candidates[0] ||
  null;

function ModelSelector({
  selectedModel,
  models,
  onSelect,
}: {
  selectedModel: Model | null;
  models: Model[];
  onSelect: (modelKey: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getModelKey = (model: Model) => `${model.provider}:${model.name}`;

  const filteredModels = models.filter(
    (model) =>
      model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="truncate max-w-[140px]">
          {selectedModel?.title || "Select model"}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-0 mb-2 w-64 rounded-lg overflow-hidden z-50 bg-[#1a1c22]/95 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              <div className="p-2 border-b border-white/5">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-gray-600 outline-none focus:bg-white/10"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredModels.map((model) => (
                  <motion.button
                    key={getModelKey(model)}
                    onClick={() => {
                      onSelect(getModelKey(model));
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-all ${
                      selectedModel && getModelKey(selectedModel) === getModelKey(model)
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex-1 truncate">{model.title}</span>
                    {selectedModel && getModelKey(selectedModel) === getModelKey(model) && (
                      <CheckCircle2 className="w-3 h-3 text-purple-400" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControllerDropdown({
  controllerOptions,
  activeControllerIds,
  toggleController,
}: {
  controllerOptions: ControllerOption[];
  activeControllerIds: string[];
  toggleController: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const activeLabel = controllerOptions.find((c) => c.id === activeControllerIds[0])?.label || "Controller";

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Cpu className="w-3 h-3" />
        <span className="truncate max-w-[120px]">{activeLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-0 mb-2 w-44 rounded-lg overflow-hidden z-50 bg-[#1a1c22]/95 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              {controllerOptions.map((controller) => (
                <motion.button
                  key={controller.id}
                  onClick={() => {
                    toggleController(controller.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-all ${
                    activeControllerIds.includes(controller.id)
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex-1">{controller.label}</span>
                  {activeControllerIds.includes(controller.id) && (
                    <CheckCircle2 className="w-3 h-3 text-purple-400" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivityCard({
  variant = "assistant",
  children,
}: {
  variant?: "user" | "assistant" | "action";
  children: React.ReactNode;
}) {
  const variantStyles = {
    user: "bg-white/[0.02] border-l-2 border-white/20",
    assistant: "bg-white/[0.02] border-l-2 border-white/20",
    action: "bg-white/[0.01] border-l-2 border-white/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded text-xs leading-relaxed text-gray-300 ${variantStyles[variant]} mb-2`}
    >
      {children}
    </motion.div>
  );
}

export default function DesktopPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const getModelKey = useCallback((model: Model) => `${model.provider}:${model.name}`, []);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>(defaultWorkspaces);
  const [activeWorkspace, setActiveWorkspace] = useState<string>("bytebot");
  const [isPaused, setIsPaused] = useState(false);
  const [showToolSlideshow, setShowToolSlideshow] = useState(false);
  const taskStorageKey = `bytebot:desktopTask:${activeWorkspace}`;
  const modelStorageKey = `bytebot:desktopModel:${activeWorkspace}`;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL || "http://localhost:9991";

  const currentWorkspaceObj = workspaces.find((w) => w.id === activeWorkspace) || workspaces[0];
  const currentScreen = currentWorkspaceObj?.screen || "bytebot";
  const currentDirectUrl = currentWorkspaceObj?.directUrl;
  const vncControllerType = currentScreen === "custom" ? undefined : currentScreen;

  const [commandInput, setCommandInput] = useState("");

  useEffect(() => {
    const savedWorkspaces = localStorage.getItem("bytebot:desktop:workspaces");
    const savedActiveWorkspace = localStorage.getItem("bytebot:desktop:activeWorkspace");
    const storedVersion = localStorage.getItem(WORKSPACE_STORAGE_VERSION_KEY);

    if (storedVersion !== WORKSPACE_STORAGE_VERSION) {
      localStorage.removeItem("bytebot:desktop:workspaces");
      localStorage.removeItem("bytebot:desktop:activeWorkspace");
      localStorage.setItem(WORKSPACE_STORAGE_VERSION_KEY, WORKSPACE_STORAGE_VERSION);
      setWorkspaces(defaultWorkspaces);
      setActiveWorkspace("bytebot");
      return;
    }

    if (savedWorkspaces) {
      try {
        const parsed = JSON.parse(savedWorkspaces);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorkspaces(parsed);
          setActiveWorkspace(
            savedActiveWorkspace && parsed.find((w: WorkspaceOption) => w.id === savedActiveWorkspace)
              ? savedActiveWorkspace
              : "bytebot"
          );
        }
      } catch {
        // Restore defaults on parse error
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bytebot:desktop:workspaces", JSON.stringify(workspaces));
    localStorage.setItem("bytebot:desktop:activeWorkspace", activeWorkspace);
  }, [workspaces, activeWorkspace]);

  const addWorkspaceFromSession = useCallback((session: DesktopSession) => {
    if (!session.wsUrl) return;
    const workspaceId = `session-${session.id}`;
    setWorkspaces((prev) => {
      const exists = prev.find((w) => w.id === workspaceId);
      if (exists)
        return prev.map((w) =>
          w.id === workspaceId
            ? {
                ...w,
                label: session.name || `Session ${session.port ?? ""}`.trim(),
                screen: "custom",
                directUrl: session.wsUrl,
                sessionId: session.id,
                sessionPort: session.port,
              }
            : w
        );
      return [
        ...prev,
        {
          id: workspaceId,
          label: session.name || `Session ${session.port ?? ""}`.trim(),
          screen: "custom",
          directUrl: session.wsUrl,
          sessionId: session.id,
          sessionPort: session.port,
        },
      ];
    });
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/desktop-sessions`);

      if (response.status === 400) {
        setTimeout(() => loadSessions(), 5000);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load sessions (${response.status})`);
      }
      const data = await response.json();
      data.forEach((session: DesktopSession) => addWorkspaceFromSession(session));
    } catch {
      // Error loading sessions - app continues without session data
    }
  }, [apiBase, addWorkspaceFromSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const {
    isLoading,
    sendMessage,
    traceEntries,
  } = useQuickTaskSession({ storageKey: taskStorageKey });

  const { activeControllerIds, primaryControllerId, toggleController } = useMultiControllerState(controllerOptions);

  const handleModelChange = (modelKey: string) => {
    const match = models.find((model) => getModelKey(model) === modelKey);
    if (match) {
      setSelectedModel(match);
    }
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || !selectedModel) return;
    const activeSession = workspaces.find((workspace) => workspace.id === activeWorkspace) || workspaces[0];
    const sessionId = activeSession?.sessionId || activeSession?.screen;
    const sessionPrefix = sessionId ? `Use session_id="${sessionId}" for all computer tools in this task.\n` : "";
    await sendMessage(`${sessionPrefix}${messageText}`, selectedModel);
  };

  const handleOpenWeb = () => {
    router.push("/web");
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    handleSend(commandInput);
    setCommandInput("");
  };

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        const result = await fetchModels();
        if (!isMounted) return;

        const allowedProviders = new Set(["routeway", "groq", "openai", "proxy", "google", "ollama-local"]);
        const filteredModels = result.filter(
          (model: Model) => model.capabilities?.toolCalling && allowedProviders.has(model.provider)
        );
        setModels(filteredModels);
      } catch {
        if (!isMounted) return;
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
          model.title === storedModel
      );
    if (!selectedModel) {
      setSelectedModel(stored || pickRoutewayDefault(models) || null);
    }
  }, [models, modelStorageKey, getModelKey]);

  useEffect(() => {
    if (!selectedModel) return;
    window.localStorage.setItem(modelStorageKey, getModelKey(selectedModel));
  }, [modelStorageKey, selectedModel?.name, selectedModel?.provider, getModelKey, selectedModel]);

  const getWindowTitle = () => {
    switch (activeWorkspace) {
      case "bytebot":
        return "BYTEBOT DESKTOP";
      case "debian":
        return "DEBIAN";
      case "kali":
        return "KALI LINUX";
      case "browseros":
        return "BROWSEROS";
      default:
        return "DESKTOP";
    }
  };

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Tasks", id: "tasks" },
    { label: "Desktop", id: "desktop", active: true },
    { label: "Web", id: "web" },
    { label: "Settings", id: "settings" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-gray-300 font-sans flex flex-col overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-0">
        {/* LEFT PANEL - Activity/Chat Log */}
        <aside className="w-[28%] min-w-[280px] max-w-[360px] bg-gradient-to-b from-[#0d0e11] to-[#0a0b0e] border-r border-white/5 flex flex-col relative">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/[0.02] via-transparent to-transparent" />

          {/* Top Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3 text-gray-600" />
              <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
                CHAT (LEFT / SECONDARY)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1 rounded hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5 text-gray-600" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-gray-600" />
                )}
              </motion.button>
              <motion.button
                className="p-1 rounded hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* Activity Cards Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10">
            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-gray-700 mt-0.5">{">"}</span>
              <ActivityCard variant="user">
              <div className="space-y-1">
                <span className="text-gray-200">[User]</span>
                <div className="text-gray-400 pl-0">
                  Edit the Combinator sign.
                  <br />
                  Change text to &quot;Kronos&quot;
                  <br />
                  and save as yc_kronos.
                </div>
              </div>
              </ActivityCard>
            </div>

            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-gray-700 mt-0.5">{">"}</span>
              <ActivityCard variant="assistant">
                <div className="space-y-1">
                  Assistant. Opening the kronos now
                </div>
              </ActivityCard>
            </div>

            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-gray-700 mt-0.5">{">"}</span>
              <ActivityCard variant="assistant">
                <div className="space-y-1">
                  <span className="text-gray-400">Understood. Opening the</span>
                  <span className="text-gray-400">now.</span>
                </div>
              </ActivityCard>
            </div>

            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-gray-700 mt-0.5">{">"}</span>
              <ActivityCard variant="action">
                <div className="space-y-1">
                  <span className="text-gray-500 text-[10px]">Example of tool use for this instance</span>
                  <div className="text-gray-500 pl-3 space-y-0.5 mt-1">
                    <div>• screenshot (Desktop)</div>
                    <div>• click (Photote Icon)</div>
                    <div>• type (Kronos')</div>
                    <div>• save_file (yc_roos)</div>
                  </div>
                </div>
              </ActivityCard>
            </div>

            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-gray-700 mt-0.5">{">"}</span>
              <ActivityCard variant="assistant">
                <div className="space-y-1">
                  <span className="text-gray-400">
                    {">"} {">"} [user chat with the kronos os
                  </span>
                </div>
              </ActivityCard>
            </div>
          </div>

          {/* Bottom Input Hint */}
          <div className="px-4 py-3 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-1.5 text-gray-700 text-xs">
              <span>{">"}</span>
              <span className="font-mono text-[10px]">{"_"}</span>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL - Live Desktop Preview */}
        <main className="flex-1 bg-[#0a0b0e] flex flex-col p-4">
          {/* Desktop Window Container */}
          <div className="flex-1 flex flex-col rounded-lg overflow-hidden border border-white/10 bg-[#0d0e11] shadow-2xl">
            {/* Window Header Bar */}
            <div className="h-8 bg-[#12141a] border-b border-white/5 flex items-center px-3 gap-3 flex-shrink-0">
              {/* Traffic Light Buttons */}
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70 border border-red-400/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70 border border-yellow-400/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70 border border-green-400/20" />
              </div>

              {/* Window Title */}
              <div className="flex-1 text-center">
                <span className="text-[11px] text-gray-500 font-medium tracking-wider">
                  ✕ {getWindowTitle()}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-[10px] text-gray-600">
                <span className="text-gray-600">BYTEBOT CONTROLLER</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
              </div>
            </div>

            {/* Desktop Content Area */}
            <div className="flex-1 w-full bg-[#0a0b0e] relative overflow-hidden">
              {primaryControllerId === "local-screen" ? (
                <LocalScreenViewer />
              ) : primaryControllerId === "os-ai" ? (
                <UITARSViewer controllerType={primaryControllerId} viewOnly={isPaused} />
              ) : primaryControllerId === "gbox-android" ? (
                <GboxAndroidView />
              ) : (
                <VncViewer viewOnly={isPaused} controllerType={vncControllerType} directUrl={currentDirectUrl} />
              )}

              {/* Dock at Bottom */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 px-3 py-2 rounded-2xl bg-[#12141a]/80 backdrop-blur-xl border border-white/10 shadow-lg">
                {["🔍", "🖇", "🌐", "📝", "⚙️", "📦", "💻", "🎨", "📊"].map((icon, i) => (
                  <motion.div
                    key={i}
                    className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center cursor-pointer text-sm hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {icon}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* NAVIGATION BAR - Thin, quiet */}
      <nav className="h-10 flex items-center justify-between px-6 border-t border-white/5 bg-[#0a0b0e]/50">
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => item.id === "web" && handleOpenWeb()}
              className={`text-xs transition-all font-medium ${
                item.active ? "text-white" : "text-gray-500 hover:text-gray-400"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-600">/desktop</span>
        </div>
      </nav>

      {/* BOTTOM CONTROL BAR - System state */}
      <div className="h-12 flex items-center px-4 gap-4 bg-[#0a0b0e]/80 border-t border-white/5">
        {/* Left - Dropdowns */}
        <div className="flex items-center gap-3">
          <ControllerDropdown
            controllerOptions={controllerOptions}
            activeControllerIds={activeControllerIds}
            toggleController={toggleController}
          />
          <span className="text-gray-700">|</span>
          <ModelSelector
            selectedModel={selectedModel}
            models={models}
            onSelect={handleModelChange}
          />
        </div>

        {/* Center - Command Input */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleCommandSubmit} className="relative">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full h-8 px-3 pr-8 rounded bg-white/5 border border-white/10 text-xs text-gray-300 placeholder-gray-700 outline-none focus:bg-white/10 focus:border-white/20 transition-all"
            />
            <motion.button
              type="submit"
              disabled={!commandInput.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-600 disabled:opacity-20 transition-opacity"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </form>
        </div>

        {/* Right - Brand & Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <motion.button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-gray-500 hover:text-gray-400 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🌐</span>
            <span>Desktop Selector</span>
            <ChevronDown className="w-3 h-3" />
          </motion.button>

          <div className="w-px h-4 bg-white/10" />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-white bg-gradient-to-br from-purple-500 to-blue-500 px-2 py-1 rounded">
              K
            </span>
            <span className="text-xs text-gray-400 font-medium">KRONOS-OS</span>
          </div>

          <motion.button
            className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">✦</span>
          </motion.button>
        </div>
      </div>

      {/* Hidden Components */}
      <ToolTraceSlideshow
        traces={(traceEntries as never)}
        taskTitle="Task Execution"
        isVisible={showToolSlideshow}
        onClose={() => setShowToolSlideshow(false)}
      />

      <OrganizedChatPanel
        isOpen={false}
        onClose={() => {}}
        messages={[]}
        onSendMessage={handleSend}
        isProcessing={isLoading}
      />
    </div>
  );
}
