import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatSpacePanelProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

export function ChatSpacePanel({ onSendMessage, isProcessing }: ChatSpacePanelProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-space-panel">
      <div className="mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Chat
        </span>
      </div>
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter your task..."
          disabled={isProcessing}
          className="w-full h-24 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-3 text-xs text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-[#4a4a4a] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="absolute bottom-3 right-3 p-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-gray-400 hover:text-white hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send size={14} />
        </button>
      </form>
      {isProcessing && (
        <div className="mt-2 text-[10px] text-amber-400 text-center uppercase tracking-wide">
          Processing...
        </div>
      )}
    </div>
  );
}
