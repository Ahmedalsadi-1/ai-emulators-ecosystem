'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: string;
  maxHeight?: string;
}

export function ChatDrawer({
  isOpen,
  onClose,
  title,
  children,
  height = '70vh',
  maxHeight = '85vh',
}: ChatDrawerProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ 
              y: collapsed ? 'calc(100% - 60px)' : 0,
              opacity: 1,
            }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            }}
            style={{
              position: 'fixed',
              left: '80px',
              right: '16px',
              bottom: collapsed ? '16px' : '16px',
              height: collapsed ? '60px' : height,
              maxHeight: maxHeight,
              backgroundColor: 'rgba(10, 10, 10, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                cursor: 'grab',
              }}
              onDoubleClick={() => setCollapsed(!collapsed)}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#F5F5F5',
                }}
              >
                {title}
              </span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888888',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888888',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!collapsed && (
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '16px',
                }}
              >
                {children}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
