"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type TerminalPanelProps = {
  onClose?: () => void;
};

type TerminalStatus = "connecting" | "ready" | "closed" | "auth_required";

type AuthFormData = {
  username: string;
  password: string;
};

export function TerminalPanel({ onClose }: TerminalPanelProps) {
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<TerminalStatus>("connecting");
  const [authForm, setAuthForm] = useState<AuthFormData>({ username: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const connectTerminal = (token?: string) => {
    const socket = io({
      path: "/api/proxy/terminal",
      transports: ["websocket"],
      autoConnect: true,
      ...(token ? { auth: { token } } : {}),
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("ready");
      setAuthError("");
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

    socket.on("connect_error", (error) => {
      if (error.message.includes("authentication") || error.message.includes("unauthorized")) {
        setStatus("auth_required");
        setAuthError("Authentication required. Please log in to access the terminal.");
      } else {
        setAuthError(`Connection failed: ${error.message}`);
        setStatus("closed");
      }
    });

    return socket;
  };

  useEffect(() => {
    const storedToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem("bytebot:authToken")
        : null;

    // Always attempt to connect - let the server decide if auth is required
    const socket = connectTerminal(storedToken || undefined);

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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      window.localStorage.setItem("bytebot:authToken", data.accessToken);

      // Connect with new token
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      connectTerminal(data.accessToken);

      setAuthForm({ username: "", password: "" });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsAuthenticating(false);
    }
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

      {status === "auth_required" ? (
        <div className="rounded-md border border-red-200/70 bg-red-50/30 p-4 dark:border-red-800/40 dark:bg-red-900/10">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Authentication Required
          </h3>
          {authError && (
            <div className="mb-3 rounded-md border border-red-200/60 bg-red-50/50 p-2 text-xs text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
              {authError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Username or Email"
                value={authForm.username}
                onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full rounded-md border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-md border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full rounded-md border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              {isAuthenticating ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Need an account? Contact your administrator or check the documentation for registration.
          </div>
        </div>
      ) : (
        <div
          ref={outputRef}
          className="h-52 overflow-auto rounded-md border border-white/70 bg-white/80 p-3 font-mono text-xs text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] whitespace-pre-wrap dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
        >
          {output || "Waiting for terminal output..."}
        </div>
      )}

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
