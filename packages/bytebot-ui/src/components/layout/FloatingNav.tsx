"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";

export function FloatingNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/tasks", label: "Tasks" },
    { href: "/desktop", label: "Desktop" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed left-0 right-0 top-4 z-50 flex justify-center px-4"
    >
      <motion.div
        className="flex items-center gap-2 rounded-full bg-black/60 border border-white/10 px-2 py-1.5 backdrop-blur-xl shadow-2xl"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-white/5 transition-colors">
          <Image
            src="/bytebot_transparent_logo_white.svg"
            alt="KRONOS"
            width={32}
            height={32}
            className="h-8 w-auto drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
          />
        </Link>

        <div className="h-6 w-px bg-white/10" />

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
               className={`
                 relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300
                 ${
                   pathname === item.href
                     ? "bg-white text-black shadow-lg"
                     : "text-white/70 hover:bg-white/10 hover:text-white"
                 }
               `}
               style={{ fontFamily: "var(--font-bartle)" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.nav>
  );
}
