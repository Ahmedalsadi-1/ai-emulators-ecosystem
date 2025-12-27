"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { VncViewer } from "@/components/vnc/VncViewer";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { fetchModels, startTask } from "@/utils/taskUtils";
import { openDesktopApplication } from "@/utils/desktopUtils";
import type { Model } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Mic,
  Monitor,
  Search,
  Send,
  Settings,
  EyeOff,
  SlidersHorizontal,
  Terminal,
} from "lucide-react";

const navTabs = ["Desktop View", "Web", "Models", "Taskbar", "Settings"];

type ModelLog = {
  time: string;
  message: string;
};

function BunnyIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] dark:text-white"
      aria-hidden="true"
    >
      <circle cx="32" cy="36" r="18" fill="currentColor" opacity="0.9" />
      <ellipse
        cx="22"
        cy="12"
        rx="6"
        ry="12"
        fill="currentColor"
        opacity="0.9"
      />
      <ellipse
        cx="42"
        cy="12"
        rx="6"
        ry="12"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="26" cy="34" r="2.5" fill="#0f172a" />
      <circle cx="38" cy="34" r="2.5" fill="#0f172a" />
      <circle cx="32" cy="40" r="2" fill="#0f172a" />
    </svg>
  );
}

type ControlPillProps = {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
};

