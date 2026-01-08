'use client';

import { useState } from 'react';
import styles from './TopBar.module.css';

interface TopBarProps {
  activeDesktop: string;
  onDesktopChange: (desktop: string) => void;
}

export function TopBar({ activeDesktop, onDesktopChange }: TopBarProps) {
  const desktops = ['Primary', 'Kali', 'Debian', 'BrowserOS'];
  
  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.appleLogo}>🍎</span>
          <span className={styles.appName}>KRONOS-OS</span>
        </div>
        
        <div className={styles.desktopSelector}>
          <select 
            value={activeDesktop}
            onChange={(e) => onDesktopChange(e.target.value)}
            className={styles.select}
          >
            {desktops.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={styles.center}>
        <span className={styles.windowTitle}>
          {activeDesktop} - Desktop Session
        </span>
      </div>
      
      <div className={styles.right}>
        <button className={styles.windowBtn}>─</button>
        <button className={styles.windowBtn}>□</button>
        <button className={styles.windowBtn}>✕</button>
        <div className={styles.userAvatar} />
      </div>
    </header>
  );
}
