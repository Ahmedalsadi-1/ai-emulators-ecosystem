'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, spring } from 'motion/react';
import {
  Bot,
  Cpu,
  Activity,
  MessageSquare,
  Send,
  X,
  ChevronRight,
  ChevronDown,
  Monitor,
  Globe,
  Terminal,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Zap,
  Layers,
  Command,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  text: string;
  timestamp: string;
}

interface TraceEntry {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input: string;
  output?: string;
  timestamp: string;
}

interface Controller {
  id: string;
  label: string;
  isActive: boolean;
  status?: 'connected' | 'disconnected' | 'error';
}

interface DesktopSession {
  id: string;
  name: string;
  type: 'bytebot' | 'debian' | 'kali' | 'browseros';
  status: 'running' | 'exited' | 'unknown';
}

interface ExtensionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeButtonId: string;
  messages: { id: string; role: string; text: string; time: string }[];
  traceEntries: { id: string; label: string; kind: string; isError?: boolean; details?: string; time: string }[];
  controllers: { id: string; isActive: boolean }[];
  controllerOptions: { id: string; label: string }[];
  activeControllerIds: string[];
  primaryControllerId?: string;
  onToggleController: (id: string, multiSelect?: boolean) => void;
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  sessions: DesktopSession[];
  activeWorkspace: string;
  workspaces: { id: string; label: string; screen: string; sessionId?: string }[];
  onSwitchWorkspace: (id: string) => void;
}

type TabType = 'chat' | 'trace' | 'controllers' | 'desktop';

// Mesh gradient background component
function MeshGradient({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-kronos-obsidian" />
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.06) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(255, 255, 255, 0.05) 0px, transparent 50%),
            radial-gradient(at 50% 100%, rgba(255, 255, 255, 0.04) 0px, transparent 50%),
            radial-gradient(at 80% 80%, rgba(255, 255, 255, 0.03) 0px, transparent 50%)
          `,
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 100%', '100% 0%', '0% 0%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}

// Glass card component
function GlassCard({ children, className = '', hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-white/8 to-white/3
        backdrop-blur-glass
        border border-glass
        rounded-xl
        shadow-glass-sm
        ${hover ? 'hover:from-white/10 hover:to-white/5 hover:border-white/15 transition-all duration-300' : ''}
        ${className}
      `}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Tab button component
function TabButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-1 px-4 py-3 rounded-lg
        transition-all duration-300
        ${isActive ? 'text-kronos-text-primary' : 'text-kronos-text-secondary hover:text-kronos-text-primary hover:bg-white/5'}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-lg"
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <div className="w-5 h-5 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </motion.button>
  );
}

