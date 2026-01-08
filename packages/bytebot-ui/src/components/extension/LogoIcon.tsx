'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

// Logo icon as SVG component (pixel-style KRONOS-OS logo)
function KRONOSLogoIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: 28, height: 28 }}
    >
      {/* Background */}
      <rect width="32" height="32" rx="4" fill="url(#bg)" />
      
      {/* KRONOS Prism Logo */}
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#0a0a0f" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </linearGradient>
        <linearGradient id="prism" x1="6" y1="8" x2="26" y2="24">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="prismHighlight" x1="10" y1="12" x2="22" y2="20">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      
      {/* Outer triangle/prism */}
      <path
        d="M16 6 L26 26 L6 26 Z"
        fill="url(#prism)"
        opacity="0.9"
      />
      
      {/* Inner highlight triangle */}
      <path
        d="M16 10 L22 24 L10 24 Z"
        fill="url(#prismHighlight)"
        opacity="0.7"
      />
      
      {/* Center shine */}
      <path
        d="M16 14 L19 22 L13 22 Z"
        fill="#ffffff"
        opacity="0.3"
      />
      
      {/* Pixel-style grid overlay */}
      <path
        d="M16 6 L6 26 M26 26 L6 26 M16 6 L26 26"
        stroke="#ffffff"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  );
}

interface LogoIconProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export function LogoIcon({ isChatOpen, onToggleChat }: LogoIconProps) {
  return (
    <motion.div
      className="fixed bottom-4 left-4 z-40"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.button
        onClick={onToggleChat}
        className="relative group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {/* Glow effect when chat is open */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Glassmorphic container */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Subtle inner glow */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
            }}
          />

          {/* Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <KRONOSLogoIcon />
          </div>

          {/* Status indicator */}
          <motion.div
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
            style={{
              background: isChatOpen
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              boxShadow: isChatOpen
                ? '0 0 8px rgba(16, 185, 129, 0.6)'
                : '0 0 8px rgba(59, 130, 246, 0.4)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Tooltip on hover */}
        <motion.div
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 shadow-xl"
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-xs text-white font-medium whitespace-nowrap">
            {isChatOpen ? 'Close Chat' : 'Open Chat'}
          </span>
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

export default LogoIcon;
