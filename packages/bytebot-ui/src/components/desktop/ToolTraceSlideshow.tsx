"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Zap, CheckCircle2 } from "lucide-react";

interface TaskTrace {
  id: string;
  kind: "tool_use" | "tool_result" | "text" | "image";
  toolName?: string;
  label?: string;
  details?: string;
  image?: string;
  time?: string;
  isError?: boolean;
}

interface ToolTraceSlideshowProps {
  traces: TaskTrace[];
  taskTitle?: string;
  isVisible: boolean;
  onClose?: () => void;
}

export function ToolTraceSlideshow({
  traces,
  taskTitle = "Task Execution",
  isVisible,
  onClose,
}: ToolTraceSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toolTraces = traces.filter(
    (t) => t.kind === "tool_use" || t.kind === "tool_result"
  );

  const screenshotTraces = traces.filter((t) => t.image);

  // Combine all visual elements for slideshow
  const allSlides = [
    ...screenshotTraces.map((trace) => ({ type: "screenshot" as const, data: trace })),
    ...toolTraces.map((trace) => ({ type: "tool" as const, data: trace })),
  ];

  const currentSlide = allSlides[currentIndex];

  const goNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % allSlides.length);
  };

  const goPrev = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  };

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && allSlides.length > 0 && isVisible) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % allSlides.length);
      }, 4000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [autoPlay, allSlides.length, isVisible]);

  if (!isVisible || allSlides.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-0 bottom-32 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-full px-4"
      >
        <div className="bg-kronos-glass backdrop-blur-glass border border-glass rounded-2xl shadow-glass-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-6 py-4 border-b border-glass">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-kronos-text-primary">
                  {taskTitle}
                </h3>
                <p className="text-xs text-kronos-text-secondary mt-1">
                  {currentIndex + 1} of {allSlides.length} steps
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-kronos-text-secondary hover:text-kronos-text-primary transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Slideshow Content */}
          <div className="relative p-6 min-h-[300px] bg-kronos-obsidian/30">
            <AnimatePresence mode="wait">
              {currentSlide?.type === "screenshot" ? (
                <motion.div
                  key={`slide-${currentIndex}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="text-xs text-kronos-text-secondary font-medium uppercase tracking-wider">
                    Screenshot Captured
                  </div>
                  <div className="rounded-lg overflow-hidden border border-glass shadow-lg max-h-[400px] w-full relative">
                    <Image
                      src={currentSlide.data.image || ""}
                      alt="Tool screenshot"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    />
                  </div>
                  {currentSlide.data.label && (
                    <p className="text-xs text-kronos-text-secondary text-center">
                      {currentSlide.data.label}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`slide-${currentIndex}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-start gap-4"
                >
                  <div className="flex items-center gap-3 w-full">
                    {currentSlide.data?.kind === "tool_use" ? (
                      <>
                        <Zap className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-kronos-text-primary">
                            Tool Used
                          </p>
                          <p className="text-xs text-kronos-text-secondary font-mono">
                            {currentSlide.data?.toolName || currentSlide.data?.label}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-kronos-text-primary">
                            Tool Result
                          </p>
                          <p className="text-xs text-kronos-text-secondary">
                            {currentSlide.data?.label}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {currentSlide.data?.details && (
                    <div className="w-full bg-kronos-obsidian rounded-lg p-4 border border-glass max-h-[300px] overflow-y-auto">
                      <p className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap">
                        {currentSlide.data.details}
                      </p>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-600 ml-auto">
                    {currentSlide.data?.time}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-glass bg-kronos-glass/50">
            <div className="flex gap-2">
              <motion.button
                onClick={goPrev}
                disabled={allSlides.length === 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-4 h-4 text-kronos-text-primary" />
              </motion.button>
              <motion.button
                onClick={goNext}
                disabled={allSlides.length === 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-4 h-4 text-kronos-text-primary" />
              </motion.button>
            </div>

            {/* Progress Indicators */}
            <div className="flex gap-1">
              {allSlides.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setAutoPlay(false);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? "w-6 bg-gradient-to-r from-purple-400 to-blue-400"
                      : "w-2 bg-white/20 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>

            <motion.button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                autoPlay
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-white/5 text-kronos-text-secondary"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {autoPlay ? "Playing" : "Paused"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
