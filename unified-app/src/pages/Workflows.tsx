import { useState, useRef, useEffect } from 'react';
import { AgentCreationTile } from '@/components/AgentCreationTile';
import { WorkflowExecutionMonitor } from '@/components/WorkflowExecutionMonitor';
import { useWorkflowCommunication } from '@/hooks/useWorkflowCommunication';
import { Terminal, Settings, Play, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface WorkflowsPageProps {
  className?: string;
}

export function WorkflowsPage({ className }: WorkflowsPageProps) {
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const {
    state: commState,
    executeTask,
    registerAgent
  } = useWorkflowCommunication();

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commState.messages]);

  const executeTerminalCommand = async () => {
    if (!terminalInput.trim() || !commState.aiosConnected) return;

    setIsExecuting(true);

    try {
      await executeTask({
        name: terminalInput,
        agentId: 'terminal-agent',
        command: terminalInput
      });
    } catch (error) {
      // Error will be handled by the communication hook
      console.error('Command execution failed:', error);
    } finally {
      setIsExecuting(false);
      setTerminalInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeTerminalCommand();
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(20, Math.min(80, newPosition)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAgentCreated = async (agentId: string) => {
    try {
      // Register the agent with AIOS
      const agent = commState.agents.find(a => a.id === agentId);
      if (agent) {
        await registerAgent(agent);
      }
    } catch (error) {
      console.error('Failed to register agent with AIOS:', error);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("h-full flex bg-bg-primary", className)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Panel - Vy Workflows */}
      <div
        className="flex flex-col border-r border-border bg-bg-secondary"
        style={{ width: `${splitPosition}%` }}
      >
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Vy Workflows</h2>
          <p className="text-sm text-text-muted">Create and manage agent workflows</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AgentCreationTile onAgentCreated={handleAgentCreated} />

          {/* Additional workflow tiles can be added here */}
          <div className="bg-bg-card border border-border rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Workflow Templates</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="h-20 flex flex-col items-center justify-center border border-border rounded-lg hover:bg-bg-hover transition-colors">
                <Play className="w-6 h-6 mb-2" />
                <span className="text-sm">Task Automation</span>
              </button>
              <button className="h-20 flex flex-col items-center justify-center border border-border rounded-lg hover:bg-bg-hover transition-colors">
                <Settings className="w-6 h-6 mb-2" />
                <span className="text-sm">Data Processing</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Splitter */}
      <div
        className={cn(
          "w-1 bg-border-color hover:bg-accent-primary cursor-col-resize transition-colors",
          isDragging && "bg-accent-primary"
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel - AIOS Terminal */}
      <div
        className="flex flex-col bg-bg-primary"
        style={{ width: `${100 - splitPosition}%` }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-text-primary">AIOS Terminal</h2>
            <div className={cn(
              "w-2 h-2 rounded-full",
              commState.aiosConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-sm text-text-muted">
              {commState.aiosConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 text-sm border border-border rounded hover:bg-bg-hover transition-colors flex items-center"
              onClick={() => {}} // TODO: Implement clear messages
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </button>
            <button
              className="px-3 py-1 text-sm border border-border rounded hover:bg-bg-hover transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {}} // TODO: Implement reconnect
              disabled={commState.aiosConnected}
            >
              <Play className="w-4 h-4 mr-1" />
              Reconnect
            </button>
          </div>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black text-green-400"
        >
          {commState.messages.map((message, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">
                [{message.timestamp.toLocaleTimeString()}]
              </span>{' '}
              <span className={cn(
                message.type === 'error' && "text-red-400",
                message.type === 'system' && "text-yellow-400",
                message.source === 'vy' && "text-blue-400",
                message.source === 'aios' && "text-green-400"
              )}>
                [{message.source.toUpperCase()}] {message.payload.content || JSON.stringify(message.payload)}
              </span>
            </div>
          ))}
        </div>

        {/* Terminal Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-text-muted">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter AIOS command..."
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-text-primary placeholder-text-muted"
              disabled={!commState.aiosConnected || isExecuting}
            />
            <button
              className="px-3 py-1 text-sm bg-accent-primary text-bg-primary rounded hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              onClick={executeTerminalCommand}
              disabled={!terminalInput.trim() || !commState.aiosConnected || isExecuting}
            >
              {isExecuting ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Execution Monitor */}
      <div className="mt-6">
        <WorkflowExecutionMonitor
          workflows={commState.workflows}
          tasks={commState.tasks}
        />
      </div>
    </div>
  );
}