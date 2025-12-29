"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { VncViewer } from "@/components/vnc/VncViewer";
import { fetchModels, connectBrowserOSSimple } from "@/utils/taskUtils";
import { useQuickTaskSession } from "@/hooks/useQuickTaskSession";
import type { Model } from "@/types";
import { ChevronDown, MessageSquarePlus, Pause, Play, Plus, Send } from "lucide-react";

type PanelTab = "code" | "agent";

type WorkspaceOption = {
  id: string;
  label: string;
  screen: 'debian' | 'kali';
};

const defaultWorkspaces: WorkspaceOption[] = [
  { id: "browseros-1", label: "BrowserOS 1", screen: "debian" },
  { id: "browseros-2", label: "BrowserOS 2", screen: "kali" },
];

export default function WebPage() {
  const [activePanel, setActivePanel] = useState<PanelTab>("agent");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>(
    defaultWorkspaces,
  );
  const [activeWorkspace, setActiveWorkspace] = useState<string>(
    defaultWorkspaces[0].id,
  );
  const [isBrowserOSConnected, setIsBrowserOSConnected] = useState(false); // Start disconnected
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionWarnings, setConnectionWarnings] = useState<string[]>([]);
  const [showNewWorkspaceDropdown, setShowNewWorkspaceDropdown] = useState(false);
  const [newWorkspaceScreen, setNewWorkspaceScreen] = useState<'debian' | 'kali'>('debian');

  // Derive current screen from active workspace
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  const currentScreen = currentWorkspace?.screen || 'debian';

  // Load workspaces and active workspace from localStorage
  useEffect(() => {
    const savedWorkspaces = localStorage.getItem('bytebot:web:workspaces');
    const savedActiveWorkspace = localStorage.getItem('bytebot:web:activeWorkspace');

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
    localStorage.setItem('bytebot:web:workspaces', JSON.stringify(workspaces));
    localStorage.setItem('bytebot:web:activeWorkspace', activeWorkspace);
  }, [workspaces, activeWorkspace]);

  const {
    messages,
    logs,
    isLoading,
    currentTaskId,
    taskStatus,
    sendMessage,
    clearMessages,
    clearLogs,
    addLog,
    resetSession,
  } = useQuickTaskSession({ storageKey: "bytebot:webTask" });

  const isConnected = isBrowserOSConnected;

  const connectWithRetry = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      addLog(`Connecting to BrowserOS (attempt ${attempt}/${retries})...`);
      setConnectionError(null);
      setConnectionWarnings([]);
      try {
        const result = await connectBrowserOSSimple();
        if (result?.success) {
          setIsBrowserOSConnected(true);
          setConnectionError(null);
          // Parse warnings from message if present
          const message = result.message || '';
          const warnings: string[] = [];
          if (message.includes('warnings:')) {
            const warningsPart = message.split('warnings:')[1]?.trim();
            if (warningsPart) {
              warnings.push(...warningsPart.split(', '));
            }
          }
          setConnectionWarnings(warnings);
          addLog(`BrowserOS connected successfully${warnings.length > 0 ? ` (${warnings.join(', ')})` : ''}`);
          return;
        } else {
          const errorMsg = result?.message || "Failed to connect to BrowserOS";
          if (attempt === retries) {
            setConnectionError(errorMsg);
            setIsBrowserOSConnected(false);
            addLog(`Failed to connect to BrowserOS after ${retries} attempts: ${errorMsg}`);
          } else {
            addLog(`BrowserOS connection attempt ${attempt} failed: ${errorMsg}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while connecting to BrowserOS';
        if (attempt === retries) {
          setConnectionError(errorMsg);
          setIsBrowserOSConnected(false);
          addLog(`Failed to connect to BrowserOS after ${retries} attempts: ${errorMsg}`);
        } else {
          addLog(`BrowserOS connection attempt ${attempt} failed: ${errorMsg}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

      const loadModels = async () => {
        // Load models only
        const result = await fetchModels();
        if (!isMounted) return;
        const storedModel = window.localStorage.getItem("bytebot:model");
        const stored =
          storedModel &&
          result.find(
            (model) => model.name === storedModel || model.title === storedModel,
          );
        const fallback = stored || result[0] || null;
        setSelectedModel(fallback);
      };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim() || !selectedModel) return;
    const message = prompt.trim();
    setPrompt("");
    await sendMessage(message, selectedModel);
  };

  const handleNewChat = () => {
    resetSession();
    addLog("Started new chat session");
  };

  const handleToggleConnection = async () => {
    if (isConnected) {
      setIsBrowserOSConnected(false);
      setConnectionError(null);
      setConnectionWarnings([]);
      addLog("BrowserOS disconnected");
      return;
    }

    await connectWithRetry();
  };

  const handleClearPanel = () => {
    if (activePanel === "agent") {
      clearMessages();
      return;
    }

    clearLogs();
  };

  const handleAddWorkspace = (screen: 'debian' | 'kali') => {
    setWorkspaces((prev) => {
      const nextIndex = prev.length + 1;
      const newWorkspace = {
        id: `browseros-${nextIndex}`,
        label: `BrowserOS ${nextIndex}`,
        screen,
      };
      return [...prev, newWorkspace];
    });
  };

  const handlePause = () => {
    addLog("Playback paused");
  };

  const handlePlay = () => {
    addLog("Playback resumed");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_rgba(186,220,255,0.65),_transparent_60%),linear-gradient(180deg,_#f3f6ff_0%,_#e8f0ff_55%,_#e1eaf6_100%)] text-slate-700 dark:bg-[radial-gradient(1200px_circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),linear-gradient(180deg,_#05070d_0%,_#0b1220_55%,_#0a0f1a_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-size:14px_14px] [background-image:radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.2)_1px,_transparent_0)] dark:opacity-20" />

      <FloatingNav />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          <div className="rounded-xl border border-white/70 bg-white/60 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.3)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/70 bg-slate-900/90 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:border-white/10 dark:bg-white/10">
              <div className="flex items-center gap-2">
                {(["code", "agent"] as PanelTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePanel(tab)}
                    className={`rounded-md px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
                      activePanel === tab
                        ? "bg-white text-slate-800"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {tab === "code" ? "Code" : "Agent"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
                <span className="text-white/70">
                  {isConnected ? "Connected" : "Offline"}
                </span>
                {taskStatus && (
                  <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-white/80">
                    {taskStatus}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleToggleConnection}
                  className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-white/80 transition-all hover:bg-white/20"
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
              {connectionError && (
                <div className="mt-2 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-[10px] text-red-200">
                  <div className="font-semibold">Connection Error:</div>
                  <div>{connectionError}</div>
                </div>
              )}
              {connectionWarnings.length > 0 && (
                <div className="mt-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 text-[10px] text-yellow-200">
                  <div className="font-semibold">Connection Warnings:</div>
                  <ul className="list-disc list-inside mt-1">
                    {connectionWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
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

                  <div className="mt-4 h-[340px] space-y-2 overflow-auto pr-1">
                    {activePanel === "agent" && messages.length === 0 && (
                      <div className="text-xs text-slate-400 dark:text-slate-300">
                        No agent messages yet.
                      </div>
                    )}
                    {activePanel === "code" && logs.length === 0 && (
                      <div className="text-xs text-slate-400 dark:text-slate-300">
                        No code logs yet.
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

                  <form
                    onSubmit={handleSend}
                    className="mt-4 flex items-center gap-2"
                  >
                    <input
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Send a BrowserOS request"
                      className="flex-1 rounded-md border border-white/70 bg-white/80 px-3 py-2 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !prompt.trim() || !selectedModel}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/70 bg-white/80 text-slate-500 transition-all hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    Playback
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePause}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/70 bg-white/70 text-slate-500 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePlay}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/70 bg-white/70 text-slate-500 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <span className="ml-2 rounded-md border border-white/70 bg-white/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      ByteDance-Seed/UI-TARS
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    <span>BrowserOS View</span>
                    <span className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      Workspace
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
                               onChange={(e) => setNewWorkspaceScreen(e.target.value as 'debian' | 'kali')}
                               className="w-full rounded border border-white/70 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-white/5"
                             >
                               <option value="debian">Debian (Bytebot Desktop)</option>
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
                     <button
                       type="button"
                       onClick={handleNewChat}
                       className="flex items-center gap-2 rounded-md border border-white/70 bg-white/70 px-3 py-1.5 text-slate-400 hover:bg-white hover:text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                     >
                       <MessageSquarePlus className="h-3 w-3" />
                       New Chat
                     </button>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-md border border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                    <div className="aspect-video w-full">
                      <VncViewer
                        viewOnly={false}
                        proxyPath={currentScreen === "kali" ? "/api/proxy/kali-websockify" : "/api/proxy/websockify"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
