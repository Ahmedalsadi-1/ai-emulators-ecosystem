"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type TerminalPanelProps = {
  onClose?: () => void;
};

type TerminalStatus = "connecting" | "ready" | "closed";

export function TerminalPanel({ onClose }: TerminalPanelProps) {
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<TerminalStatus>("connecting");
  const socketRef = useRef<Socket | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io({
      path: "/api/proxy/terminal",
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("ready");
    });

    socket.on("disconnect", () => {
      setStatus("closed");
    });

    socket.on("terminal:data", (data: string) => {
      setOutput((prev) => {
        const next = `${prev}${data}`;
        return next.slice(-12000);
      });
    });

    socket.on("terminal:exit", () => {
      setStatus("closed");
    });

    socket.on("terminal:error", (payload: { message?: string }) => {
      setOutput((prev) => `${prev}\n${payload?.message || "Terminal error."}\n`);
      setStatus("closed");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!outputRef.current) return;
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const sendInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    socketRef.current?.emit("terminal:input", { data: `${value}\n` });
    setInput("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendInput(input);
    }
  };

  const handleCtrlC = () => {
    socketRef.current?.emit("terminal:input", { data: "\u0003" });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/70 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
          Terminal
          <span className="ml-2 text-[10px] text-slate-300 dark:text-slate-400">
            {status === "ready"
              ? "ready"
              : status === "connecting"
                ? "connecting"
                : "closed"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOutput("")}
            className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleCtrlC}
            className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          >
            Ctrl+C
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div
        ref={outputRef}
        className="h-52 overflow-auto rounded-md border border-white/70 bg-white/80 p-3 font-mono text-xs text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] whitespace-pre-wrap dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
      >
        {output || "Waiting for terminal output..."}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command and press Enter"
          className="flex-1 rounded-md border border-white/70 bg-white/80 px-3 py-2 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={() => sendInput(input)}
          className="rounded-md border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition-all hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
        >
          Run
        </button>
      </div>
    </div>
  );
}
