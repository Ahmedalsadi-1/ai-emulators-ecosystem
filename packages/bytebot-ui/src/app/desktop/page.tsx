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
  Activity,
  Terminal,
  Command,
  Cpu,
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-white transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="truncate max-w-[120px]">{selectedModel?.title || "Select model"}</span>
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
              className="absolute bottom-full left-0 mb-1 w-64 rounded-lg overflow-hidden z-50 bg-[#1a1c22]/95 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              <div className="p-2 border-b border-white/5">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none"
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-white transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Cpu className="w-3 h-3" />
        <span>{activeLabel}</span>
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
              className="absolute bottom-full left-0 mb-1 w-44 rounded-lg overflow-hidden z-50 bg-[#1a1c22]/95 backdrop-blur-xl border border-white/10 shadow-xl"
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

function ChatCard({
  children,
  variant = "assistant",
}: {
  children: React.ReactNode;
  variant?: "user" | "assistant" | "action";
}) {
  const variants = {
    user: "bg-white/[0.03] border-white/5",
    assistant: "bg-purple-500/[0.03] border-purple-500/10",
    action: "bg-white/[0.02] border-white/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-3 border ${variants[variant]} mb-2 shadow-sm`}
    >
      {children}
    </motion.div>
  );
}

function ActionItem({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <Icon className="w-3.5 h-3.5 text-gray-500" />
      <span className="text-xs text-gray-400">{text}</span>
    </div>
  );
}

export default function DesktopPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const getModelKey = useCallback(
    (model: Model) => `${model.provider}:${model.name}`,
    []
  );
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
      } catch (error) {
        console.error("Failed to parse saved workspaces:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bytebot:desktop:workspaces", JSON.stringify(workspaces));
    localStorage.setItem("bytebot:desktop:activeWorkspace", activeWorkspace);
  }, [workspaces, activeWorkspace]);

  const addWorkspaceFromSession = useCallback(
    (session: DesktopSession) => {
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
    },
    []
  );

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
  }, [models, modelStorageKey]);

  useEffect(() => {
    if (!selectedModel) return;
    window.localStorage.setItem(modelStorageKey, getModelKey(selectedModel));
  }, [modelStorageKey, selectedModel?.name, selectedModel?.provider]);

  const getWindowTitle = () => {
    switch (activeWorkspace) {
      case "bytebot":
        return "Bytebot Desktop";
      case "debian":
        return "Debian";
      case "kali":
        return "Kali Linux";
      case "browseros":
        return "BrowserOS";
      default:
        return "Desktop";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-gray-300 font-sans flex flex-col">
      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat / Execution Log */}
        <aside className="w-[32%] min-w-[300px] max-w-[380px] bg-[#12141a]/80 backdrop-blur-xl border-r border-white/5 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Activity Log</span>
            </div>
            <motion.button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-gray-500" />
              )}
            </motion.button>
          </div>

          {/* Chat Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <ChatCard variant="user">
              <p className="text-xs text-gray-300 leading-relaxed">
                Open the terminal and check the current directory contents
              </p>
            </ChatCard>

            <ChatCard variant="assistant">
              <p className="text-xs text-gray-400 leading-relaxed">
                Opening terminal session...
              </p>
            </ChatCard>

            <ChatCard variant="action">
              <div className="space-y-1">
                <ActionItem icon={Terminal} text="Terminal opened" />
                <ActionItem icon={Command} text="ls -la" />
                <ActionItem icon={Activity} text="Reading directory contents..." />
              </div>
            </ChatCard>

            <ChatCard variant="assistant">
              <p className="text-xs text-gray-400 leading-relaxed">
                Found 12 items including config files and project directories
              </p>
            </ChatCard>
          </div>

          {/* Input Prompt Line */}
          <div className="px-4 py-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-xs">{`>`}</span>
              <input
                type="text"
                placeholder="Continue..."
                className="flex-1 bg-transparent text-xs text-gray-500 placeholder-gray-600 outline-none"
              />
            </div>
          </div>
        </aside>

        {/* Right Panel - Live Desktop Preview */}
        <main className="flex-1 flex flex-col bg-[#0d0e11]">
          {/* Desktop Window */}
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#1a1c22] shadow-2xl">
              {/* Window Header */}
              <div className="h-9 bg-[#1f2229] border-b border-white/5 flex items-center px-4 gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-red-400/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-yellow-400/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-green-400/20" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-500">{getWindowTitle()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
              </div>

              {/* Desktop Content */}
              <div className="h-[calc(100%-36px)] w-full bg-[#0d0e11] relative">
                {primaryControllerId === "local-screen" ? (
                  <LocalScreenViewer />
                ) : primaryControllerId === "os-ai" ? (
                  <UITARSViewer controllerType={primaryControllerId} viewOnly={isPaused} />
                ) : primaryControllerId === "gbox-android" ? (
                  <GboxAndroidView />
                ) : (
                  <VncViewer viewOnly={isPaused} controllerType={vncControllerType} directUrl={currentDirectUrl} />
                )}

                {/* macOS-style Dock */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 rounded-2xl bg-[#1a1c22]/80 backdrop-blur-xl border border-white/10">
                {["Finder", "Safari", "Terminal", "Code", "Notes"].map((app) => (
                  <motion.div
                    key={app}
                    className="w-10 h-10 rounded-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-[10px] text-gray-400">{app[0]}</span>
                  </motion.div>
                ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Navigation Bar */}
      <nav className="h-10 flex items-center justify-center gap-8 border-y border-white/5 bg-[#0d0e11]/50">
        {[
          { label: "Home", path: "/" },
          { label: "Tasks", path: "/tasks" },
          { label: "Desktop", path: "/desktop", active: true },
          { label: "Web", path: "/web" },
          { label: "Settings", path: "/settings" },
        ].map((item) => (
          <motion.button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`text-xs transition-all ${
              item.active ? "text-white font-medium" : "text-gray-500 hover:text-gray-300"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {item.label}
          </motion.button>
        ))}
      </nav>

      {/* System Control Bar */}
      <div className="h-12 flex items-center px-4 gap-4 bg-[#0d0e11]/80 border-t border-white/5">
        {/* Left - Dropdowns */}
        <div className="flex items-center gap-2">
          <ControllerDropdown
            controllerOptions={controllerOptions}
            activeControllerIds={activeControllerIds}
            toggleController={toggleController}
          />
           <ModelSelector
             selectedModel={selectedModel}
             models={models}
             onSelect={handleModelChange}
           />
        </div>

        {/* Center - Command Input */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleCommandSubmit} className="relative">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter command..."
              className="w-full h-8 px-4 pr-10 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 placeholder-gray-600 outline-none focus:bg-white/10 focus:border-white/20 transition-all"
            />
            <motion.button
              type="submit"
              disabled={!commandInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-3.5 h-3.5 text-gray-500" />
            </motion.button>
          </form>
        </div>

        {/* Right - Buttons & Brand */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleOpenWeb}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Open Web
          </motion.button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">K</span>
            </div>
            <span className="text-xs text-gray-400">Kronos-OS</span>
          </div>

          <motion.div
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm">✦</span>
          </motion.div>
        </div>
      </div>

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
