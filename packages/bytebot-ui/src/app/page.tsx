"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import Image from "next/image";

export default function Home() {
  const [showDesktop, setShowDesktop] = useState(false);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isProcessing) {
      setIsProcessing(true);
      // Simulate processing delay then transition to desktop
      setTimeout(() => {
        setShowDesktop(true);
      }, 800);
    }
  };

  return (
    <div className="relative flex h-screen flex-col bg-black">
      <FloatingNav />

      <main className="flex flex-1 items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {!showDesktop ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full max-w-2xl"
            >
              {/* Centered Content */}
              <div className="text-center">
                {/* Spectacular Bytebot Logo */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="relative mb-8"
                >
                  <div className="relative">
                    {/* Glowing background effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl scale-150 animate-pulse" />

                    {/* Main logo with enhanced glow */}
                    <Image
                      src="/bytebot_transparent_logo_white.svg"
                      alt="Bytebot"
                      width={200}
                      height={200}
                      className="relative mx-auto h-32 w-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] filter brightness-110"
                      priority
                    />

                    {/* "Live" badge with Bartle font */}
                    <div
                      className="absolute -top-2 -right-2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-black shadow-lg"
                      style={{ fontFamily: "var(--font-bartle)" }}
                    >
                      LIVE
                    </div>

                    {/* Animated ring effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/30"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0, 0.5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* "Live" badge with Bartle font */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="absolute -top-2 -right-2"
                    >
                      <div
                        className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-black shadow-lg"
                        style={{ fontFamily: "var(--font-bartle)" }}
                      >
                        LIVE
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-4 text-5xl font-bold text-white md:text-7xl"
                >
                  What do you want to{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    automate?
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mb-12 text-lg text-white/60"
                >
                  Tell Bytebot what you need, and watch it happen
                </motion.p>

                {/* Command Input */}
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  onSubmit={handleSubmit}
                  className="mb-8"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="Describe what you want to automate..."
                      className="w-full rounded-full border border-white/20 bg-white/10 px-6 py-4 text-lg text-white placeholder-white/50 backdrop-blur-md focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      disabled={isProcessing}
                    />
                    <button
                      type="submit"
                      disabled={!command.trim() || isProcessing}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 px-6 py-2 text-white transition-colors hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? "Processing..." : "Send"}
                    </button>
                  </div>
                </motion.form>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {[
                    "Open my email",
                    "Schedule a meeting",
                    "Organize downloads",
                    "Set up development environment",
                  ].map((action, index) => (
                    <motion.button
                      key={action}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                      onClick={() => setCommand(action)}
                      className="rounded-xl border border-white/20 bg-white/10 p-4 text-left text-white/80 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
                    >
                      {action}
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="desktop"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-white/20 border-t-white"
                />
                <p className="text-xl text-white">Starting your automation...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}