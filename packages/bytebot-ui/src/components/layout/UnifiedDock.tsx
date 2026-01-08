"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Settings, Globe, Monitor, Tv, Clock, Chrome } from "lucide-react";

interface UnifiedDockProps {
  activeDesktop?: string;
  onSwitchDesktop?: (desktopId: string) => void;
}

export function UnifiedDock({
  activeDesktop = "bytebot-edge-1",
  onSwitchDesktop,
}: UnifiedDockProps) {
  const router = useRouter();

  const desktops = [
    { id: "bytebot-edge-1", label: "KRON-1" },
    { id: "bytebot-edge-2", label: "KRON-2" },
    { id: "bytebot-edge-3", label: "KRON-3" },
  ];

  return (
    <div className="w-full border-t border-[#333] bg-[#000] p-2 select-none font-mono text-[10px]">
      <div className="flex items-center justify-center gap-4">
        
        {/* LEFT: Desktop Selectors */}
        <div className="flex items-center gap-2">
          {desktops.map((d) => {
             const isActive = activeDesktop === d.id;
             return (
               <button
                 key={d.id}
                 onClick={() => onSwitchDesktop?.(d.id)}
                 className={`
                   h-8 px-4 border border-[#333] uppercase tracking-widest font-bold transition-all
                   ${isActive 
                     ? "bg-[#e0e0e0] text-[#000] shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                     : "bg-[#050505] text-[#666] hover:text-[#aaa] hover:border-[#666]"
                   }
                 `}
               >
                 [{d.label}]
               </button>
             );
          })}
        </div>
      </div>
    </div>
  );
}