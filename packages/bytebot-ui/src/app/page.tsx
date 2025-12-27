"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { fetchModels, startTask } from "@/utils/taskUtils";
import type { Model } from "@/types";
import { ChevronRight, Monitor, ListTodo, Settings, EyeOff } from "lucide-react";

const quickActions = [
  "Open my email",
  "Schedule a meeting",
  "Organize downloads",
  "Set up development environment",
];

type ControlPillProps = {
  label: string;
  icon: React.ReactNode;
};

function ControlPill({ label, icon }: ControlPillProps) {
  return (
    <button className="flex items-center gap-2 rounded-md border border-white/70 bg-white/65 px-4 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white/80 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/10">
      <span className="text-slate-400 dark:text-slate-200">{icon}</span>
      {label}
    </button>
  );
}

export default function Home() {
  const [command, setCommand] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      const result = await fetchModels();
      if (!isMounted) return;

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

  useEffect(() => {
    if (!selectedModel) return;
    window.localStorage.setItem(
      "bytebot:model",
      selectedModel.name || selectedModel.title,
    );
  }, [selectedModel?.name, selectedModel?.title]);

  const queueTask = async (description: string) => {
    const trimmed = description.trim();
    if (!trimmed || !selectedModel || isSending) return;
    setIsSending(true);
    const result = await startTask({
      description: trimmed,
      model: selectedModel,
    });
    if (result) {
      setCommand("");
    }
    setIsSending(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await queueTask(command);
  };

  const handleQuickAction = async (action: string) => {
    setCommand(action);
    await queueTask(action);
  };

  const canSend = Boolean(selectedModel) && !isSending;
  const canSubmit = canSend && Boolean(command.trim());

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_rgba(186,220,255,0.7),_transparent_60%),linear-gradient(180deg,_#f6f8ff_0%,_#edf3ff_52%,_#e4edf9_100%)] text-slate-700 dark:bg-[radial-gradient(1200px_circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),linear-gradient(180deg,_#05070d_0%,_#0b1220_55%,_#0a0f1a_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-size:14px_14px] [background-image:radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.2)_1px,_transparent_0)] dark:opacity-20" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white/60 px-6 py-12 shadow-[0_0_70px_rgba(148,163,184,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1424]/85 dark:shadow-[0_0_80px_rgba(56,189,248,0.2)] sm:px-10">
            <div className="absolute -right-24 -top-32 h-56 w-56 rounded-full bg-sky-200/70 blur-3xl dark:bg-sky-400/20" />
            <div className="absolute -left-24 -bottom-32 h-60 w-60 rounded-full bg-cyan-200/60 blur-3xl dark:bg-cyan-300/15" />

            <div className="relative z-10 flex flex-col gap-10">
              <FloatingNav embedded />

              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-300 sm:text-base md:text-lg">
                  What do you want to
                </p>
                <h1 className="mt-4 text-4xl font-semibold uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_18px_rgba(56,189,248,0.35)] dark:text-cyan-300 sm:text-5xl md:text-6xl lg:text-7xl">
                  AUTOMATE?
                </h1>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-300 sm:text-sm">
                  Tell bytebot what you need, and watch it happen
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mx-auto mt-8 flex w-full max-w-3xl items-center justify-between rounded-lg border border-white/70 bg-white/65 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <input
                    type="text"
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    placeholder="Describe what you want to automate"
                    className="w-full bg-transparent px-2 text-sm font-medium text-slate-500 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500 sm:text-base"
                  />
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex items-center gap-2 rounded-md border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                  >
                    Auto <ChevronRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={!canSend}
                      onClick={() => handleQuickAction(action)}
                      className="rounded-lg border border-white/70 bg-white/55 px-6 py-4 text-sm font-semibold text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all hover:bg-white/80 hover:text-slate-600 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/10"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/70 bg-white/60 px-4 py-3 shadow-[0_20px_60px_rgba(148,163,184,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0c1424]/85 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-3">
                  <ControlPill
                    label="Select Screen"
                    icon={<Monitor className="h-4 w-4" />}
                  />
                  <ControlPill
                    label="Tasks"
                    icon={<ListTodo className="h-4 w-4" />}
                  />
                  <ControlPill
                    label="Settings"
                    icon={<Settings className="h-4 w-4" />}
                  />
                </div>

                <button className="flex items-center gap-2 rounded-md border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold tracking-[0.08em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
                  <EyeOff className="h-4 w-4" />
                  Hide Bytebot
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
