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

const FALLBACK_CHAIN: Model[] = [
  { provider: 'groq', name: 'llama-3.3-70b-versatile', title: 'Llama 3.3 70B (Fallback)', capabilities: { toolCalling: true, vision: false, streaming: true } },
  { provider: 'openai', name: 'o3-2025-04-16', title: 'o3 (Final Fallback)', capabilities: { toolCalling: true, vision: false, streaming: true } },
];

// Electron API types are defined in @/types/electron.d.ts

export default function Home() {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const getModelKey = (model: Model) => `${model.provider}:${model.name}`;
  const pickRoutewayDefault = (candidates: Model[]): Model | null =>
    candidates.find((model) => model.provider === "routeway" && model.capabilities?.toolCalling) ||
    candidates[0] ||
    null;

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
        // Filter to only tool-capable models for reliable tool usage
        const toolModels = result.filter((m) => m.capabilities?.toolCalling);
        const filteredModels = toolModels.filter((model) => model.provider !== "anthropic");
        console.log("Tool-capable models:", toolModels.length);
        setModels(filteredModels);
        setModelsError(null);

        const storedModel = window.localStorage.getItem("bytebot:model");
        const stored =
          storedModel &&
          filteredModels.find(
            (model) =>
              getModelKey(model) === storedModel ||
              model.name === storedModel ||
              model.title === storedModel,
          );

        if (stored) {
          setSelectedModel(stored);
        } else {
          const preferred =
            pickRoutewayDefault(filteredModels) ||
            pickRoutewayDefault(toolModels) ||
            result[0] ||
            null;
          setSelectedModel(preferred);
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
      window.localStorage.setItem("bytebot:model", getModelKey(selectedModel));
      await startTask({
        description: taskCommand,
        model: selectedModel,
      });
      setCommand("");
    } catch (error: any) {
      console.error("Failed to start task:", error);
      const shouldFallback = 
        selectedModel.provider === "routeway" && 
        [422, 429, 500, 502, 503, 504].includes(error.status);
      
      if (shouldFallback) {
        console.warn(`Routeway error (${error.status}), attempting fallback chain...`);
        let fallbackSuccess = false;
        
        for (let i = 0; i < FALLBACK_CHAIN.length; i++) {
          const fallback = FALLBACK_CHAIN[i];
          console.warn(`Trying fallback ${i + 1}/${FALLBACK_CHAIN.length}:`, fallback.provider, fallback.name);
          setFallbackActive(true);
          
          try {
            await startTask({
              description: taskCommand,
              model: fallback,
            });
            console.warn("Fallback successful:", fallback.name);
            setCommand("");
            fallbackSuccess = true;
            break;
          } catch (fallbackError: any) {
            console.warn(`Fallback ${fallback.name} failed:`, fallbackError.status || fallbackError.message);
            if (i === FALLBACK_CHAIN.length - 1) {
              console.error("All fallbacks exhausted:", fallbackError);
            }
          }
        }
        
        if (!fallbackSuccess) {
          console.error("All fallback models failed");
        }
      }
    }

    setIsSending(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await queueTask(command);
  };

  const handleModelChange = (modelKey: string) => {
    const model = models.find((m) => getModelKey(m) === modelKey);
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

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`w-full ${isExpanded ? "max-w-6xl" : "max-w-5xl"} transition-all duration-300`}
        >
          <div
            className={`relative border border-slate-300/80 bg-[#f1f1f1] shadow-[0_12px_30px_rgba(15,23,42,0.15)] dark:border-slate-700/60 dark:bg-[#1a1a1a] ${isExpanded ? "p-5" : "p-4"} rounded-lg`}
          >
            <div
              className={`border border-slate-300/70 bg-[#f9f9f9] dark:border-slate-700/50 dark:bg-[#151515] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${isExpanded ? "p-4" : "p-3"} rounded-md`}
            >
              <div className="flex flex-col gap-3">
                <div className="rounded-md border border-slate-300/70 bg-[#f0f0f0] px-3 py-2 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
                      <KronosLogo size={48} className="h-8 w-auto" />
                      KRONOS-OS
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
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
                          className={`rounded px-2 py-1 transition-all ${
                            tab.id === "home"
                              ? "border-slate-400/80 bg-slate-200 text-slate-800 dark:border-slate-600 dark:bg-[#2a2a2a] dark:text-white"
                              : "border-slate-300/70 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700/60 dark:text-slate-400 dark:hover:bg-[#2a2a2a] dark:hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded border border-slate-300/70 bg-white/80 p-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700/60 dark:bg-[#1e1e1e] dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={`flex items-center gap-1 rounded px-2 py-1 transition-all ${
                            isMounted && theme === "light"
                              ? "bg-slate-600 text-white"
                              : "hover:bg-slate-100 dark:hover:bg-[#2a2a2a]"
                          }`}
                        >
                          Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={`flex items-center gap-1 rounded px-2 py-1 transition-all ${
                            isMounted && theme === "dark"
                              ? "bg-slate-600 text-white"
                              : "hover:bg-slate-100 dark:hover:bg-[#2a2a2a]"
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-center">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      What do you want to
                    </p>
                    <h1
                      className={`font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-slate-100 ${
                        isExpanded ? "text-2xl" : "text-xl"
                      }`}
                    >
                      Automate?
                    </h1>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Tell Kronos what you need, and watch it happen
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <form onSubmit={handleSubmit} className="w-full">
                      <div className="flex flex-wrap items-center gap-2 rounded border border-slate-300/70 bg-white/80 px-3 py-2 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                        <input
                          type="text"
                          placeholder="Describe what you want to automate"
                          className="flex-1 bg-transparent px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-600 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                          value={command}
                          onChange={(e) => setCommand(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded border border-slate-300/70 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700/60 dark:bg-[#111319] dark:text-slate-200">
                            <span>Model</span>
                            <select
                              className="bg-transparent text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 focus:outline-none dark:text-slate-200"
                              value={selectedModel ? getModelKey(selectedModel) : ""}
                              onChange={(e) => handleModelChange(e.target.value)}
                            >
                              <option value="">Select</option>
                              {models.map((model) => (
                                <option key={getModelKey(model)} value={getModelKey(model)}>
                                  {model.title}
                                </option>
                              ))}
                            </select>
                          </div>
                           {fallbackActive && (
                            <div className="bg-amber-500/20 border border-amber-500/50 rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                              Using Fallback Chain
                            </div>
                          )}
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
