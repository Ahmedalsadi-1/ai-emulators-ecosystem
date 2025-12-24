"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
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
                {/* KRONOS Logo - Large */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mb-8"
                >
                  <Image
                    src="/kronos_logo.webp"
                    alt="KRONOS"
                    width={320}
                    height={96}
                    className="mx-auto h-24 w-auto"
                    priority
                  />
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
                  Tell KRONOS what you need, and watch it happen
                </motion.p>

                {/* Command Input Pill - "Publish Reels" style */}
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  onSubmit={handleSubmit}
                  className="relative"
                >
                  <div
                    className={`
                      relative flex items-center gap-4 rounded-full
                      border border-white/10 bg-white/5
                      px-6 py-4 backdrop-blur-xl
                        transition-all duration-300
                        ${isProcessing ? "scale-95 opacity-70" : "hover:border-white/20 hover:bg-white/10"}
                      `}
                  >
                    {/* Input */}
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="Describe what you want to automate..."
                      disabled={isProcessing}
                      className="flex-1 bg-transparent text-xl text-white placeholder:text-white/40 outline-none disabled:cursor-not-allowed"
                    />

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={!command.trim() || isProcessing}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                        />
                      ) : (
                        "Send"
                      )}
                    </motion.button>
                  </div>

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="mt-8 flex flex-wrap justify-center gap-3"
                  >
                    {[
                      "Open my email",
                      "Schedule a meeting",
                      "Organize downloads",
                      "Set up development environment",
                    ].map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => setCommand(action)}
                        disabled={isProcessing}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {action}
                      </button>
                    ))}
                  </motion.div>
                </motion.form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="desktop-transition"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-40 flex items-center justify-center"
            >
              <Link
                href="/desktop"
                className="w-full h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
