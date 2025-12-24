"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import Image from "next/image";
import Link from "next/link";

export default function PillHome() {
  const [showDesktop, setShowDesktop] = useState(false);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isProcessing) {
      setIsProcessing(true);

      // Morph transition to desktop
      setTimeout(() => {
        setShowDesktop(true);
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <AnimatePresence mode="wait">
        {!showDesktop ? (
          <motion.div
            key="pill"
            layoutId="pill-frame"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              width: 0,
              height: 0,
              scale: 0.8,
            }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25],
            }}
            className={`
              relative flex h-[80px] w-full max-w-[1000px]
              items-center px-4
              rounded-[9999px]
              bg-black/85 backdrop-blur-[20px]
              border border-white/10
              shadow-2xl
              -webkit-app-region: drag
            `}
          >
            {/* Inner subtle border for depth */}
            <div className="absolute inset-0 rounded-[9998px] border border-[1px] border-white/5 pointer-events-none" />

            {/* Logo - Far Left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative z-10 flex h-8 w-8 shrink-0 -webkit-app-region: no-drag"
            >
              <Image
                src="/kronos_logo.webp"
                alt="KRONOS"
                width={32}
                height={32}
                className="h-6 w-auto opacity-90"
                priority
              />
            </motion.div>

            {/* Command Bar - Center */}
            <div className="flex-1 -webkit-app-region: no-drag">
              <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                onSubmit={handleSubmit}
                className="flex items-center"
              >
                <motion.div
                  className={`
                    relative flex-1 flex items-center gap-4
                    rounded-full px-8 py-3
                    transition-all duration-300
                    ${isProcessing ? "opacity-70 scale-95" : ""}
                  `}
                >
                  {/* Input - No visible borders */}
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Ask KRONOS to automate something..."
                    disabled={isProcessing}
                    className={`
                      flex-1 bg-transparent text-lg
                      text-white/80 placeholder:text-white/30
                      outline-none disabled:cursor-not-allowed
                      transition-all duration-300
                      ${isProcessing ? "cursor-not-allowed" : ""}
                    `}
                    autoFocus
                  />

                  {/* Submit Button - Hidden when processing */}
                  <AnimatePresence mode="wait">
                    {!isProcessing ? (
                      <motion.button
                        type="submit"
                        disabled={!command.trim()}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="h-8 w-8 shrink-0 rounded-full bg-white/5 text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
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
                            d="M5 12h14m-7-7 7 7l0-14"
                          />
                        </svg>
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-6 w-6"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-full w-full rounded-full border-2 border-white/20 border-t-white"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.form>
            </div>

            {/* Navigation Links - Right Side */}
            <motion.nav
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative z-10 flex items-center gap-1 -webkit-app-region: no-drag"
            >
              {["Home", "Tasks", "Desktop", "Settings"].map((item) => {
                const href = item === "Home" ? "/" : `/${item.toLowerCase()}`;
                return (
                  <Link
                    key={item}
                    href={href}
                    className={`
                      relative rounded-full px-4 py-2 text-sm
                      font-medium transition-all duration-300
                      hover:bg-white/5
                    `}
                  >
                    {item}
                    {item === "Home" && (
                      <div className="absolute inset-0 rounded-full border border-white/10" />
                    )}
                  </Link>
                );
              })}
            </motion.nav>
          </motion.div>
        ) : (
          <motion.div
            key="desktop"
            layoutId="pill-frame"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black"
          >
            {/* Desktop View will be rendered here */}
            <div className="h-full w-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
