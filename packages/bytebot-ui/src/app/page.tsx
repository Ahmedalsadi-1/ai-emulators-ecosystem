"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { fetchModels, startTask } from "@/utils/taskUtils";
import type { Model } from "@/types";
import {
  ChevronRight,
  ListTodo,
  Monitor,
  Moon,
  Settings,
  Signal,
  Sun,
} from "lucide-react";
import { KronosLogo } from "@/components/branding/KronosLogo";

// Electron API types are defined in @/types/electron.d.ts

export default function Home() {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !window.electronAPI) return;
    window.electronAPI.expandToTab("home");
  }, [isMounted]);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      // Add delay for Electron compatibility
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Loading models...");
      try {
        const result = await fetchModels();
        if (!isMounted) return;

        console.log("Loaded models:", result.length);
        setModels(result);
        setModelsError(null);

        const storedModel = window.localStorage.getItem("bytebot:model");
        const stored =
          storedModel &&
          result.find(
            (model) =>
              model.name === storedModel || model.title === storedModel,
          );

        if (stored) {
          setSelectedModel(stored);
        } else if (result.length > 0) {
          setSelectedModel(result[0]);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
        setModelsError("Failed to load models. Please check your connection.");
        setModels([]);
        setSelectedModel(null);
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const queueTask = async (taskCommand: string) => {
    if (!selectedModel) return;

    setIsSending(true);

    try {
      window.localStorage.setItem("bytebot:model", selectedModel.name);
      await startTask({
        description: taskCommand,
        model: selectedModel,
      });
      setCommand("");
    } catch (error) {
      console.error("Failed to start task:", error);
    }

    setIsSending(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await queueTask(command);
  };

  const handleModelChange = (modelName: string) => {
    const model = models.find((m) => m.name === modelName);
    setSelectedModel(model || null);
  };

  const handleQuickAction = async (action: string) => {
    setCommand(action);
    await queueTask(action);
  };

  const handleExpand = async (tab: string) => {
    setIsExpanded(true);
    // Navigate to the appropriate route
    router.push(`/${tab}`);
    if (window.electronAPI) {
      await window.electronAPI.expandToTab(tab);
    }
  };

  const handleHome = async () => {
    setIsExpanded(false);
    if (window.electronAPI) {
      await window.electronAPI.expandToTab("home");
    }
  };

  const canSend = Boolean(selectedModel) && !isSending;
  const canSubmit = canSend && Boolean(command.trim());

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f3f3f3] via-[#ededed] to-[#e6e6e6] text-slate-900 dark:bg-gradient-to-b dark:from-[#0b0b0b] dark:via-[#0e0f12] dark:to-[#0a0b0e] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-size:52px_52px] [background-image:linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.08)_1px,transparent_1px)] dark:opacity-20 dark:[background-image:linear-gradient(90deg,rgba(248,250,252,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(248,250,252,0.05)_1px,transparent_1px)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`w-full ${isExpanded ? "max-w-6xl" : "max-w-4xl"} transition-all duration-300`}
        >
          <div
            className={`relative border-2 border-slate-300/80 bg-[#f1f1f1] shadow-[0_18px_45px_rgba(15,23,42,0.2)] dark:border-slate-700/60 dark:bg-[#121316] ${isExpanded ? "p-7" : "p-5"} rounded-2xl`}
          >
            <div
              className={`border border-slate-300/70 bg-[#f9f9f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-700/50 dark:bg-[#0e1013] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${isExpanded ? "p-6" : "p-4"} rounded-xl`}
            >
              <div className="flex flex-col gap-5">
                <div className="rounded-md border border-slate-300/70 bg-[#f0f0f0] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-700/60 dark:bg-[#14161a]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
                      <KronosLogo size={64} className="h-10 w-auto" />
                      KRONOS-OS
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                      {[
                        { id: "home", label: "Home" },
                        { id: "tasks", label: "Tasks" },
                        { id: "desktop", label: "Desktop" },
                        { id: "web", label: "Web" },
                        { id: "settings", label: "Settings" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            tab.id === "home" ? handleHome() : handleExpand(tab.id)
                          }
                          className={`rounded-md border px-3 py-1 transition-all ${
                            tab.id === "home"
                              ? "border-slate-400/80 bg-white text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-500/60 dark:bg-[#1a1c20] dark:text-white"
                              : "border-slate-300/70 bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800 dark:border-slate-700/60 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-md border border-slate-300/70 bg-white/80 p-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700/60 dark:bg-[#1a1c20] dark:text-slate-300">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={`flex items-center gap-1 rounded px-2 py-1 transition-all ${
                            isMounted && theme === "light"
                              ? "bg-slate-900 text-white"
                              : "hover:bg-slate-200/70 dark:hover:bg-white/10"
                          }`}
                        >
                          <Sun className="h-3 w-3" />
                          Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={`flex items-center gap-1 rounded px-2 py-1 transition-all ${
                            isMounted && theme === "dark"
                              ? "bg-slate-900 text-white"
                              : "hover:bg-slate-200/70 dark:hover:bg-white/10"
                          }`}
                        >
                          <Moon className="h-3 w-3" />
                          Dark
                        </button>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300/70 bg-white/80 text-slate-500 dark:border-slate-700/60 dark:bg-[#1a1c20] dark:text-slate-300">
                        <Signal className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500 dark:text-slate-300">
                      What do you want to
                    </p>
                    <h1
                      className={`font-semibold uppercase tracking-[0.22em] text-slate-900 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)] dark:text-slate-100 ${
                        isExpanded ? "text-4xl" : "text-3xl"
                      }`}
                    >
                      Automate?
                    </h1>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                      Tell Kronos what you need, and watch it happen
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <form onSubmit={handleSubmit} className="w-full">
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-300/70 bg-white/80 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-700/60 dark:bg-[#1b1d22]">
                        <input
                          type="text"
                          placeholder="Describe what you want to automate"
                          className="flex-1 bg-transparent px-2 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                          value={command}
                          onChange={(e) => setCommand(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:border-slate-700/60 dark:bg-[#111319] dark:text-slate-200">
                            <span>Model</span>
                            <select
                              className="bg-transparent text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 focus:outline-none dark:text-slate-200"
                              value={selectedModel?.name || ""}
                              onChange={(e) => handleModelChange(e.target.value)}
                            >
                              <option value="">Select</option>
                              {models.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex items-center gap-2 rounded-md border border-slate-400/70 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600/70 dark:bg-[#111319] dark:text-slate-200 dark:hover:bg-[#1b1d22]"
                          >
                            Auto <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                        {modelsError ? (
                          <span className="text-red-500">Models error</span>
                        ) : models.length > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Models ready ({models.length})
                          </span>
                        ) : (
                          <span className="text-amber-500">Loading models...</span>
                        )}
                      </div>
                    </form>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "Open my email",
                        "Schedule a meeting",
                        "Organize downloads",
                        "Set up development environment",
                      ].map((action) => (
                        <button
                          key={action}
                          onClick={() => handleQuickAction(action)}
                          disabled={isSending}
                          className="rounded-md border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-[#15171c] dark:text-slate-300 dark:hover:bg-[#1e2026]"
                        >
                          {action}
                        </button>
                      ))}
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
