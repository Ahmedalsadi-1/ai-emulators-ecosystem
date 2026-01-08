'use client';

import { useState } from 'react';
import styles from './Dock.module.css';

interface DockItem {
  id: string;
  icon: string;
  label: string;
}

interface DockProps {
  onItemClick?: (id: string) => void;
}

const dockItems: DockItem[] = [
  { id: 'logo', icon: '⚡️', label: 'KRONOS' },
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'web', icon: '🌐', label: 'Browser' },
  { id: 'files', icon: '📁', label: 'Files' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export function Dock({ onItemClick }: DockProps) {
  const [activeItem, setActiveItem] = useState('chat');
  
  return (
    <div className={styles.dockContainer}>
      <div className={styles.dockWrapper}>
        <div className={styles.dock}>
          {dockItems.map(item => (
            <div 
              key={item.id}
              className={`
                ${styles.dockItem}
                ${activeItem === item.id ? styles.active : ''}
              `}
              onClick={() => {
                setActiveItem(item.id);
                onItemClick?.(item.id);
              }}
            >
              <div className={styles.iconWrapper}>
                <span className={styles.icon}>{item.icon}</span>
              </div>
              <span className={styles.label}>{item.label}</span>
              {activeItem === item.id && (
                <div className={styles.indicator} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
