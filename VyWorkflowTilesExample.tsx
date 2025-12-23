import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardActions } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Play, Pause, RotateCcw, Settings } from 'lucide-react';

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

      const response = await fetch('/api/workflows/agent-creation', {
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

      await fetch(`/api/aios/agents/${result.agentId}/register`, {
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
    <Card className={`relative ${className}`}>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <h3 className="text-lg font-semibold">🤖 Create Agent</h3>
        </div>
        <Badge variant="outline" className="ml-auto">
          {getStatusText()}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {state.status === 'running' && (
          <div className="space-y-2">
            <Progress value={state.progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{state.currentStep}</p>
          </div>
        )}

        {/* Agent Configuration Form */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium">Agent Name</label>
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g., Web Development Agent"
              disabled={state.status === 'running'}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Personality</label>
            <Select value={personality} onValueChange={setPersonality} disabled={state.status === 'running'}>
              <SelectTrigger>
                <SelectValue placeholder="Select communication style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Capabilities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['JavaScript', 'React', 'Python', 'Web Development'].map(capability => (
                <Button
                  key={capability}
                  variant={capabilities.includes(capability) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCapabilities(prev =>
                      prev.includes(capability)
                        ? prev.filter(c => c !== capability)
                        : [...prev, capability]
                    );
                  }}
                  disabled={state.status === 'running'}
                >
                  {capability}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Schedule (Cron)</label>
            <Input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g., 0 9 * * 1 (weekly)"
              disabled={state.status === 'running'}
            />
          </div>
        </div>
      </CardContent>

      <CardActions className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            onClick={createAgent}
            disabled={!agentName || !personality || state.status === 'running'}
            className="flex items-center space-x-1"
          >
            <Play className="w-4 h-4" />
            <span>Create Agent</span>
          </Button>

          {state.status === 'success' && (
            <Button onClick={resetTile} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled={state.status === 'running'}>
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </Button>
          <Button variant="outline" size="sm" disabled={state.status === 'running'}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardActions>

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
            <Button onClick={resetTile} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};