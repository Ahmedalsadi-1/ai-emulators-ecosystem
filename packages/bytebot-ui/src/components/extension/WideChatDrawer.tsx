'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, Sparkles, ChevronUp, ChevronDown, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  text: string;
  timestamp: string;
}

interface WideChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

// Mesh gradient background for chat
function ChatMeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-kronos-obsidian" />
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(255, 255, 255, 0.05) 0px, transparent 50%)
          `,
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 100%'],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />
    </div>
  );
}

export function WideChatDrawer({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isProcessing,
}: WideChatDrawerProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isCollapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-30"
          initial={{ y: '100%' }}
          animate={{ y: isCollapsed ? 'calc(100% - 60px)' : 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
        >
          {/* Glassmorphic container */}
          <div
            className="relative mx-4 mb-4 rounded-2xl overflow-hidden"
            style={{
              height: isCollapsed ? '60px' : '280px',
              maxHeight: '80vh',
            }}
          >
            {/* Mesh gradient background */}
            <ChatMeshGradient />

             {/* Main glass layer */}
             <div
               className="absolute inset-0"
               style={{
                 background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.03) 100%)',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255,255,255,0.1)',
                 borderTop: '1px solid rgba(255,255,255,0.12)',
               }}
             />

            {/* Inner shadow/highlight */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header bar */}
               <div
                 className="flex items-center justify-between px-4 py-2 border-b border-glass cursor-grab active:cursor-grabbing"
                 onDoubleClick={() => setIsCollapsed(!isCollapsed)}
                 style={{
                   background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                 }}
               >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/10 border border-glass flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-kronos-text-secondary" />
                  </div>
                  <span className="text-xs font-semibold text-kronos-text-primary uppercase tracking-wider">
                    KRONOS Chat
                  </span>
                  {isProcessing && (
                    <motion.div
                      className="flex items-center gap-1 ml-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-blue-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              {!isCollapsed && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <AnimatePresence mode="popLayout">
                      {messages.length === 0 ? (
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="flex flex-col items-center justify-center h-full text-center"
                       >
                         <div className="w-12 h-12 rounded-full bg-white/10 border border-glass flex items-center justify-center mb-3">
                           <Sparkles className="w-6 h-6 text-kronos-text-secondary" />
                         </div>
                         <h3 className="text-kronos-text-primary font-medium text-sm mb-1">AI Assistant Ready</h3>
                         <p className="text-kronos-text-secondary/60 text-xs">Send a message to get started</p>
                       </motion.div>
                      ) : (
                        messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className={`
                              max-w-[80%] p-3 rounded-xl
                              ${msg.role === 'user'
                                ? 'ml-auto bg-white/10 border border-white/20'
                                : msg.role === 'tool'
                                ? 'ml-auto bg-white/10 border border-white/20'
                                : 'mr-auto bg-white/5 border border-glass'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-medium uppercase tracking-wider ${
                                msg.role === 'user' ? 'text-blue-400' :
                                msg.role === 'tool' ? 'text-amber-400' :
                                'text-green-400'
                              }`}>
                                {msg.role === 'user' ? 'You' : msg.role === 'tool' ? 'Tool' : 'Bytebot'}
                              </span>
                              <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
                            </div>
                            <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-gray-400"
                      >
                        <Zap className="w-3 h-3 animate-pulse" />
                        <span className="text-xs">Processing...</span>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <form
                    onSubmit={handleSubmit}
                    className="p-4 border-t border-white/10"
                    style={{
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
                    }}
                  >
                    <div className="relative flex items-center gap-2">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2.5 rounded-lg
                          bg-white/5 border border-glass
                          text-kronos-text-primary text-sm placeholder-kronos-text-secondary/60
                          focus:outline-none focus:border-white/20 focus:bg-white/10
                          transition-all duration-300
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="p-2.5 rounded-lg
                          bg-white border border-glass
                          text-kronos-obsidian
                          hover:bg-white/10
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-300"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Prism edge effect */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: '0 -10px 40px rgba(59, 130, 246, 0.15), 0 -20px 80px rgba(139, 92, 246, 0.1)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WideChatDrawer;
