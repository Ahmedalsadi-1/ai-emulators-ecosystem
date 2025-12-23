import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore, createAuthenticatedWebSocket, authenticatedFetch } from './useAuth';

export interface WorkflowMessage {
  type: 'workflow_created' | 'agent_created' | 'task_executed' | 'status_update' | 'error' | 'system';
  payload: any;
  timestamp: Date;
  source: 'vy' | 'aios';
}

export interface AgentSpec {
  id: string;
  name: string;
  personality: { communicationStyle: string };
  capabilities: string[];
  schedule?: { cron: string; enabled: boolean };
  lastSynced?: Date;
}

export interface WorkflowSpec {
  id: string;
  name: string;
  agents: AgentSpec[];
  tasks: TaskSpec[];
  status: 'draft' | 'active' | 'completed' | 'error';
  lastSynced?: Date;
}

export interface TaskSpec {
  id: string;
  name: string;
  agentId: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  lastSynced?: Date;
}

export interface CommunicationState {
  vyConnected: boolean;
  aiosConnected: boolean;
  workflows: WorkflowSpec[];
  agents: AgentSpec[];
  tasks: TaskSpec[];
  messages: WorkflowMessage[];
  isLoading: boolean;
  error: string | null;
  lastSyncTimestamp: Date | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

export const useWorkflowCommunication = () => {
  const [state, setState] = useState<CommunicationState>({
    vyConnected: false,
    aiosConnected: false,
    workflows: [],
    agents: [],
    tasks: [],
    messages: [],
    isLoading: false,
    error: null,
    lastSyncTimestamp: null,
    syncStatus: 'idle'
  });

  const vyWsRef = useRef<WebSocket | null>(null);
  const aiosWsRef = useRef<WebSocket | null>(null);
  const vyEventSourceRef = useRef<EventSource | null>(null);

  const addMessage = useCallback((type: WorkflowMessage['type'], content: string, source: 'vy' | 'aios') => {
    const message: WorkflowMessage = {
      type,
      payload: { content },
      timestamp: new Date(),
      source
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages.slice(-99), message] // Keep last 100 messages
    }));
  }, []);

  // Initialize connections
  useEffect(() => {
    connectToVy();
    connectToAIOS();

    return () => {
      disconnect();
    };
  }, []);

  const connectToVy = useCallback(() => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      addMessage('error', 'Authentication required for Vy connection', 'vy');
      return;
    }

    try {
      // Try authenticated WebSocket first for Vy
      const vyWs = createAuthenticatedWebSocket('ws://localhost:3005/api/workflows/ws');

      vyWs.onopen = () => {
        setState(prev => ({ ...prev, vyConnected: true }));
        addMessage('system', 'Connected to Vy workflows', 'vy');
      };

      vyWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle auth confirmation
        if (data.type === 'authenticated') {
          addMessage('system', 'Vy authentication successful', 'vy');
          return;
        }
        if (data.type === 'auth_failed') {
          addMessage('error', 'Vy authentication failed', 'vy');
          vyWs.close();
          return;
        }
        handleVyMessage(data);
      };

      vyWs.onclose = () => {
        setState(prev => ({ ...prev, vyConnected: false }));
        addMessage('system', 'Disconnected from Vy workflows', 'vy');
        // Fallback to EventSource
        connectVyEventSource();
      };

      vyWs.onerror = () => {
        addMessage('error', 'Vy WebSocket connection failed', 'vy');
        connectVyEventSource();
      };

      vyWsRef.current = vyWs;
    } catch (error) {
      addMessage('error', `Vy connection failed: ${error}`, 'vy');
      connectVyEventSource();
    }
  }, [addMessage]);

  const connectVyEventSource = useCallback(() => {
    try {
      const eventSource = new EventSource('http://localhost:3005/api/workflows/events');

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleVyMessage(data);
      };

      eventSource.onerror = () => {
        addMessage('error', 'Vy EventSource connection failed', 'vy');
      };

      vyEventSourceRef.current = eventSource;
      setState(prev => ({ ...prev, vyConnected: true }));
      addMessage('system', 'Connected to Vy workflows (EventSource)', 'vy');
    } catch (error) {
      addMessage('error', `Vy EventSource failed: ${error}`, 'vy');
    }
  }, []);

  const connectToAIOS = useCallback(() => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      addMessage('error', 'Authentication required for AIOS connection', 'aios');
      return;
    }

    try {
      const aiosWs = createAuthenticatedWebSocket('ws://localhost:8000/ws');

      aiosWs.onopen = () => {
        setState(prev => ({ ...prev, aiosConnected: true }));
        addMessage('system', 'Connected to AIOS terminal', 'aios');
      };

      aiosWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle auth confirmation
        if (data.type === 'authenticated') {
          addMessage('system', 'AIOS authentication successful', 'aios');
          return;
        }
        if (data.type === 'auth_failed') {
          addMessage('error', 'AIOS authentication failed', 'aios');
          aiosWs.close();
          return;
        }
        handleAIOSMessage(data);
      };

      aiosWs.onclose = () => {
        setState(prev => ({ ...prev, aiosConnected: false }));
        addMessage('system', 'Disconnected from AIOS terminal', 'aios');
      };

      aiosWs.onerror = () => {
        addMessage('error', 'AIOS WebSocket connection failed', 'aios');
      };

      aiosWsRef.current = aiosWs;
    } catch (error) {
      addMessage('error', `AIOS connection failed: ${error}`, 'aios');
    }
  }, [addMessage]);

  const disconnect = useCallback(() => {
    if (vyWsRef.current) {
      vyWsRef.current.close();
    }
    if (aiosWsRef.current) {
      aiosWsRef.current.close();
    }
    if (vyEventSourceRef.current) {
      vyEventSourceRef.current.close();
    }
  }, []);



  const handleVyMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'agent_created':
        setState(prev => ({
          ...prev,
          agents: resolveAgentConflict(prev.agents, data.agent)
        }));
        addMessage('agent_created', `Agent ${data.agent.name} created`, 'vy');
        break;

      case 'workflow_created':
        setState(prev => ({
          ...prev,
          workflows: resolveWorkflowConflict(prev.workflows, data.workflow)
        }));
        addMessage('workflow_created', `Workflow ${data.workflow.name} created`, 'vy');
        break;

      case 'task_update':
        setState(prev => ({
          ...prev,
          tasks: resolveTaskConflict(prev.tasks, data.task)
        }));
        addMessage('status_update', `Task ${data.task.name} ${data.task.status}`, 'vy');
        break;

      case 'state_changed':
        // Full state sync triggered
        addMessage('status_update', 'Vy state changed, sync recommended', 'vy');
        break;

      default:
        addMessage('status_update', `Vy: ${JSON.stringify(data)}`, 'vy');
    }
  }, [addMessage, state.aiosConnected]);

  const handleAIOSMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'command_output':
        addMessage('status_update', `AIOS: ${data.output}`, 'aios');
        break;

      case 'agent_registered':
        setState(prev => ({
          ...prev,
          agents: prev.agents.map(agent =>
            agent.id === data.agentId
              ? { ...agent, status: 'registered' }
              : agent
          )
        }));
        addMessage('status_update', `Agent ${data.agentId} registered with AIOS`, 'aios');
        break;

      case 'task_completed':
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === data.taskId
              ? { ...task, status: 'completed', result: data.result }
              : task
          )
        }));
        addMessage('task_executed', `Task ${data.taskId} completed`, 'aios');
        break;

      default:
        addMessage('status_update', `AIOS: ${JSON.stringify(data)}`, 'aios');
    }
  }, [addMessage]);

  // Communication methods
  const createWorkflow = useCallback(async (workflowSpec: Omit<WorkflowSpec, 'id' | 'status'>) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await authenticatedFetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowSpec)
      });

      if (!response.ok) throw new Error('Failed to create workflow');

      const workflow = await response.json();

      // Send to AIOS for execution
      if (aiosWsRef.current && aiosWsRef.current.readyState === WebSocket.OPEN) {
        aiosWsRef.current.send(JSON.stringify({
          type: 'workflow_created',
          workflow
        }));
      }

      setState(prev => ({
        ...prev,
        workflows: [...prev.workflows, workflow],
        isLoading: false
      }));

      addMessage('workflow_created', `Workflow ${workflow.name} created`, 'vy');
      return workflow;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
      throw error;
    }
  }, [addMessage]);

  const executeTask = useCallback(async (taskSpec: Omit<TaskSpec, 'id' | 'status' | 'result'>) => {
    if (!aiosWsRef.current || aiosWsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('AIOS not connected');
    }

    const task: TaskSpec = {
      ...taskSpec,
      id: `task-${Date.now()}`,
      status: 'running'
    };

    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }));

    aiosWsRef.current.send(JSON.stringify({
      type: 'execute_task',
      task
    }));

    addMessage('status_update', `Task ${task.name} started`, 'aios');
    return task;
  }, [addMessage]);

  const registerAgent = useCallback(async (agentSpec: AgentSpec) => {
    if (!aiosWsRef.current || aiosWsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('AIOS not connected');
    }

    aiosWsRef.current.send(JSON.stringify({
      type: 'register_agent',
      agent: agentSpec
    }));

    addMessage('status_update', `Agent ${agentSpec.name} registration sent to AIOS`, 'aios');
  }, [addMessage]);

  // Conflict resolution helpers
  const resolveAgentConflict = (existingAgents: AgentSpec[], newAgent: AgentSpec): AgentSpec[] => {
    const existingIndex = existingAgents.findIndex(a => a.id === newAgent.id);
    if (existingIndex >= 0) {
      // Merge with existing, preferring newer data
      const existing = existingAgents[existingIndex];
      const merged = {
        ...existing,
        ...newAgent,
        lastSynced: new Date(),
        // Resolve conflicts based on timestamps or priority
        capabilities: Array.from(new Set([...existing.capabilities, ...newAgent.capabilities]))
      };
      const updated = [...existingAgents];
      updated[existingIndex] = merged;
      return updated;
    }
    return [...existingAgents, { ...newAgent, lastSynced: new Date() }];
  };

  const resolveWorkflowConflict = (existingWorkflows: WorkflowSpec[], newWorkflow: WorkflowSpec): WorkflowSpec[] => {
    const existingIndex = existingWorkflows.findIndex(w => w.id === newWorkflow.id);
    if (existingIndex >= 0) {
      // Merge workflow data
      const existing = existingWorkflows[existingIndex];
      const merged = {
        ...existing,
        ...newWorkflow,
        lastSynced: new Date()
      };
      const updated = [...existingWorkflows];
      updated[existingIndex] = merged;
      return updated;
    }
    return [...existingWorkflows, { ...newWorkflow, lastSynced: new Date() }];
  };

  const resolveTaskConflict = (existingTasks: TaskSpec[], newTask: TaskSpec): TaskSpec[] => {
    const existingIndex = existingTasks.findIndex(t => t.id === newTask.id);
    if (existingIndex >= 0) {
      // Update task with latest status
      const existing = existingTasks[existingIndex];
      const merged = {
        ...existing,
        ...newTask,
        lastSynced: new Date()
      };
      const updated = [...existingTasks];
      updated[existingIndex] = merged;
      return updated;
    }
    return [...existingTasks, { ...newTask, lastSynced: new Date() }];
  };

  // State synchronization
  const syncVyState = useCallback(async () => {
    if (!state.vyConnected) return;

    try {
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));

      // Get current state from Vy
      const vyResponse = await authenticatedFetch('/api/workflows/state');
      const vyState = await vyResponse.json();

      // Sync workflows
      const syncedWorkflows = vyState.workflows.map((workflow: any) => ({
        ...workflow,
        lastSynced: new Date()
      }));

      // Sync agents
      const syncedAgents = vyState.agents.map((agent: any) => ({
        ...agent,
        lastSynced: new Date()
      }));

      setState(prev => ({
        ...prev,
        workflows: syncedWorkflows,
        agents: syncedAgents,
        lastSyncTimestamp: new Date(),
        syncStatus: 'synced'
      }));

      addMessage('system', 'Vy state synchronized', 'vy');
    } catch (error) {
      setState(prev => ({ ...prev, syncStatus: 'error' }));
      addMessage('error', `Vy state sync failed: ${error}`, 'vy');
    }
  }, [state.vyConnected, addMessage]);

  const syncAIOSState = useCallback(async () => {
    if (!state.aiosConnected) return;

    try {
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));

      // Get current state from AIOS
      const aiosResponse = await authenticatedFetch('/api/aios/state');
      const aiosState = await aiosResponse.json();

      // Sync agent statuses
      const syncedAgents = state.agents.map(agent => {
        const aiosAgent = aiosState.agents.find((a: any) => a.id === agent.id);
        return aiosAgent ? { ...agent, ...aiosAgent, lastSynced: new Date() } : agent;
      });

      // Sync task statuses
      const syncedTasks = state.tasks.map(task => {
        const aiosTask = aiosState.tasks.find((t: any) => t.id === task.id);
        return aiosTask ? { ...task, ...aiosTask, lastSynced: new Date() } : task;
      });

      setState(prev => ({
        ...prev,
        agents: syncedAgents,
        tasks: syncedTasks,
        lastSyncTimestamp: new Date(),
        syncStatus: 'synced'
      }));

      addMessage('system', 'AIOS state synchronized', 'aios');
    } catch (error) {
      setState(prev => ({ ...prev, syncStatus: 'error' }));
      addMessage('error', `AIOS state sync failed: ${error}`, 'aios');
    }
  }, [state.aiosConnected, state.agents, state.tasks, addMessage]);

  const fullStateSync = useCallback(async () => {
    await Promise.all([syncVyState(), syncAIOSState()]);
  }, [syncVyState, syncAIOSState]);

  // Auto-sync on connection changes
  useEffect(() => {
    if (state.vyConnected || state.aiosConnected) {
      fullStateSync();
    }
  }, [state.vyConnected, state.aiosConnected, fullStateSync]);

  // Periodic sync
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (state.vyConnected || state.aiosConnected) {
        fullStateSync();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [state.vyConnected, state.aiosConnected, fullStateSync]);

  return {
    state,
    createWorkflow,
    executeTask,
    registerAgent,
    disconnect,
    reconnectVy: connectToVy,
    reconnectAIOS: connectToAIOS,
    syncVyState,
    syncAIOSState,
    fullStateSync
  };
};