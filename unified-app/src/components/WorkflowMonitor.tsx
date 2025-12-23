import { useState } from 'react';
import { useAutomationWorkflowStore } from '@/hooks/useAutomationWorkflow';
import { useCrossCommunication } from '@/hooks/useCrossCommunication';
import { WorkflowExecution } from '@/hooks/useAutomationWorkflow';

interface WorkflowMonitorProps {
  className?: string;
}

export function WorkflowMonitor({ className = '' }: WorkflowMonitorProps) {
  const workflowStore = useAutomationWorkflowStore();
  const comms = useCrossCommunication();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const workflows = Object.values(workflowStore.workflows);
  const selectedWorkflow = selectedWorkflowId ? workflowStore.workflows[selectedWorkflowId] : null;

  const filteredLogs = selectedWorkflow?.logs.filter(log => {
    if (filterLevel === 'all') return true;
    return log.level === filterLevel;
  }) || [];

  const getStatusColor = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'running': return 'text-status-success';
      case 'completed': return 'text-status-success';
      case 'failed': return 'text-status-error';
      case 'paused': return 'text-status-warning';
      default: return 'text-text-muted';
    }
  };

  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'paused': return '⏸️';
      default: return '⏳';
    }
  };

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return 'Not started';
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const handleWorkflowAction = async (workflowId: string, action: 'start' | 'pause' | 'stop' | 'delete') => {
    switch (action) {
      case 'start':
        await workflowStore.startWorkflow(workflowId);
        break;
      case 'pause':
        workflowStore.pauseWorkflow(workflowId);
        break;
      case 'stop':
        workflowStore.stopWorkflow(workflowId);
        break;
      case 'delete':
        workflowStore.deleteWorkflow(workflowId);
        if (selectedWorkflowId === workflowId) {
          setSelectedWorkflowId(null);
        }
        break;
    }
  };

  return (
    <div className={`bg-bg-primary border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Workflow Monitor</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${comms.isToolConnected('turix') ? 'bg-status-success' : 'bg-status-error'}`} />
              <span className="text-xs text-text-muted">Turix</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${comms.isToolConnected('openinterface') ? 'bg-status-success' : 'bg-status-error'}`} />
              <span className="text-xs text-text-muted">OpenInterface</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${comms.isToolConnected('factif') ? 'bg-status-success' : 'bg-status-error'}`} />
              <span className="text-xs text-text-muted">Factif</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Workflow List */}
        <div className="w-1/3 border-r border-border p-4">
          <h3 className="text-sm font-medium text-text-primary mb-3">Active Workflows</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {workflows.length === 0 ? (
              <p className="text-sm text-text-muted">No workflows</p>
            ) : (
              workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  onClick={() => setSelectedWorkflowId(workflow.id)}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedWorkflowId === workflow.id
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-border hover:bg-bg-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {workflow.name}
                    </span>
                    <span className="text-xs">{getStatusIcon(workflow.status)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDuration(workflow.startTime, workflow.endTime)}
                    </span>
                  </div>
                  <div className="mt-2 flex space-x-1">
                    {workflow.status === 'idle' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkflowAction(workflow.id, 'start');
                        }}
                        className="px-2 py-1 text-xs bg-accent-primary text-white rounded hover:bg-accent-secondary"
                      >
                        Start
                      </button>
                    )}
                    {workflow.status === 'running' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkflowAction(workflow.id, 'pause');
                          }}
                          className="px-2 py-1 text-xs bg-status-warning text-white rounded hover:bg-opacity-80"
                        >
                          Pause
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkflowAction(workflow.id, 'stop');
                          }}
                          className="px-2 py-1 text-xs bg-status-error text-white rounded hover:bg-opacity-80"
                        >
                          Stop
                        </button>
                      </>
                    )}
                    {workflow.status !== 'running' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkflowAction(workflow.id, 'delete');
                        }}
                        className="px-2 py-1 text-xs border border-border text-text-primary rounded hover:bg-bg-secondary"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workflow Details */}
        <div className="flex-1 p-4">
          {selectedWorkflow ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-primary">
                  {selectedWorkflow.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value as any)}
                    className="px-2 py-1 text-xs border border-border rounded bg-bg-primary text-text-primary"
                  >
                    <option value="all">All Logs</option>
                    <option value="info">Info</option>
                    <option value="warn">Warnings</option>
                    <option value="error">Errors</option>
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Progress</span>
                  <span className="text-sm text-text-secondary">
                    {Object.keys(selectedWorkflow.results).length} / {selectedWorkflow.steps.length} steps
                  </span>
                </div>
                <div className="w-full bg-bg-secondary rounded-full h-2">
                  <div
                    className="bg-accent-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(Object.keys(selectedWorkflow.results).length / selectedWorkflow.steps.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Current Step */}
              {selectedWorkflow.currentStep && (
                <div className="mb-4 p-3 bg-bg-secondary rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-text-primary">Current Step:</span>
                    <span className="text-sm text-accent-primary">
                      {selectedWorkflow.steps.find(s => s.id === selectedWorkflow.currentStep)?.action}
                    </span>
                  </div>
                </div>
              )}

              {/* Logs */}
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-medium text-text-primary mb-2">Logs</h4>
                <div className="h-64 overflow-y-auto border border-border rounded-md bg-bg-secondary">
                  {filteredLogs.length === 0 ? (
                    <div className="p-4 text-center text-text-muted">
                      No logs available
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredLogs.slice(-50).map((log) => (
                        <div
                          key={log.id}
                          className={`p-2 rounded text-xs font-mono ${
                            log.level === 'error'
                              ? 'bg-status-error/10 text-status-error border border-status-error/20'
                              : log.level === 'warn'
                              ? 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                              : 'bg-bg-primary text-text-primary border border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              [{log.level.toUpperCase()}] {log.message}
                            </span>
                            <span className="text-text-muted">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          {log.stepId && (
                            <div className="text-text-muted mt-1">
                              Step: {log.stepId} {log.tool && `(${log.tool})`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted">
              <div className="text-center">
                <p>Select a workflow to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}