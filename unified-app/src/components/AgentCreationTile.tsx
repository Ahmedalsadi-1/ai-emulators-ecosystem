import React, { useState } from 'react';
import { Play, RotateCcw, Settings, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { authenticatedFetch } from '@/hooks/useAuth';

interface AgentCreationTileProps {
  onAgentCreated: (agentId: string) => void;
  className?: string;
}

interface AgentCreationState {
  status: 'idle' | 'running' | 'success' | 'error';
  progress: number;
  currentStep: string;
  agentId?: string;
}

export const AgentCreationTile: React.FC<AgentCreationTileProps> = ({
  onAgentCreated,
  className
}) => {
  const [agentName, setAgentName] = useState('');
  const [personality, setPersonality] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [schedule, setSchedule] = useState('');
  const [state, setState] = useState<AgentCreationState>({
    status: 'idle',
    progress: 0,
    currentStep: 'Ready to create agent'
  });

  // Integration with agent-skills-system and AIOS
  const createAgent = async () => {
    setState({ status: 'running', progress: 0, currentStep: 'Initializing...' });

    try {
      // Step 1: Validate inputs
      setState(prev => ({ ...prev, progress: 20, currentStep: 'Validating inputs...' }));

      // Step 2: Create agent profile via agent-skills-system
      setState(prev => ({ ...prev, progress: 40, currentStep: 'Creating agent profile...' }));

      const response = await authenticatedFetch('/api/workflows/agent-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentSpec: {
            name: agentName,
            personality: { communicationStyle: personality },
            capabilities,
            template: 'custom'
          },
          schedule: schedule ? { cron: schedule, enabled: true } : { enabled: false }
        })
      });

      if (!response.ok) throw new Error('Failed to create agent');

      const result = await response.json();

      // Step 3: Register with AIOS
      setState(prev => ({ ...prev, progress: 70, currentStep: 'Registering with AIOS...' }));

      await authenticatedFetch(`/api/aios/agents/${result.agentId}/register`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capabilities,
          personality: { communicationStyle: personality }
        })
      });

      // Step 4: Complete
      setState({
        status: 'success',
        progress: 100,
        currentStep: 'Agent created successfully',
        agentId: result.agentId
      });

      onAgentCreated(result.agentId);

    } catch (error) {
      setState({
        status: 'error',
        progress: 0,
        currentStep: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const resetTile = () => {
    setState({
      status: 'idle',
      progress: 0,
      currentStep: 'Ready to create agent'
    });
    setAgentName('');
    setPersonality('');
    setCapabilities([]);
    setSchedule('');
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'running': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'running': return 'Creating...';
      case 'success': return 'Completed';
      case 'error': return 'Failed';
      default: return 'Ready';
    }
  };

  return (
    <div className={cn("relative bg-bg-card border border-border rounded-lg p-4", className)}>
      <div className="flex flex-row items-center pb-2 mb-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <h3 className="text-lg font-semibold">🤖 Create Agent</h3>
        </div>
        <div className="ml-auto px-2 py-1 text-xs border border-border rounded">
          {getStatusText()}
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        {state.status === 'running' && (
          <div className="space-y-2">
            <div className="w-full bg-bg-secondary rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="text-sm text-text-muted">{state.currentStep}</p>
          </div>
        )}

        {/* Agent Configuration Form */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g., Web Development Agent"
              disabled={state.status === 'running'}
              className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary placeholder-text-muted disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Personality</label>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              disabled={state.status === 'running'}
              className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary disabled:opacity-50"
            >
              <option value="">Select communication style</option>
              <option value="technical">Technical</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capabilities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['JavaScript', 'React', 'Python', 'Web Development'].map(capability => (
                <button
                  key={capability}
                  onClick={() => {
                    setCapabilities(prev =>
                      prev.includes(capability)
                        ? prev.filter(c => c !== capability)
                        : [...prev, capability]
                    );
                  }}
                  disabled={state.status === 'running'}
                  className={cn(
                    "px-3 py-1 text-sm border border-border rounded transition-colors disabled:opacity-50",
                    capabilities.includes(capability)
                      ? "bg-accent-primary text-bg-primary"
                      : "hover:bg-bg-hover"
                  )}
                >
                  {capability}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Schedule (Cron)</label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g., 0 9 * * 1 (weekly)"
              disabled={state.status === 'running'}
              className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary placeholder-text-muted disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4 pt-4 border-t border-border">
        <div className="flex space-x-2">
          <button
            onClick={createAgent}
            disabled={!agentName || !personality || state.status === 'running'}
            className="flex items-center space-x-1 px-3 py-2 bg-accent-primary text-bg-primary rounded hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span>Create Agent</span>
          </button>

          {state.status === 'success' && (
            <button onClick={resetTile} className="flex items-center px-3 py-2 border border-border rounded hover:bg-bg-hover transition-colors">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-2 border border-border rounded hover:bg-bg-hover transition-colors disabled:opacity-50" disabled={state.status === 'running'}>
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </button>
          <button className="flex items-center px-3 py-2 border border-border rounded hover:bg-bg-hover transition-colors disabled:opacity-50" disabled={state.status === 'running'}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success State */}
      {state.status === 'success' && state.agentId && (
        <div className="absolute inset-0 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-green-600 text-2xl mb-2">✓</div>
            <p className="text-green-800 font-medium">Agent Created Successfully!</p>
            <p className="text-green-600 text-sm">ID: {state.agentId}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {state.status === 'error' && (
        <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-2xl mb-2">✗</div>
            <p className="text-red-800 font-medium">Creation Failed</p>
            <p className="text-red-600 text-sm">{state.currentStep}</p>
            <button onClick={resetTile} className="mt-2 px-3 py-1 border border-border rounded hover:bg-bg-hover transition-colors">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};