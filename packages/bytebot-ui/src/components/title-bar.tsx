'use client';

import { useEffect, useState } from 'react';

export function TitleBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if we're running in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeWindow();
    }
  };

  if (!isElectron) {
    return null; // Don't show title bar in web version
  }

  return (
    <div className="flex items-center justify-between h-8 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 select-none drag-region">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer no-drag-region" onClick={handleClose} />
        <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer no-drag-region" onClick={handleMinimize} />
        <div className={`w-3 h-3 rounded-full cursor-pointer no-drag-region ${isMaximized ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`} onClick={handleMaximize} />
      </div>
      <span className="text-xs text-slate-400 font-medium">Bytebot</span>
      <div className="w-16" /> {/* Spacer for balance */}
    </div>
  );
}