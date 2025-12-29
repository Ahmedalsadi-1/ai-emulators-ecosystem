"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { fetchModels, startTask } from "@/utils/taskUtils";
import type { Model } from "@/types";
import { ChevronRight, Monitor, ListTodo, Settings, Zap } from "lucide-react";

// Electron API types are defined in @/types/electron.d.ts

export default function Home() {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

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

  const canSend = Boolean(selectedModel) && !isSending;
  const canSubmit = canSend && Boolean(command.trim());

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_rgba(186,220,255,0.7),_transparent_60%),linear-gradient(180deg,_#f6f8ff_0%,_#edf3ff_52%,_#e4edf9_100%)] text-slate-700 dark:bg-[radial-gradient(1200px_circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),linear-gradient(180deg,_#05070d_0%,_#0b1220_55%,_#0a0f1a_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-size:14px_14px] [background-image:radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.2)_1px,_transparent_0)] dark:opacity-20" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`w-full ${isExpanded ? 'max-w-6xl' : 'max-w-sm'}`}
        >
          <div className={`relative overflow-hidden rounded-xl border border-white/70 bg-white/60 shadow-[0_0_70px_rgba(148,163,184,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1424]/85 dark:shadow-[0_0_80px_rgba(56,189,248,0.2)] transition-all duration-300 ${isExpanded ? 'px-8 py-16' : 'px-4 py-6'}`}>
            <div className="absolute -right-24 -top-32 h-56 w-56 rounded-full bg-sky-200/70 blur-3xl dark:bg-sky-400/20" />
            <div className="absolute -left-24 -bottom-32 h-60 w-60 rounded-full bg-cyan-200/60 blur-3xl dark:bg-cyan-300/15" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              {/* Compact Logo/Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>

              <div className="text-center">
                <h1 className={`font-semibold uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_18px_rgba(56,189,248,0.35)] dark:text-cyan-300 transition-all duration-300 ${isExpanded ? 'text-3xl' : 'text-xl'}`}>
                  BYTEBOT
                </h1>
                <p className={`text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-300 transition-all duration-300 ${isExpanded ? 'mt-4' : 'mt-2'}`}>
                  AI Automation
                </p>
              </div>

              {!isExpanded ? (
                /* Compact Navigation Pills */
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => handleExpand('tasks')}
                    className="flex items-center gap-2 rounded-md border border-white/70 bg-white/65 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white/80 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/10"
                  >
                    <ListTodo className="w-4 h-4 text-slate-400 dark:text-slate-200" />
                    Tasks
                  </button>
                  <button
                    onClick={() => handleExpand('desktop')}
                    className="flex items-center gap-2 rounded-md border border-white/70 bg-white/65 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white/80 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/10"
                  >
                    <Monitor className="w-4 h-4 text-slate-400 dark:text-slate-200" />
                    Desktop
                  </button>
                  <button
                    onClick={() => handleExpand('web')}
                    className="flex items-center gap-2 rounded-md border border-white/70 bg-white/65 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white/80 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/10"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-200" />
                    Web
                  </button>
                  <button
                    onClick={() => handleExpand('settings')}
                    className="flex items-center gap-2 rounded-md border border-white/70 bg-white/65 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white/80 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4 text-slate-400 dark:text-slate-200" />
                    Settings
                  </button>
                </div>
              ) : (
                /* Expanded Content */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="text-center mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-300">
                      What do you want to
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_18px_rgba(56,189,248,0.35)] dark:text-cyan-300">
                      AUTOMATE?
                    </h2>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-300">
                      Tell bytebot what you need
                    </p>
                  </div>

                  {/* Task Input Form */}
                  <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Describe what you want to automate"
                        className="w-full bg-transparent px-3 py-2 text-sm font-medium text-slate-500 placeholder:text-slate-400 border border-white/70 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:border-white/10 dark:text-slate-200 dark:placeholder:text-slate-500"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                      />
                       <div className="flex items-center gap-3">
                         {/* Models Status Indicator */}
                         <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 dark:text-slate-300">
                           {modelsError ? (
                             <span className="text-red-400">⚠️ Models: Error</span>
                           ) : models.length > 0 ? (
                             <span className="text-green-400">✓ Models: {models.length} loaded</span>
                           ) : (
                             <span className="text-yellow-400">⟳ Loading models...</span>
                           )}
                         </div>
                         <div className="flex items-center rounded-md border border-white/70 bg-white/70 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                          <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Model</span>
                          <select
                            className="bg-transparent text-[11px] font-semibold tracking-[0.12em] text-slate-500 focus:outline-none dark:text-slate-200"
                            value={selectedModel?.name || ''}
                            onChange={(e) => handleModelChange(e.target.value)}
                          >
                            <option value="">Select model...</option>
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
                          className="flex items-center gap-2 rounded-md border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                        >
                          Auto <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Quick Actions */}
                  <div className="mt-8 grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
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
                        className="rounded-lg border border-white/70 bg-white/55 px-4 py-3 text-sm font-semibold text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all hover:bg-white/80 hover:text-slate-600 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/10"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}