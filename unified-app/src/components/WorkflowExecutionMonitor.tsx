import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WorkflowSpec, TaskSpec } from '@/hooks/useWorkflowCommunication';

interface WorkflowExecutionMonitorProps {
  workflows: WorkflowSpec[];
  tasks: TaskSpec[];
  className?: string;
}

interface ExecutionMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  totalTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgExecutionTime: number;
}

export function WorkflowExecutionMonitor({
  workflows,
  tasks,
  className
}: WorkflowExecutionMonitorProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowSpec | null>(null);
  const [metrics, setMetrics] = useState<ExecutionMetrics>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    completedWorkflows: 0,
    failedWorkflows: 0,
    totalTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgExecutionTime: 0
  });

  // Calculate metrics
  useEffect(() => {
    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(w => w.status === 'active').length;
    const completedWorkflows = workflows.filter(w => w.status === 'completed').length;
    const failedWorkflows = workflows.filter(w => w.status === 'error').length;

    const totalTasks = tasks.length;
    const runningTasks = tasks.filter(t => t.status === 'running').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'error').length;

    // Calculate average execution time (mock for now)
    const avgExecutionTime = completedTasks > 0 ? 45.2 : 0; // seconds

    setMetrics({
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
      failedWorkflows,
      totalTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      avgExecutionTime
    });
  }, [workflows, tasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className={cn("bg-bg-card border border-border rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Execution Monitor
        </h3>
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Live
          </div>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{metrics.activeWorkflows}</div>
          <div className="text-sm text-text-muted">Active Workflows</div>
        </div>
        <div className="bg-bg-secondary p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
          <div className="text-sm text-text-muted">Completed Tasks</div>
        </div>
        <div className="bg-bg-secondary p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{metrics.runningTasks}</div>
          <div className="text-sm text-text-muted">Running Tasks</div>
        </div>
        <div className="bg-bg-secondary p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{metrics.failedTasks}</div>
          <div className="text-sm text-text-muted">Failed Tasks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflows List */}
        <div>
          <h4 className="font-medium mb-3">Workflows</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {workflows.length === 0 ? (
              <div className="text-center text-text-muted py-4">
                No workflows running
              </div>
            ) : (
              workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedWorkflow?.id === workflow.id
                      ? "border-accent-primary bg-accent-primary/5"
                      : "border-border hover:bg-bg-hover"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(workflow.status)}
                      <span className="font-medium">{workflow.name}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border",
                      getStatusColor(workflow.status)
                    )}>
                      {workflow.status}
                    </span>
                  </div>
                  <div className="text-sm text-text-muted mt-1">
                    {workflow.agents.length} agents • {workflow.tasks.length} tasks
                  </div>
                  {workflow.lastSynced && (
                    <div className="text-xs text-text-muted mt-1">
                      Synced {workflow.lastSynced.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks List */}
        <div>
          <h4 className="font-medium mb-3">Recent Tasks</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="text-center text-text-muted py-4">
                No tasks executed
              </div>
            ) : (
              tasks.slice(-10).reverse().map((task) => (
                <div
                  key={task.id}
                  className="p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status)}
                      <span className="font-medium text-sm">{task.name}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border",
                      getStatusColor(task.status)
                    )}>
                      {task.status}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    Agent: {task.agentId} • {task.command}
                  </div>
                  {task.lastSynced && (
                    <div className="text-xs text-text-muted mt-1">
                      {task.lastSynced.toLocaleTimeString()}
                    </div>
                  )}
                  {task.result && (
                    <div className="text-xs text-green-600 mt-1 bg-green-50 p-1 rounded">
                      Result: {typeof task.result === 'string' ? task.result : JSON.stringify(task.result)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Workflow Details */}
      {selectedWorkflow && (
        <div className="mt-6 p-4 bg-bg-secondary rounded-lg">
          <h4 className="font-medium mb-3">Workflow Details: {selectedWorkflow.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="text-sm font-medium text-text-muted mb-2">Agents</h5>
              <div className="space-y-1">
                {selectedWorkflow.agents.map((agent) => (
                  <div key={agent.id} className="text-sm">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-text-muted ml-2">({agent.capabilities.join(', ')})</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-text-muted mb-2">Tasks</h5>
              <div className="space-y-1">
                {selectedWorkflow.tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2 text-sm">
                    {getStatusIcon(task.status)}
                    <span>{task.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-text-muted mb-2">Performance</h5>
              <div className="space-y-1 text-sm">
                <div>Status: <span className="font-medium">{selectedWorkflow.status}</span></div>
                <div>Avg Execution: <span className="font-medium">{formatDuration(metrics.avgExecutionTime)}</span></div>
                <div>Last Sync: <span className="font-medium">
                  {selectedWorkflow.lastSynced?.toLocaleTimeString() || 'Never'}
                </span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {metrics.failedTasks > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-800 text-sm">
            {metrics.failedTasks} task{metrics.failedTasks !== 1 ? 's' : ''} failed. Check logs for details.
          </span>
        </div>
      )}
    </div>
  );
}