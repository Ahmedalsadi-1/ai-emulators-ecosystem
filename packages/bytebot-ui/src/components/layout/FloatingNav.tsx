"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { KronosLogo } from "@/components/branding/KronosLogo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tasks", label: "Tasks" },
  { href: "/desktop", label: "Desktop" },
  { href: "/web", label: "Web" },
  { href: "/settings", label: "Settings" },
];

function SoundWaveIcon() {
  return (
    <div
      className="flex items-end gap-0.5"
      role="img"
      aria-label="Voice control"
    >
      {[10, 16, 22, 14].map((height, index) => (
        <span
          key={`wave-${height}`}
          className="w-1 animate-pulse rounded-full bg-[#d0d0d0]"
          style={{
            height: `${height}px`,
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

type FloatingNavProps = {
  embedded?: boolean;
  className?: string;
};

export function FloatingNav({
  embedded = false,
  className = "",
}: FloatingNavProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={
        embedded
          ? `w-full ${className}`
          : `fixed left-0 right-0 top-0 z-50 px-4 pt-4 ${className}`
      }
    >
      <div className={embedded ? "w-full" : "mx-auto w-full max-w-5xl"}>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#161719]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_20px_60px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <KronosLogo size={56} className="h-9 w-auto opacity-95" />
            </div>
            <span className="text-xs font-semibold tracking-[0.2em] text-[#e6e6e6]">
              KRONOS-OS
            </span>
          </Link>

          <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                    isActive
                      ? "bg-[#2a2b2e] text-[#f3f3f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "bg-[#1a1b1d] text-[#9a9a9a] hover:bg-[#222327] hover:text-[#d0d0d0]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[#cfcfcf]">
            <div className="flex items-center rounded-md border border-white/10 bg-[#1a1b1d] p-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9a9a] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`rounded-md px-3 py-1 transition-all ${
                  mounted && !isDark
                    ? "bg-[#2a2b2e] text-[#f3f3f3]"
                    : "text-[#9a9a9a] hover:text-[#d0d0d0]"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-md px-3 py-1 transition-all ${
                  mounted && isDark
                    ? "bg-[#2a2b2e] text-[#f3f3f3]"
                    : "text-[#9a9a9a] hover:text-[#d0d0d0]"
                }`}
              >
                Dark
              </button>
            </div>
            <SoundWaveIcon />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
