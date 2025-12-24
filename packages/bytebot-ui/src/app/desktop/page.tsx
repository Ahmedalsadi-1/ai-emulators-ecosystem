"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { DesktopContainer } from "@/components/ui/desktop-container";
import { Button } from "@/components/ui/button";

export default function DesktopPage() {
  const [command, setCommand] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      setMessages([...messages, { role: "user", content: command }]);
      setCommand("");

      // Simulate agent response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Working on that..." },
        ]);
      }, 1000);
    }
  };

  return (
    <div className="relative flex h-screen flex-col bg-black">
      <FloatingNav />

      {/* Desktop Hero - Full Width */}
      <main className="relative flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-full w-full p-4"
        >
          <DesktopContainer viewOnly={false} status="live_view" />

          {/* Expand/Collapse Toggle for Command Pill */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setIsCommandOpen(!isCommandOpen)}
            className={`
              absolute left-1/2 bottom-6 -translate-x-1/2 z-50
              rounded-full border border-white/10 bg-black/60
              px-4 py-2 backdrop-blur-xl
              transition-all duration-300
              ${isCommandOpen ? "w-[600px]" : "w-auto"}
              hover:border-white/20 hover:bg-black/80
            `}
          >
            {isCommandOpen ? (
              <form onSubmit={handleSendCommand} className="flex items-center gap-3">
                <div className="flex-1 overflow-hidden">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        mb-2 rounded-2xl px-4 py-2
                        ${msg.role === "user"
                          ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-white"
                          : "bg-white/10 border-white/10 text-white/80"
                        }
                      `}
                    >
                      {msg.content}
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Give KRONOS a command..."
                    className="w-48 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    disabled={!command.trim()}
                    className="h-7 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-0 text-white shadow-lg disabled:opacity-50 hover:shadow-emerald-500/50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14m-7-7 7 7l0-14"
                      />
                    </svg>
                  </Button>
                </div>

                <motion.button
                  type="button"
                  onClick={() => setIsCommandOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-full bg-white/10 px-2 py-1.5 text-white/60 hover:bg-white/20"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.button>
              </form>
            ) : (
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                />
                <span className="text-sm font-medium text-white/80">
                  Live
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-4 w-4 text-white/60"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h8m-4 4v4m0-4l-4 4m0 0l4-4"
                  />
                </svg>
                <span className="text-sm text-white/60">
                  Command
                </span>
              </motion.div>
            )}
          </motion.button>

          {/* Desktop Controls Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute right-6 top-6 flex flex-col gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-xl text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              ↻ Restart
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-xl text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              ⚙ Settings
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
