"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  X,
  MessageSquare,
  Sparkles,
  Clock,
  User,
  Bot,
  Image as ImageIcon,
} from "lucide-react";
import { KronosLogo } from "@/components/branding/KronosLogo";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  timestamp?: Date;
  image?: string;
  imageLabel?: string;
}

interface OrganizedChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
}

export function OrganizedChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isProcessing = false,
}: OrganizedChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by context
  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const today = new Date();
      const msgDate = msg.timestamp || new Date();
      const isToday =
        msgDate.toDateString() === today.toDateString();

      const dateKey = isToday
        ? "today"
        : msgDate.toLocaleDateString();

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(msg);
      return acc;
    },
    {} as Record<string, ChatMessage[]>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ opacity: 0, x: -400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -400 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-96 bg-kronos-glass backdrop-blur-glass border-r border-glass z-50 flex flex-col shadow-glass-lg"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-glass flex flex-col items-center justify-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-2">
                <img 
                  src="/Desktop/IMG_5467 copy.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to KronosLogo if image fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-400"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>';
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <KronosLogo />
                <div>
                  <h2 className="text-sm font-semibold text-kronos-text-primary">
                    Chat
                  </h2>
                  <p className="text-[10px] text-kronos-text-secondary">
                    {messages.length} messages
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-kronos-text-secondary" />
              </motion.button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageSquare className="w-8 h-8 text-kronos-text-secondary mb-2 opacity-50" />
                  <p className="text-xs text-kronos-text-secondary">
                    Start a conversation
                  </p>
                </div>
              ) : (
                <>
                  {Object.entries(groupedMessages).map(
                    ([dateKey, dateMessages]) => (
                      <div key={dateKey}>
                        {/* Date Separator */}
                        <div className="flex items-center gap-2 my-4 first:mt-0">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-glass to-transparent" />
                          <span className="text-[10px] font-medium uppercase tracking-wider text-kronos-text-secondary px-2">
                            {dateKey === "today"
                              ? "Today"
                              : dateKey}
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-glass to-transparent" />
                        </div>

                        {/* Messages */}
                        {dateMessages.map((msg, idx) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex gap-3 mb-3 ${
                              msg.role === "user"
                                ? "flex-row-reverse"
                                : ""
                            }`}
                          >
                            {/* Avatar */}
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                msg.role === "user"
                                  ? "bg-blue-500/20 border border-blue-500/30"
                                  : "bg-purple-500/20 border border-purple-500/30"
                              }`}
                            >
                              {msg.role === "user" ? (
                                <User className="w-3.5 h-3.5 text-blue-400" />
                              ) : msg.role === "assistant" ? (
                                <Bot className="w-3.5 h-3.5 text-purple-400" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`flex-1 max-w-[280px] ${
                                msg.role === "user"
                                  ? "items-end"
                                  : "items-start"
                              }`}
                            >
                              <motion.div
                                className={`px-3 py-2 rounded-lg border backdrop-blur-glass ${
                                  msg.role === "user"
                                    ? "bg-blue-500/20 border-blue-500/30 text-kronos-text-primary"
                                    : msg.role === "assistant"
                                      ? "bg-purple-500/20 border-purple-500/30 text-kronos-text-primary"
                                      : "bg-green-500/20 border-green-500/30 text-kronos-text-secondary"
                                }`}
                              >
                                {/* Text Content */}
                                {msg.text && (
                                  <p className="text-sm break-words mb-2">
                                    {msg.text}
                                  </p>
                                )}
                                
                                {/* Image Display with Label */}
                                {msg.image && (
                                  <div className="mt-2">
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-kronos-text-secondary mb-1.5 flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      {msg.imageLabel || `Image`}
                                    </div>
                                    <div className="rounded-lg overflow-hidden border border-glass">
                                      <img
                                        src={msg.image}
                                        alt={msg.imageLabel || "Chat image"}
                                        className="w-full h-32 object-contain bg-kronos-obsidian/50"
                                      />
                                    </div>
                                  </div>
                                )}
                              </motion.div>

                              {/* Timestamp */}
                              {msg.timestamp && (
                                <p className="text-[10px] text-kronos-text-secondary mt-1 px-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {msg.timestamp.toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Processing Indicator */}
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <motion.div
                          className="px-3 py-2 rounded-lg border bg-purple-500/20 border-purple-500/30 flex items-center gap-2"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        >
                          <div className="flex gap-1">
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-purple-400"
                              animate={{ scale: [1, 0.5, 1] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                              }}
                            />
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-purple-400"
                              animate={{ scale: [1, 0.5, 1] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.2,
                              }}
                            />
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-purple-400"
                              animate={{ scale: [1, 0.5, 1] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.4,
                              }}
                            />
                          </div>
                          <span className="text-xs text-purple-300">
                            Thinking...
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-4 border-t border-glass bg-kronos-glass/50">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="w-full px-3 py-2 bg-kronos-obsidian/50 border border-glass rounded-lg text-sm text-kronos-text-primary placeholder:text-kronos-text-secondary resize-none focus:outline-none focus:border-purple-500/50 transition-colors max-h-24"
                    rows={1}
                  />
                </div>
                <motion.button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isProcessing}
                  className="p-2 rounded-lg bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
