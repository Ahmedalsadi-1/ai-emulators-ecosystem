"use client";

import React from "react";
import { motion } from "motion/react";

export function DesktopMenuBar() {
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      setTime(`${displayHours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 bg-kronos-glass backdrop-blur-glass border-b border-glass flex items-center justify-between px-4">
      {/* Left: Window Controls + Branding */}
      <div className="flex items-center gap-4">
        {/* macOS-style Window Controls */}
        <div className="flex gap-1.5">
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-red-500/60 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          />
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          />
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-green-500/60 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          />
        </div>

        {/* Branding */}
        <span className="text-xs font-medium text-white tracking-wide">
          KRONOS-OS DESKTOP
        </span>
      </div>

      {/* Right: Time + Status Icons */}
      <div className="flex items-center gap-4">
        {/* Status Icons (placeholder for network, battery, etc.) */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-white/20 rounded-full" />
          <div className="w-1 h-4 bg-white/20 rounded-full" />
          <div className="w-1 h-4 bg-white/20 rounded-full" />
        </div>

        {/* Time */}
        <span className="text-xs text-gray-300">{time}</span>
      </div>
    </div>
  );
}

export default DesktopMenuBar;
