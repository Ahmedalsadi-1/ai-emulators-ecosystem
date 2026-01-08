"use client";

import React from "react";
import { motion } from "motion/react";

// App icons data for the dock
const dockApps = [
  { id: "finder", name: "Finder", icon: "📁" },
  { id: "launchpad", name: "Launchpad", icon: "🚀" },
  { id: "mail", name: "Mail", icon: "✉️" },
  { id: "safari", name: "Safari", icon: "🧭" },
  { id: "notes", name: "Notes", icon: "📝" },
  { id: "photos", name: "Photos", icon: "🌸" },
  { id: "photoshop", name: "Photoshop", icon: "🎨" },
  { id: "trash", name: "Trash", icon: "🗑️" },
];

interface DockAppProps {
  app: { id: string; name: string; icon: string };
  isActive?: boolean;
}

function DockApp({ app, isActive = false }: DockAppProps) {
  return (
    <motion.div
      className="flex flex-col items-center group cursor-pointer"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <div className="relative">
        {/* App Icon */}
        <motion.div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            isActive
              ? "bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              : "bg-white/10"
          }`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {app.icon}
        </motion.div>

        {/* Active indicator dot */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
          />
        )}

        {/* Tooltip */}
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-kronos-glass backdrop-blur-glass rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {app.name}
        </motion.div>
      </div>

      {/* Reflection Effect */}
      <div className="w-10 h-3 mt-1 rounded-b-lg bg-gradient-to-b from-white/10 to-transparent" />
    </motion.div>
  );
}

export function GlassmorphicDockBar() {
  const [activeApp, setActiveApp] = React.useState("photoshop");

  return (
    <div className="h-16 bg-kronos-glass backdrop-blur-[20px] border-t border-glass flex items-end justify-center pb-2 px-4">
      <div className="flex items-end gap-2">
        {dockApps.map((app) => (
          <DockApp
            key={app.id}
            app={app}
            isActive={app.id === activeApp}
          />
        ))}
      </div>
    </div>
  );
}

export default GlassmorphicDockBar;
