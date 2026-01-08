interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  text: string;
  time: string;
}

interface AgentFeedPanelProps {
  messages: Message[];
  onClear: () => void;
}

export function AgentFeedPanel({ messages, onClear }: AgentFeedPanelProps) {
  return (
    <div className="agent-feed-panel">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Agent Feed
        </span>
        <button 
          onClick={onClear}
          className="text-[10px] text-gray-500 hover:text-gray-300 uppercase tracking-wide"
        >
          Clear
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-auto pr-2 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-8">
            No messages yet
          </div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className="p-3 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]"
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[8px] uppercase tracking-wider font-medium ${
                  msg.role === 'USER' ? 'text-blue-400' :
                  msg.role === 'TOOL' ? 'text-amber-400' :
                  'text-green-400'
                }`}>
                  {msg.role}
                </span>
                <span className="text-[8px] text-gray-600">{msg.time}</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{msg.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
