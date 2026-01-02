"use client";

import React from "react";
import type { QuickTaskTraceEntry } from "@/hooks/useQuickTaskSession";

type TracePanelProps = {
  entries: QuickTaskTraceEntry[];
  onClear?: () => void;
};

const getTraceLabel = (entry: QuickTaskTraceEntry): string => {
  if (entry.kind === "tool_use") return "Tool Use";
  if (entry.isError) return "Tool Error";
  return "Tool Result";
};

const downloadTrace = (entries: QuickTaskTraceEntry[]) => {
  const data = JSON.stringify(entries, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bytebot-trace.json";
  link.click();
  URL.revokeObjectURL(url);
};

export function TracePanel({ entries, onClear }: TracePanelProps) {
  return (
    <div className="border-b border-[#3a3a3a] bg-[#1e1e1e] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#888888]">
          Tool Trace
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadTrace(entries)}
            className="rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-0.5 text-[7px] font-medium tracking-[0.1em] text-[#666666] transition-all hover:bg-[#222222] hover:text-[#888888]"
          >
            Download
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-sm border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-0.5 text-[7px] font-medium tracking-[0.1em] text-[#666666] transition-all hover:bg-[#222222] hover:text-[#888888]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 h-[220px] space-y-2 overflow-auto pr-1">
        {entries.length === 0 && (
          <div className="text-[8px] text-[#555555]">
            No tool activity yet.
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-sm border border-[#3a3a3a] bg-[#141414] px-2 py-1.5 text-[8px] text-[#b0b0b0]"
          >
            <div className="flex items-center justify-between text-[7px] uppercase tracking-[0.1em] text-[#666666]">
              <span>{getTraceLabel(entry)}</span>
              <span>{entry.time}</span>
            </div>
            <div className="mt-1 text-[8px] text-[#b0b0b0]">
              <span className="font-semibold text-[#d0d0d0]">
                {entry.label}
              </span>
              {entry.sessionId && (
                <span className="ml-2 text-[#777777]">
                  session:{entry.sessionId}
                </span>
              )}
            </div>
            {entry.details && (
              <p className="mt-1 text-[8px] text-[#8a8a8a] break-all">
                {entry.details}
              </p>
            )}
            {entry.image && (
              <img
                src={`data:image/png;base64,${entry.image}`}
                alt="Tool result"
                className="mt-2 max-h-24 w-full rounded-sm border border-[#2a2a2a] object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
