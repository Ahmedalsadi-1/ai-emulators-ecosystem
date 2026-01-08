"use client";

import { useState } from "react";

export function AiosMiniWindow() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex items-center gap-2 rounded-full border border-glass bg-kronos-glass backdrop-blur-glass px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-kronos-text-primary shadow-glass-sm"
        aria-expanded={open}
        aria-label="Toggle AIOS panel"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kronos-status-green"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-kronos-status-green"></span>
        </span>
        AIOS
      </button>

      {open ? (
        <div className="absolute bottom-14 right-0 w-[380px] rounded-2xl border border-glass bg-kronos-glass backdrop-blur-glass p-4 text-kronos-text-primary shadow-glass-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-kronos-text-secondary">
                AIOS Command Node
              </p>
              <h3 className="text-lg font-semibold text-kronos-text-primary">Automation Hub</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-glass px-2 py-1 text-xs text-kronos-text-secondary transition hover:border-white/20 hover:text-kronos-text-primary"
            >
              Close
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-xl border border-glass bg-white/5 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-kronos-text-secondary/60">OS-AI</span>
              <span className="text-kronos-status-green">Ready</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-kronos-text-secondary/60">Open-Interface</span>
              <span className="text-kronos-text-secondary">Standing by</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-kronos-text-secondary/60">OmniParser</span>
              <span className="text-kronos-status-green">Enabled</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs text-kronos-text-secondary/60">
            <p>Use this panel for AIOS orchestration, telemetry, and quick actions.</p>
            <p className="text-kronos-text-secondary/40">
              Sessions: Desktop + Web share the same model/toolset.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
