"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { fetchModels, connectBrowserOSSimple } from "@/utils/taskUtils";
import { useQuickTaskSession } from "@/hooks/useQuickTaskSession";
import type { Model } from "@/types";
import { ChevronDown, MessageSquarePlus, Pause, Play, Plus, Send } from "lucide-react";
import { KronosLogo } from "@/components/branding/KronosLogo";

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
  const embedUrl =
    currentScreen === 'kali'
      ? process.env.NEXT_PUBLIC_BROWSEROS_WEB_URL_KALI || process.env.NEXT_PUBLIC_BROWSEROS_WEB_URL
      : process.env.NEXT_PUBLIC_BROWSEROS_WEB_URL;
  const isElectron = typeof window !== "undefined" && Boolean((window as any).electronAPI);
  const WebViewTag = "webview" as any;

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
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0c] text-[#e6e6e6]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_top,_rgba(42,42,42,0.35),_transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_bottom,_rgba(16,16,16,0.8),_transparent_70%)]" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="rounded-xl border border-white/10 bg-[#141417]/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_40px_90px_rgba(0,0,0,0.65)]">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#1b1c1e]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#e6e6e6]">
                  <KronosLogo size={64} className="h-10 w-auto" />
                  KRON-WEB
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b0b0b0]">
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
                        <div className="p-2 text-[11px] text-[#b6b6b6]">
                          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a9a9a]">
                            Screen Type
                          </label>
                          <select
                            value={newWorkspaceScreen}
                            onChange={(e) => setNewWorkspaceScreen(e.target.value as 'debian' | 'kali')}
                            className="w-full rounded border border-white/10 bg-[#111214] px-2 py-1 text-[11px] text-[#d0d0d0]"
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
                            className="mt-2 w-full rounded border border-white/10 bg-[#2a2b2e] px-2 py-1 text-[11px] font-semibold text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                          >
                            Create Workspace
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a9a9a]">
                <span>{isConnected ? "Connected" : "Offline"}</span>
                {taskStatus && (
                  <span className="rounded-md border border-white/10 bg-[#1a1b1d] px-2 py-1 text-[#c7c7c7]">
                    {taskStatus}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleToggleConnection}
                  className="rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1 text-[#c7c7c7] transition-all hover:bg-[#222327]"
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>

            {(connectionError || connectionWarnings.length > 0) && (
              <div className="mt-3 grid gap-2">
                {connectionError && (
                  <div className="rounded-md border border-[#3b2a2a] bg-[#1a1414] px-3 py-2 text-[11px] text-[#d5bcbc]">
                    <div className="font-semibold uppercase tracking-[0.18em] text-[#b9a7a7]">
                      Connection Error
                    </div>
                    <div>{connectionError}</div>
                  </div>
                )}
                {connectionWarnings.length > 0 && (
                  <div className="rounded-md border border-[#3a3526] bg-[#191612] px-3 py-2 text-[11px] text-[#d0c7b3]">
                    <div className="font-semibold uppercase tracking-[0.18em] text-[#b7ae9a]">
                      Connection Warnings
                    </div>
                    <ul className="mt-1 list-disc list-inside">
                      {connectionWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9a9a9a]">
                    <span>Kron-Web View</span>
                    <span className="rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1 text-[10px] text-[#c0c0c0]">
                      {currentScreen.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-md border border-white/10 bg-[#0f1012] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="aspect-video w-full">
                      {embedUrl ? (
                        isElectron ? (
                          <WebViewTag
                            src={embedUrl}
                            className="h-full w-full"
                            allowpopups="true"
                          />
                        ) : (
                          <iframe
                            src={embedUrl}
                            className="h-full w-full"
                            title="BrowserOS"
                            allow="clipboard-read; clipboard-write; fullscreen"
                          />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#9a9a9a]">
                          Set <span className="mx-1 rounded bg-[#1a1b1d] px-2 py-1 text-[#d0d0d0]">NEXT_PUBLIC_BROWSEROS_WEB_URL</span>
                          (and optionally <span className="mx-1 rounded bg-[#1a1b1d] px-2 py-1 text-[#d0d0d0]">NEXT_PUBLIC_BROWSEROS_WEB_URL_KALI</span>)
                          to embed BrowserOS directly in this tab.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9a9a9a]">
                    Playback
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePause}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#1a1b1d] text-[#c7c7c7] transition-all hover:bg-[#222327]"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePlay}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#1a1b1d] text-[#c7c7c7] transition-all hover:bg-[#222327]"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <span className="ml-2 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a8a8a8]">
                      {selectedModel?.title || selectedModel?.name || "Model"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-white/10 bg-[#17181b]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a6a6a6]">
                    <div className="flex items-center gap-2">
                      {(["code", "agent"] as PanelTab[]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActivePanel(tab)}
                          className={`rounded-md border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all ${
                            activePanel === tab
                              ? "border-white/15 bg-[#2a2b2e] text-[#f3f3f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                              : "border-white/10 bg-[#1a1b1d] text-[#9a9a9a] hover:bg-[#222327] hover:text-[#d0d0d0]"
                          }`}
                        >
                          {tab === "code" ? "Code" : "Agent"}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearPanel}
                      className="rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a9a9a] transition-all hover:bg-[#222327] hover:text-[#d0d0d0]"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="mt-4 h-[420px] space-y-2 overflow-auto pr-1">
                    {activePanel === "agent" && messages.length === 0 && (
                      <div className="text-xs text-[#8f8f8f]">No agent messages yet.</div>
                    )}
                    {activePanel === "code" && logs.length === 0 && (
                      <div className="text-xs text-[#8f8f8f]">No code logs yet.</div>
                    )}

                    {activePanel === "agent" &&
                      messages.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-md border border-white/10 bg-[#1b1c1e] px-2 py-2 text-[11px] text-[#cfcfcf] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        >
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#9a9a9a]">
                            <span>{entry.role === "USER" ? "You" : "Bytebot"}</span>
                            <span>{entry.time}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-line text-[12px] leading-snug text-[#d8d8d8]">
                            {entry.text}
                          </p>
                        </div>
                      ))}

                    {activePanel === "code" &&
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-md border border-white/10 bg-[#1b1c1e] px-2 py-2 text-[11px] text-[#cfcfcf] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        >
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#9a9a9a]">
                            <span>Log</span>
                            <span>{log.time}</span>
                          </div>
                          <p className="mt-1 text-[12px] leading-snug text-[#d8d8d8]">
                            {log.message}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#1b1c1e]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <form onSubmit={handleSend} className="flex flex-1 items-center gap-2">
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Send a Kron-Web request"
                  className="flex-1 rounded-md border border-white/10 bg-[#101113] px-3 py-2 text-xs text-[#d4d4d4] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim() || !selectedModel}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#1a1b1d] text-[#c7c7c7] transition-all hover:bg-[#222327] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <button
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-[#1a1b1d] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b0b0b0] transition-all hover:bg-[#222327]"
              >
                <MessageSquarePlus className="h-3 w-3" />
                New Chat
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
