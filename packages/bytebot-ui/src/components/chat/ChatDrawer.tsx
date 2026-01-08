'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ChatDrawer.module.css';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

export function ChatDrawer({ isOpen, onClose, messages, onSendMessage, isProcessing }: ChatDrawerProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };
  
  return (
    <div className={`
      ${styles.drawer}
      ${isOpen ? styles.open : ''}
    `}>
      <div className={styles.drawerContent}>
        <div className={styles.header}>
          <span>AI Assistant</span>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        
        <div className={styles.messagesContainer}>
          {messages.map(msg => (
            <div 
              key={msg.id}
              className={`
                ${styles.message}
                ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}
              `}
            >
              {msg.content}
            </div>
          ))}
          {isProcessing && (
            <div className={styles.processingIndicator}>
              <div className={styles.dot} />
              <div className={styles.dot} />
              <div className={styles.dot} />
            </div>
          )}
        </div>
        
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className={styles.input}
            disabled={isProcessing}
          />
          <button 
            onClick={handleSend} 
            className={styles.sendBtn}
            disabled={isProcessing || !message.trim()}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
