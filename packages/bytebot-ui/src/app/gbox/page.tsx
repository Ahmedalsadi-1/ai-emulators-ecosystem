"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { GboxDesktopView } from "@/components/gbox/GboxDesktopView";
import { GboxAndroidView } from "@/components/gbox/GboxAndroidView";
import { MonitorPlay, Smartphone } from "lucide-react";

export default function GboxPage() {
  const [activeTab, setActiveTab] = useState<"desktop" | "android">("desktop");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0e] text-[#e6e6e6]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_top,_rgba(84,110,255,0.18),_transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_bottom,_rgba(18,18,18,0.9),_transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.04),_transparent_50%)] opacity-60" />

      <main className="relative z-10 flex min-h-screen w-full flex-col px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141417]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f2f2f2]">
            GBOX CONTROL
          </div>

          <div className="flex items-center rounded-full border border-white/10 bg-black/30 p-1 text-[9px] uppercase tracking-[0.24em] text-[#bdbdbd]">
            <button
              type="button"
              onClick={() => setActiveTab("desktop")}
              className={`rounded-full px-3 py-1.5 transition-all ${
                activeTab === "desktop"
                  ? "bg-white/10 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]"
                  : "hover:bg-white/5"
              }`}
            >
              <MonitorPlay className="mr-1 inline-block h-3 w-3" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("android")}
              className={`rounded-full px-3 py-1.5 transition-all ${
                activeTab === "android"
                  ? "bg-white/10 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]"
                  : "hover:bg-white/5"
              }`}
            >
              <Smartphone className="mr-1 inline-block h-3 w-3" />
              Android
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#141417]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_40px_90px_rgba(0,0,0,0.65)]"
        >
          <div className="h-full w-full">
            {activeTab === "desktop" ? <GboxDesktopView /> : <GboxAndroidView />}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
