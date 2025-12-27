"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

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
          className="w-1 animate-pulse rounded-full bg-sky-300/80 shadow-[0_0_10px_rgba(125,211,252,0.8)] dark:bg-sky-300/80"
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
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/65 bg-white/55 px-4 py-3 shadow-[0_18px_50px_rgba(148,163,184,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0c1424]/85 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-11">
              <Image
                src="/bytebot-logo.png"
                alt="Bytebot logo"
                fill
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/bytebot-logo.png"
                alt="Bytebot logo"
                fill
                className="hidden object-contain dark:block"
                priority
              />
            </div>
            <span className="text-sm font-semibold tracking-[0.22em] text-slate-500 dark:text-slate-200">
              bytebot
            </span>
          </Link>

          <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-5 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition-all ${
                    isActive
                      ? "bg-sky-200/80 text-slate-600 shadow-[0_0_18px_rgba(56,189,248,0.35)] dark:bg-sky-300/20 dark:text-sky-100 dark:shadow-[0_0_20px_rgba(56,189,248,0.65)]"
                      : "text-slate-400 hover:bg-white/70 hover:text-slate-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-200">
            <div className="flex items-center rounded-md border border-white/70 bg-white/70 p-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`rounded-md px-3 py-1 transition-all ${
                  mounted && !isDark
                    ? "bg-white text-slate-600 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-md px-3 py-1 transition-all ${
                  mounted && isDark
                    ? "bg-white/20 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white"
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