function ControlPill({ label, icon, onClick, active }: ControlPillProps) {
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
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [modelQuery, setModelQuery] = useState("");
  const [logQuery, setLogQuery] = useState("");
  const [logs, setLogs] = useState<ModelLog[]>([]);
  const [command, setCommand] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      const result = await fetchModels();
      if (!isMounted) return;
      setModels(result);

      const storedModel = window.localStorage.getItem("bytebot:model");
      const stored =
        storedModel &&
        result.find(
          (model) =>
            model.name === storedModel || model.title === storedModel,
        );
      const fallback = stored || result[0] || null;
      setSelectedModel(fallback);
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedModel) return;
    window.localStorage.setItem(
      "bytebot:model",
      selectedModel.name || selectedModel.title,
    );
    setLogs((prev) => {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const entry = {
        time,
        message: `Bytebot now using ${selectedModel.title}`,
      };
      return [entry, ...prev].slice(0, 12);
    });
  }, [selectedModel?.name, selectedModel?.title]);

  const filteredModels = useMemo(() => {
    if (!modelQuery.trim()) return models;
    const query = modelQuery.toLowerCase();
    return models.filter(
      (model) =>
        model.title.toLowerCase().includes(query) ||
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query),
    );
  }, [modelQuery, models]);

  const filteredLogs = useMemo(() => {
    if (!logQuery.trim()) return logs;
    const query = logQuery.toLowerCase();
    return logs.filter((log) => log.message.toLowerCase().includes(query));
  }, [logQuery, logs]);

  const isDark = resolvedTheme === "dark";

  const handleModelChange = (modelName: string) => {
    const match = models.find((model) => model.name === modelName);
    if (match) {
      setSelectedModel(match);
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!command.trim() || !selectedModel) return;

    setIsSending(true);
    try {
      await startTask({
        description: command,
        model: selectedModel,
      });
      setCommand("");
      setLogs((prev) => {
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return [
          { time, message: `Task queued with ${selectedModel.title}` },
          ...prev,
        ].slice(0, 12);
      });
    } finally {
      setIsSending(false);
    }
  };

  const providerBadge = (provider: string) => {
    const cloudProviders = ["openai", "anthropic", "google", "proxy"];
    return cloudProviders.includes(provider.toLowerCase()) ? "Cloud" : "Local";
  };

  const handleToggleTerminal = () => {
    if (!showTerminal) {
      void openDesktopApplication("terminal");
    }
    setShowTerminal((prev) => !prev);
  };

  const handleOpenWeb = () => {
    router.push("/web");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_rgba(186,220,255,0.65),_transparent_60%),linear-gradient(180deg,_#f4f7ff_0%,_#e9f1ff_55%,_#e2ecf7_100%)] text-slate-700 dark:bg-[radial-gradient(1200px_circle_at_top,_rgba(56,189,248,0.22),_transparent_60%),linear-gradient(180deg,_#05070d_0%,_#0b1220_55%,_#0a0f1a_100%)] dark:text-slate-100">
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/60" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-size:14px_14px] [background-image:radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.2)_1px,_transparent_0)] dark:opacity-20" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          <div className="rounded-xl border border-white/60 bg-white/45 p-4 shadow-[0_30px_80px_rgba(148,163,184,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/70 bg-white/50 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300/40" />
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                {navTabs.map((tab) => {
                  const active = tab === "Desktop View";
                  return (
                    <button
                      key={tab}
                      className={`rounded-md px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${
                        active
                          ? "bg-white/80 text-slate-600 shadow-[0_0_16px_rgba(56,189,248,0.3)] dark:bg-white/10 dark:text-slate-100"
                          : "text-slate-400 hover:bg-white/70 hover:text-slate-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border border-white/70 bg-white/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
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
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>

                <div className="flex items-center rounded-md border border-white/70 bg-white/70 p-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`rounded-md px-3 py-1 transition-all ${
                      mounted && !isDark
                        ? "bg-white text-slate-600 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        : "text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`rounded-md px-3 py-1 transition-all ${
                      mounted && isDark
                        ? "bg-white/20 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                        : "text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
              <div className="rounded-xl border border-white/70 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                  <span>Available Models</span>
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={modelQuery}
                    onChange={(event) => setModelQuery(event.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-md border border-white/70 bg-white/70 py-2 pl-10 pr-3 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  />
                </div>
                <div className="mt-4 flex max-h-[420px] flex-col gap-3 overflow-auto pr-1">
                  {filteredModels.length === 0 && (
                    <div className="text-xs text-slate-400 dark:text-slate-300">
                      No models available.
                    </div>
                  )}
                  {filteredModels.map((model) => {
                    const isActive = selectedModel?.name === model.name;
                    return (
                      <button
                        key={model.name}
                        onClick={() => setSelectedModel(model)}
                        className={`rounded-lg border px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all ${
                          isActive
                            ? "border-sky-200/80 bg-white/80 text-slate-600 shadow-[0_0_18px_rgba(56,189,248,0.25)] dark:border-sky-400/40 dark:bg-white/10 dark:text-slate-100"
                            : "border-white/60 bg-white/55 text-slate-500 hover:bg-white/80 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {model.title}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-400">
                              {model.provider}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                        <span className="mt-3 inline-flex items-center rounded-md border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                          {providerBadge(model.provider)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-white/70 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
                    Live Desktop View
                  </div>
                  <div className="mt-4 overflow-hidden rounded-lg border border-white/60 bg-white/50 dark:border-white/10 dark:bg-white/5">
                    <div className="aspect-[4/3] w-full">
                      <VncViewer viewOnly={false} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/70 bg-white/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <form
                    onSubmit={handleSend}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <div className="flex flex-1 items-center gap-3 rounded-md border border-white/70 bg-white/70 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-white/10">
                      <BunnyIcon />
                      <input
                        value={command}
                        onChange={(event) => setCommand(event.target.value)}
                        placeholder="What can I help you with?"
                        className="flex-1 bg-transparent text-sm text-slate-500 focus:outline-none dark:text-slate-200"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-white/70 bg-white/70 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={isSending || !command.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-white/70 bg-white/80 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <ControlPill
                        label="Select Screen"
                        icon={<Monitor className="h-4 w-4" />}
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
                        label="Settings"
                        icon={<Settings className="h-4 w-4" />}
                      />
                    </div>
                    <button className="flex items-center gap-2 rounded-md border border-white/70 bg-white/70 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
                      <EyeOff className="h-4 w-4" />
                      Hide Bytebot
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                    <span className="rounded-md border border-white/70 bg-white/70 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10">
                      Warped Turbo
                    </span>
                    <span className="rounded-md border border-white/70 bg-white/70 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10">
                      SMEP Call
                    </span>
                  </div>
                </div>

                {showTerminal && (
                  <TerminalPanel onClose={() => setShowTerminal(false)} />
                )}
              </div>

              <div className="rounded-xl border border-white/70 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                  <span>LLM Logs</span>
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={logQuery}
                    onChange={(event) => setLogQuery(event.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-md border border-white/70 bg-white/70 py-2 pl-10 pr-3 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  />
                </div>
                <div className="mt-4 flex max-h-[420px] flex-col gap-3 overflow-auto pr-1">
                  {filteredLogs.length === 0 && (
                    <div className="text-xs text-slate-400 dark:text-slate-300">
                      No logs yet.
                    </div>
                  )}
                  {filteredLogs.map((log, index) => (
                    <div
                      key={`${log.time}-${index}`}
                      className="rounded-lg border border-white/70 bg-white/70 px-3 py-3 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                        {log.time}
                      </div>
                      <p className="mt-1">{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
