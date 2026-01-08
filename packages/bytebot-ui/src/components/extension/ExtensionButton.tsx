'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ExtensionButtonProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onClick: () => void;
  color?: string;
}

export function ExtensionButton({
  id,
  icon,
  label,
  isOpen,
  onClick,
  color = '#888888',
}: ExtensionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="extension-button"
      initial={{ opacity: 0.8 }}
      whileHover={{ opacity: 1, scale: 1.05 }}
      animate={{ 
        opacity: isOpen ? 1 : 0.8,
        backgroundColor: isOpen ? 'rgba(42, 42, 42, 1)' : 'rgba(26, 26, 26, 1)',
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        border: '1px solid #3a3a3a',
        borderRadius: '4px',
        backgroundColor: 'rgba(26, 26, 26, 1)',
        color: color,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      title={label}
    >
      <span style={{ fontSize: '20px', marginBottom: '2px' }}>{icon}</span>
      <span style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </motion.button>
  );
}

interface ExtensionDockProps {
  buttons: ExtensionButtonProps[];
  onToggle: (id: string) => void;
}

export function ExtensionDock({ buttons, onToggle }: ExtensionDockProps) {
  return (
    <div
      className="extension-dock"
      style={{
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100,
      }}
    >
      {buttons.map((button) => (
        <ExtensionButton
          key={button.id}
          {...button}
          onClick={() => onToggle(button.id)}
        />
      ))}
    </div>
  );
}