// Chat Tab Component
function ChatTab({
  messages,
  onSend,
  isProcessing,
}: {
  messages: { id: string; role: string; text: string; time: string }[];
  onSend: (message: string) => void;
  isProcessing: boolean;
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/10 border border-glass flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-kronos-text-secondary" />
              </div>
              <h3 className="text-kronos-text-primary font-medium mb-1">AI Assistant</h3>
              <p className="text-kronos-text-secondary/60 text-sm">Start a conversation with your AI agent</p>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`
                  max-w-[85%] p-3 rounded-xl
                  ${msg.role === 'user'
                    ? 'ml-auto bg-white/10 border border-white/20'
                    : msg.role === 'tool'
                    ? 'ml-auto bg-white/10 border border-white/20'
                    : 'mr-auto bg-white/5 border border-glass'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${
                    msg.role === 'user' ? 'text-kronos-text-secondary' :
                    msg.role === 'tool' ? 'text-kronos-text-secondary' :
                    'text-kronos-status-green'
                  }`}>
                    {msg.role === 'user' ? 'You' : msg.role === 'tool' ? 'Tool' : 'Bytebot'}
                  </span>
                  <span className="text-[10px] text-kronos-text-secondary/50">{msg.time}</span>
                </div>
                <p className="text-sm text-kronos-text-secondary leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400"
                  animate={{ y: [-4, 0, -4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs">Thinking...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-glass">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isProcessing}
            className="w-full px-4 py-3 pr-12 rounded-lg
              bg-white/5 border border-glass
              text-kronos-text-primary placeholder-kronos-text-secondary/60
              focus:outline-none focus:border-white/20 focus:bg-white/10
              transition-all duration-300
              disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2
              rounded-lg bg-white/10 border border-glass text-kronos-obsidian
              hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

// Trace Timeline Tab Component
function TraceTab({
  traces,
}: {
  traces: { id: string; label: string; kind: string; isError?: boolean; details?: string; time: string }[];
}) {
  const getStatusIcon = (kind: string, isError?: boolean) => {
    if (kind === 'tool_result' && !isError) {
      return <CheckCircle2 className="w-4 h-4 text-kronos-status-green" />;
    }
    if (isError) {
      return <AlertCircle className="w-4 h-4 text-kronos-text-secondary/70" />;
    }
    if (kind === 'tool_use') {
      return <Clock className="w-4 h-4 text-kronos-text-secondary/70" />;
    }
    return <Circle className="w-4 h-4 text-kronos-text-secondary/40" />;
  };

  const getStatusColor = (kind: string, isError?: boolean) => {
    if (kind === 'tool_result' && !isError) return 'border-kronos-status-green/50 bg-kronos-status-green/10';
    if (isError) return 'border-white/20 bg-white/10';
    if (kind === 'tool_use') return 'border-white/20 bg-white/10';
    return 'border-glass bg-white/5';
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {traces.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-glass flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-kronos-text-secondary" />
          </div>
          <h3 className="text-kronos-text-primary font-medium mb-1">No Activity Yet</h3>
          <p className="text-kronos-text-secondary/60 text-sm">Tool traces will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline line */}
          <div className="absolute left-8 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-glass to-transparent" />

          {traces.map((trace, index) => (
            <motion.div
              key={trace.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4"
            >
              {/* Status indicator */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getStatusColor(trace.kind, trace.isError)}`}>
                  {getStatusIcon(trace.kind, trace.isError)}
                </div>
              </div>

              {/* Content card */}
              <GlassCard className="flex-1 p-3" hover>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-kronos-text-primary">{trace.label}</span>
                    <span className="text-[10px] text-kronos-text-secondary/50 ml-2">{trace.time}</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    trace.kind === 'tool_result' && !trace.isError ? 'bg-kronos-status-green/20 text-kronos-status-green' :
                    trace.isError ? 'bg-white/20 text-kronos-text-secondary' :
                    trace.kind === 'tool_use' ? 'bg-white/20 text-kronos-text-secondary' :
                    'bg-white/10 text-kronos-text-secondary/60'
                  }`}>
                    {trace.isError ? 'error' : trace.kind === 'tool_result' ? 'success' : trace.kind === 'tool_use' ? 'running' : 'pending'}
                  </span>
                </div>
                {trace.details && (
                  <p className="text-xs text-kronos-text-secondary/70 font-mono bg-white/5 rounded-lg p-2 mt-2">
                    {trace.details.length > 200 ? trace.details.slice(0, 200) + '...' : trace.details}
                  </p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Controllers Slash Command Tab Component
function ControllersTab({
  controllers,
  controllerOptions,
  activeControllerIds,
  onToggle,
}: {
  controllers: { id: string; isActive: boolean }[];
  controllerOptions: { id: string; label: string }[];
  activeControllerIds: string[];
  onToggle: (id: string) => void;
}) {
  const [command, setCommand] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const availableCommands = [
    { command: '/bytebot', label: 'Bytebot Desktop', description: 'Primary AI desktop' },
    { command: '/local-screen', label: 'Local Screen', description: 'Control local screen' },
    { command: '/browseros', label: 'BrowserOS', description: 'Web automation browser' },
    { command: '/turix', label: 'Turix', description: 'Turix automation' },
    { command: '/factif-ai', label: 'Factif-AI', description: 'Factif AI agent' },
    { command: '/open-interface', label: 'Open Interface', description: 'Open interface control' },
  ];

  const filteredCommands = availableCommands.filter(cmd =>
    cmd.command.toLowerCase().includes(command.toLowerCase()) ||
    cmd.label.toLowerCase().includes(command.toLowerCase())
  );

  const handleCommandSelect = (cmd: string) => {
    const controllerId = cmd.replace('/', '');
    onToggle(controllerId);
    setCommand('');
    setShowSuggestions(false);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Command Input */}
      <div className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Command className="w-4 h-4 text-gray-500" />
        </div>
        <input
          type="text"
          value={command}
          onChange={(e) => {
            setCommand(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Type a command..."
          className="w-full pl-10 pr-4 py-3 rounded-lg
            bg-white/5 border border-glass
            text-kronos-text-primary placeholder-kronos-text-secondary/60
            focus:outline-none focus:border-white/20 focus:bg-white/10
            transition-all duration-300"
        />

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && command.startsWith('/') && filteredCommands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2
                bg-kronos-glass backdrop-blur-glass
                border border-glass rounded-lg
                overflow-hidden shadow-glass-md z-50"
            >
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => handleCommandSelect(cmd.command)}
                  className="w-full px-4 py-3 flex items-center gap-3
                    hover:bg-white/5 transition-colors
                    border-b border-glass last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-glass flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-kronos-text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-kronos-text-primary">{cmd.label}</div>
                    <div className="text-xs text-kronos-text-secondary/60">{cmd.description}</div>
                  </div>
                  <code className="text-xs text-kronos-text-secondary font-mono">{cmd.command}</code>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Controllers */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-xs font-medium uppercase tracking-wider text-kronos-text-secondary/70 mb-3">Active Controllers</h4>
        <div className="space-y-2">
          {controllerOptions.map((option) => {
            const isActive = activeControllerIds.includes(option.id);
            return (
              <motion.button
                key={option.id}
                onClick={() => onToggle(option.id)}
                className={`
                  w-full p-3 rounded-lg flex items-center gap-3
                  border transition-all duration-300
                  ${isActive
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/5 border-glass hover:bg-white/10 hover:border-white/20'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive
                    ? 'bg-white/15 border border-white/20'
                    : 'bg-white/10 border border-glass'
                }`}>
                  <Cpu className={`w-5 h-5 ${isActive ? 'text-kronos-status-green' : 'text-kronos-text-secondary'}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-kronos-text-primary">{option.label}</div>
                  <div className="text-xs text-kronos-text-secondary/60 capitalize">{isActive ? 'Active' : 'Inactive'}</div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-kronos-status-green" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Desktop Tab Component
function DesktopTab({
  sessions,
  workspaces,
  activeWorkspace,
  onSwitchWorkspace,
}: {
  sessions: DesktopSession[];
  workspaces: { id: string; label: string; screen: string; sessionId?: string }[];
  activeWorkspace: string;
  onSwitchWorkspace: (id: string) => void;
}) {
  const getDesktopIcon = (screen: string) => {
    switch (screen) {
      case 'kali': return Terminal;
      case 'debian': return Monitor;
      case 'browseros': return Globe;
      default: return Monitor;
    }
  };

  const getDesktopColor = (screen: string) => {
    switch (screen) {
      case 'kali': return 'from-red-500/30 to-orange-500/20 border-red-500/30';
      case 'debian': return 'from-blue-500/30 to-cyan-500/20 border-blue-500/30';
      case 'browseros': return 'from-purple-500/30 to-pink-500/20 border-purple-500/30';
      default: return 'from-green-500/30 to-emerald-500/20 border-green-500/30';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <h4 className="text-xs font-medium uppercase tracking-wider text-kronos-text-secondary/70 mb-3">Available Desktops</h4>
      <div className="grid grid-cols-2 gap-3">
        {workspaces.map((workspace) => {
          const Icon = getDesktopIcon(workspace.screen);
          const isActive = activeWorkspace === workspace.id;
          const session = sessions.find(s => s.id === workspace.sessionId);

          return (
            <motion.button
              key={workspace.id}
              onClick={() => onSwitchWorkspace(workspace.id)}
              className={`
                relative p-4 rounded-xl flex flex-col items-center gap-2
                border transition-all duration-300 overflow-hidden
                ${isActive
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-glass hover:bg-white/10 hover:border-white/20'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getDesktopColor(workspace.screen)} opacity-40`} />

              <div className={`relative z-10 w-12 h-12 rounded-lg bg-white/10 border border-glass flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-kronos-text-primary" />
              </div>

              <span className="relative z-10 text-sm font-medium text-kronos-text-primary">{workspace.label}</span>

              <span className={`relative z-10 text-[10px] px-2 py-0.5 rounded-full ${
                session?.status === 'running'
                  ? 'bg-kronos-status-green/20 text-kronos-status-green'
                  : 'bg-white/10 text-kronos-text-secondary/60'
              }`}>
                {session?.status === 'running' ? 'Active' : 'Ready'}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeDesktop"
                  className="absolute inset-0 border border-white/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Main Extension Popup Component
export function ExtensionPopup({
  isOpen,
  onClose,
  activeButtonId,
  messages,
  traceEntries,
  controllers,
  controllerOptions,
  activeControllerIds,
  primaryControllerId,
  onToggleController,
  onSendMessage,
  isProcessing,
  sessions,
  activeWorkspace,
  workspaces,
  onSwitchWorkspace,
}: ExtensionPopupProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // Set initial tab based on button clicked
  useEffect(() => {
    if (activeButtonId === 'agent') setActiveTab('chat');
    else if (activeButtonId === 'controllers') setActiveTab('controllers');
    else if (activeButtonId === 'trace') setActiveTab('trace');
    else if (activeButtonId === 'chat') setActiveTab('chat');
  }, [activeButtonId]);

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: '#8b5cf6' },
    { id: 'trace', label: 'Trace', icon: Activity, color: '#f59e0b' },
    { id: 'controllers', label: 'Controllers', icon: Cpu, color: '#3b82f6' },
    { id: 'desktop', label: 'Desktop', icon: Layers, color: '#10b981' },
  ];

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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />

            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 80 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed left-16 top-1/2 -translate-y-1/2
                w-[420px] h-[560px] max-h-[calc(100vh-100px)]
                z-50"
            >
              {/* Glassmorphic container */}
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                {/* Mesh gradient background */}
                <MeshGradient className="rounded-xl" />

                {/* Main glass card */}
                <div className="relative w-full h-full
                  bg-gradient-to-br from-white/8 via-white/3 to-transparent
                  backdrop-blur-glass
                  border border-glass
                  rounded-xl
                  shadow-glass-md
                  overflow-hidden">

                  {/* Header */}
                  <div className="relative px-4 py-3 border-b border-glass flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-glass flex items-center justify-center">
                        <Bot className="w-4 h-4 text-kronos-text-primary" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-kronos-text-primary">KRONOS-OS</h2>
                        <p className="text-[10px] text-kronos-text-secondary">AI Desktop Assistant</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-kronos-text-secondary hover:text-kronos-text-primary transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="relative px-2 py-2 border-b border-glass">
                    <div className="flex items-center justify-between gap-1">
                      {tabs.map((tab) => (
                        <TabButton
                          key={tab.id}
                          icon={tab.icon}
                          label={tab.label}
                          isActive={activeTab === tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          color={tab.color}
                        />
                      ))}
                    </div>
                  </div>

                {/* Content */}
                <div className="relative h-[calc(100%-120px)] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeTab === 'chat' && (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute inset-0"
                      >
                        <ChatTab
                          messages={messages}
                          onSend={onSendMessage}
                          isProcessing={isProcessing}
                        />
                      </motion.div>
                    )}
                    {activeTab === 'trace' && (
                      <motion.div
                        key="trace"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute inset-0"
                      >
                        <TraceTab traces={traceEntries} />
                      </motion.div>
                    )}
                    {activeTab === 'controllers' && (
                      <motion.div
                        key="controllers"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute inset-0"
                      >
                        <ControllersTab
                          controllers={controllers}
                          controllerOptions={controllerOptions}
                          activeControllerIds={activeControllerIds}
                          onToggle={(id) => onToggleController(id)}
                        />
                      </motion.div>
                    )}
                    {activeTab === 'desktop' && (
                      <motion.div
                        key="desktop"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute inset-0"
                      >
                        <DesktopTab
                          sessions={sessions}
                          workspaces={workspaces}
                          activeWorkspace={activeWorkspace}
                          onSwitchWorkspace={onSwitchWorkspace}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer status bar */}
                <div className="absolute bottom-0 inset-x-0 px-4 py-2
                  bg-black/20 border-t border-glass
                  flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-kronos-status-green" />
                    <span className="text-[10px] text-kronos-text-secondary">Online</span>
                  </div>
                  <span className="text-[10px] text-kronos-text-secondary/50">KRONOS-OS v2.0</span>
                </div>
              </div>

              {/* Prism edge effect */}
              <div className="absolute inset-0 rounded-xl pointer-events-none
                shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ExtensionPopup;
