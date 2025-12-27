"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { VncViewer } from "@/components/vnc/VncViewer";
import { openDesktopApplication } from "@/utils/desktopUtils";
import { Send } from "lucide-react";

const stepsTaken = [
  "Opened BrowserOS workspace",
  "Loaded project dashboard",
  "Analyzed automation request",
  "Prepared execution plan",
];

const chatHistory = [
  {
    name: "Bytebot",
    message: "Ready to orchestrate BrowserOS tasks.",
  },
  {
    name: "Operator",
    message: "Navigate to the repo and scan dependencies.",
  },
  {
    name: "Bytebot",
    message: "Collecting data from the BrowserOS session now.",
  },
];

export default function WebPage() {
  const [prompt, setPrompt] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    setIsLaunching(true);
    await openDesktopApplication("browseros");
    setIsLaunching(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,_rgba(186,220,255,0.65),_transparent_60%),linear-gradient(180deg,_#f3f6ff_0%,_#e8f0ff_55%,_#e1eaf6_100%)] text-slate-700 dark:bg-[radial-gradient(1200px_circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),linear-gradient(180deg,_#05070d_0%,_#0b1220_55%,_#0a0f1a_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-size:14px_14px] [background-image:radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.2)_1px,_transparent_0)] dark:opacity-20" />

      <FloatingNav />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          <div className="rounded-xl border border-white/70 bg-white/60 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.3)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                BrowserOS Console
              </div>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isLaunching}
                className="rounded-md border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
              >
                {isLaunching ? "Launching..." : "Open BrowserOS"}
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                  <span>BrowserOS View</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400">
                    Live session
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-md border border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <div className="aspect-video w-full">
                    <VncViewer viewOnly={false} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/70 bg-white/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                  <span>History</span>
                  <button
                    type="button"
                    className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    Steps Taken
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {stepsTaken.map((step) => (
                      <div
                        key={step}
                        className="rounded-md border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                    Chat
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    {chatHistory.map((entry) => (
                      <div
                        key={`${entry.name}-${entry.message}`}
                        className="rounded-md border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                      >
                        <span className="font-semibold text-slate-500 dark:text-slate-100">
                          {entry.name}
                        </span>
                        <span className="ml-2 text-slate-400 dark:text-slate-300">
                          {entry.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <input
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Type a message"
                    className="flex-1 rounded-md border border-white/70 bg-white/80 px-3 py-2 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/70 bg-white/80 text-slate-500 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
