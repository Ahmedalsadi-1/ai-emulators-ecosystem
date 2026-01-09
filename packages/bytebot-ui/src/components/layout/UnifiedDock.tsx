"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Settings, Globe, Monitor, Tv, Clock, Chrome } from "lucide-react";

interface UnifiedDockProps {
  activeDesktop?: string;
  onSwitchDesktop?: (desktopId: string) => void;
  onToggleControllers?: () => void;
  onToggleTasks?: () => void;
  controllerHealth?: Array<{
    id: string;
    label: string;
    ready: boolean;
  }>;
}

export function UnifiedDock({
  activeDesktop = "bytebot-edge-1",
  onSwitchDesktop,
  onToggleControllers,
  onToggleTasks,
  controllerHealth = [],
}: UnifiedDockProps) {
  const router = useRouter();

  return (
    <div className="w-full border-t border-white/10 bg-[#0a0a0d]/90 p-2 select-none font-mono text-[10px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {controllerHealth.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[9px] uppercase tracking-widest text-[#bdbdbd]"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  item.ready ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-rose-400"
                }`}
              />
              {item.label}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/web")}
            className="h-8 px-3 border border-white/10 uppercase tracking-widest font-bold bg-black/40 text-[#777] hover:text-[#ddd] hover:border-white/30"
          >
            [WEB]
          </button>
          <button
            onClick={() => window.open("/gbox", "gbox-window", "width=1200,height=820")}
            className="h-8 px-3 border border-white/10 uppercase tracking-widest font-bold bg-black/40 text-[#777] hover:text-[#ddd] hover:border-white/30"
            title="Open GBox in a separate window"
          >
            [GBOX]
          </button>
        </div>
      </div>
    </div>
  );
}
