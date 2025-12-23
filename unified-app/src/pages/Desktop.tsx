import React, { useState, useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { Monitor, Smartphone, Settings, Play, Square, RotateCcw, Wifi, WifiOff, Cpu, HardDrive, Zap, Activity, Camera, Video, FileText, Code, GitBranch, ArrowRight, Plus } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'server';
  os: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
  ipAddress?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  networkLatency?: number;
  lastSeen?: Date;
}

interface DesktopEnvironment {
  id: string;
  name: string;
  type: 'vnc' | 'sandbox';
  url: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  connectedDevice?: Device;
}

const Desktop: React.FC = () => {
  const [environments, setEnvironments] = useState<DesktopEnvironment[]>([
    {
      id: 'bytebot-vnc',
      name: 'ByteBot VNC Desktop',
      type: 'vnc',
      url: 'http://localhost:3000/vnc',
      status: 'running',
      port: 3000,
    },
    {
      id: 'gbox-sandbox',
      name: 'GBox Sandbox Environment',
      type: 'sandbox',
      url: 'http://localhost:4000',
      status: 'running',
      port: 4000,
    },
  ]);

  const [devices, setDevices] = useState<Device[]>([
    {
      id: 'device-1',
      name: 'MacBook Pro',
      type: 'desktop',
      os: 'macOS',
      status: 'online',
      ipAddress: '192.168.1.100',
      cpuUsage: 45,
      memoryUsage: 68,
      networkLatency: 12,
      lastSeen: new Date(),
    },
    {
      id: 'device-2',
      name: 'Android Emulator',
      type: 'mobile',
      os: 'Android',
      status: 'online',
      ipAddress: '192.168.1.101',
      cpuUsage: 32,
      memoryUsage: 45,
      networkLatency: 8,
      lastSeen: new Date(),
    },
    {
      id: 'device-3',
      name: 'Ubuntu Server',
      type: 'server',
      os: 'Ubuntu Linux',
      status: 'offline',
      ipAddress: '192.168.1.102',
      lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
    },
  ]);

  const [activeEnvironment, setActiveEnvironment] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(50); // Percentage for left panel
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [automationMode, setAutomationMode] = useState<'idle' | 'recording' | 'playing'>('idle');
  const [automationScripts, setAutomationScripts] = useState<Array<{
    id: string;
    name: string;
    environment: string;
    actions: Array<{ type: string; data: any; timestamp: number }>;
    createdAt: Date;
  }>>([]);

  const [workflows, setWorkflows] = useState<Array<{
    id: string;
    name: string;
    description: string;
    steps: Array<{
      id: string;
      environmentId: string;
      action: string;
      parameters: any;
      order: number;
    }>;
    createdAt: Date;
    status: 'idle' | 'running' | 'completed' | 'error';
  }>>([]);

  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);

  // Device monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prevDevices =>
        prevDevices.map(device => ({
          ...device,
          cpuUsage: device.status === 'online' ? Math.floor(Math.random() * 100) : undefined,
          memoryUsage: device.status === 'online' ? Math.floor(Math.random() * 100) : undefined,
          networkLatency: device.status === 'online' ? Math.floor(Math.random() * 50) + 5 : undefined,
          lastSeen: device.status === 'online' ? new Date() : device.lastSeen,
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const connectDeviceToEnvironment = (deviceId: string, environmentId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    setEnvironments(prev =>
      prev.map(env =>
        env.id === environmentId
          ? { ...env, connectedDevice: device }
          : env
      )
    );
    setSelectedDevice(deviceId);
  };

  const disconnectDeviceFromEnvironment = (environmentId: string) => {
    setEnvironments(prev =>
      prev.map(env =>
        env.id === environmentId
          ? { ...env, connectedDevice: undefined }
          : env
      )
    );
    setSelectedDevice(null);
  };

  const startRecording = (environmentId: string) => {
    setAutomationMode('recording');
    // In a real implementation, this would start capturing user interactions
    console.log(`Started recording automation for ${environmentId}`);
  };

  const stopRecording = (environmentId: string, scriptName: string) => {
    setAutomationMode('idle');
    const newScript = {
      id: `script-${Date.now()}`,
      name: scriptName,
      environment: environmentId,
      actions: [], // Would be populated with recorded actions
      createdAt: new Date(),
    };
    setAutomationScripts(prev => [...prev, newScript]);
    console.log(`Stopped recording and saved script: ${scriptName}`);
  };

  const playAutomation = (scriptId: string) => {
    setAutomationMode('playing');
    const script = automationScripts.find(s => s.id === scriptId);
    if (script) {
      // In a real implementation, this would execute the automation actions
      console.log(`Playing automation script: ${script.name}`);
      setTimeout(() => setAutomationMode('idle'), 2000); // Simulate execution
    }
  };

  const captureScreenshot = (environmentId: string) => {
    // In a real implementation, this would capture a screenshot from the environment
    console.log(`Capturing screenshot from ${environmentId}`);
  };

  const runCustomScript = (environmentId: string, script: string) => {
    // In a real implementation, this would execute custom automation code
    console.log(`Running custom script in ${environmentId}: ${script}`);
  };

  const createWorkflow = (name: string, description: string) => {
    const newWorkflow = {
      id: `workflow-${Date.now()}`,
      name,
      description,
      steps: [],
      createdAt: new Date(),
      status: 'idle' as const,
    };
    setWorkflows(prev => [...prev, newWorkflow]);
    setActiveWorkflow(newWorkflow.id);
  };

  const addWorkflowStep = (workflowId: string, environmentId: string, action: string, parameters: any = {}) => {
    setWorkflows(prev =>
      prev.map(workflow =>
        workflow.id === workflowId
          ? {
              ...workflow,
              steps: [
                ...workflow.steps,
                {
                  id: `step-${Date.now()}`,
                  environmentId,
                  action,
                  parameters,
                  order: workflow.steps.length,
                },
              ],
            }
          : workflow
      )
    );
  };

  const executeWorkflow = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    setWorkflows(prev =>
      prev.map(w =>
        w.id === workflowId
          ? { ...w, status: 'running' }
          : w
      )
    );

    // Simulate workflow execution
    workflow.steps.forEach((step, index) => {
      setTimeout(() => {
        console.log(`Executing step ${index + 1}: ${step.action} in ${step.environmentId}`);
      }, index * 1000);
    });

    // Mark as completed after all steps
    setTimeout(() => {
      setWorkflows(prev =>
        prev.map(w =>
          w.id === workflowId
            ? { ...w, status: 'completed' }
            : w
        )
      );
    }, workflow.steps.length * 1000 + 500);
  };

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    if (activeWorkflow === workflowId) {
      setActiveWorkflow(null);
    }
  };

  const handleEnvironmentAction = (envId: string, action: 'start' | 'stop' | 'restart') => {
    setEnvironments(prev =>
      prev.map(env =>
        env.id === envId
          ? { ...env, status: action === 'start' ? 'running' : action === 'stop' ? 'stopped' : 'running' }
          : env
      )
    );
  };

  const handleResize = (_event: any, { size }: any) => {
    const containerWidth = window.innerWidth - 256; // Subtract sidebar width
    const newRatio = (size.width / containerWidth) * 100;
    setSplitRatio(Math.max(20, Math.min(80, newRatio)));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'stopped': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-3 h-3" />;
      case 'stopped': return <Square className="w-3 h-3" />;
      case 'error': return <div className="w-3 h-3 bg-red-400 rounded-full" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary">
        <div className="flex items-center space-x-3">
          <Monitor className="w-6 h-6 text-accent-primary" />
          <h1 className="text-xl font-semibold text-text-primary">Desktop Environments</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Environment Controls */}
          <div className="flex items-center space-x-2">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setActiveEnvironment(env.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeEnvironment === env.id
                    ? 'bg-accent-primary text-bg-primary'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-card'
                }`}
              >
                {env.type === 'vnc' ? (
                  <Monitor className="w-4 h-4" />
                ) : (
                  <Smartphone className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{env.name}</span>
                <div className={`flex items-center ${getStatusColor(env.status)}`}>
                  {getStatusIcon(env.status)}
                </div>
              </button>
            ))}
          </div>

          {/* Global Controls */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-text-secondary hover:text-accent-primary hover:bg-bg-tertiary rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-2 text-text-secondary hover:text-accent-primary hover:bg-bg-tertiary rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            </div>
          </div>

          {/* Scripts Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Automation Scripts</h3>
            </div>
            <div className="p-2">
              {automationScripts.length === 0 ? (
                <div className="text-xs text-text-muted text-center py-4">
                  No automation scripts yet. Start recording to create one.
                </div>
              ) : (
                automationScripts.map((script) => (
                  <div
                    key={script.id}
                    className="p-3 mb-2 bg-bg-tertiary rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3 h-3 text-accent-primary" />
                        <span className="text-xs font-medium text-text-primary">{script.name}</span>
                      </div>
                      <button
                        onClick={() => playAutomation(script.id)}
                        className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                        disabled={automationMode !== 'idle'}
                      >
                        <Play className="w-3 h-3" />
                        <span>Play</span>
                      </button>
                    </div>
                    <div className="text-xs text-text-muted">
                      {script.actions.length} actions • {script.environment} • {script.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Environment Panel */}
        <div className="w-80 bg-bg-secondary border-r border-border flex flex-col">
          {/* Environment Section */}
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Environments</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {environments.map((env) => (
              <div
                key={env.id}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${
                  activeEnvironment === env.id ? 'bg-accent-primary/10' : 'hover:bg-bg-tertiary'
                }`}
                onClick={() => setActiveEnvironment(env.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {env.type === 'vnc' ? (
                      <Monitor className="w-4 h-4 text-accent-primary" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-accent-primary" />
                    )}
                    <span className="text-sm font-medium text-text-primary">{env.name}</span>
                  </div>
                  <div className={`flex items-center ${getStatusColor(env.status)}`}>
                    {getStatusIcon(env.status)}
                  </div>
                </div>

                <div className="text-xs text-text-muted mb-2">
                  Type: {env.type.toUpperCase()} • Port: {env.port}
                </div>

                <div className="flex space-x-1 mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnvironmentAction(env.id, 'start');
                    }}
                    className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                    disabled={env.status === 'running'}
                  >
                    Start
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnvironmentAction(env.id, 'stop');
                    }}
                    className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    disabled={env.status === 'stopped'}
                  >
                    Stop
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnvironmentAction(env.id, 'restart');
                    }}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  >
                    Restart
                  </button>
                </div>

                {/* Automation Controls */}
                <div className="flex flex-wrap gap-1">
                  {automationMode === 'idle' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRecording(env.id);
                      }}
                      className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors flex items-center space-x-1"
                      disabled={env.status !== 'running'}
                    >
                      <Video className="w-3 h-3" />
                      <span>Record</span>
                    </button>
                  ) : automationMode === 'recording' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        stopRecording(env.id, `Automation ${Date.now()}`);
                      }}
                      className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors flex items-center space-x-1"
                    >
                      <Square className="w-3 h-3" />
                      <span>Stop</span>
                    </button>
                  ) : null}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      captureScreenshot(env.id);
                    }}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors flex items-center space-x-1"
                    disabled={env.status !== 'running'}
                  >
                    <Camera className="w-3 h-3" />
                    <span>Screenshot</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show script input dialog
                      const script = prompt('Enter automation script:');
                      if (script) runCustomScript(env.id, script);
                    }}
                    className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors flex items-center space-x-1"
                    disabled={env.status !== 'running'}
                  >
                    <Code className="w-3 h-3" />
                    <span>Script</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Device Management Section */}
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Device Management</h2>
          </div>

          {/* Automation Section */}
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Automation</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Status:</span>
                <div className={`flex items-center space-x-1 ${
                  automationMode === 'recording' ? 'text-red-400' :
                  automationMode === 'playing' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {automationMode === 'recording' && <Video className="w-3 h-3" />}
                  {automationMode === 'playing' && <Play className="w-3 h-3" />}
                  {automationMode === 'idle' && <Square className="w-3 h-3" />}
                  <span className="text-xs capitalize">{automationMode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflows Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Cross-Environment Workflows</h2>
              <button
                onClick={() => {
                  const name = prompt('Workflow name:');
                  const description = prompt('Workflow description:');
                  if (name && description) createWorkflow(name, description);
                }}
                className="p-1 text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                title="Create new workflow"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    activeWorkflow === workflow.id
                      ? 'bg-accent-primary/10 border-accent-primary'
                      : 'bg-bg-tertiary border-border hover:bg-bg-card'
                  }`}
                  onClick={() => setActiveWorkflow(workflow.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm font-medium text-text-primary">{workflow.name}</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      workflow.status === 'running' ? 'text-blue-400' :
                      workflow.status === 'completed' ? 'text-green-400' :
                      workflow.status === 'error' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {workflow.status === 'running' && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                      {workflow.status === 'completed' && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                      {workflow.status === 'error' && <div className="w-2 h-2 bg-red-400 rounded-full" />}
                      <span className="text-xs capitalize">{workflow.status}</span>
                    </div>
                  </div>

                  <div className="text-xs text-text-muted mb-2">{workflow.description}</div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-muted">
                      {workflow.steps.length} steps
                    </div>
                    <div className="flex space-x-1">
                      {activeWorkflow === workflow.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const environmentId = prompt('Environment ID:');
                            const action = prompt('Action:');
                            if (environmentId && action) {
                              addWorkflowStep(workflow.id, environmentId, action);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                        >
                          Add Step
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          executeWorkflow(workflow.id);
                        }}
                        className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                        disabled={workflow.status === 'running' || workflow.steps.length === 0}
                      >
                        Execute
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(workflow.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  {activeWorkflow === workflow.id && workflow.steps.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {workflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center space-x-2 text-xs bg-bg-primary/50 rounded px-2 py-1">
                          <span className="text-text-muted">{index + 1}.</span>
                          <span className="text-text-primary">{step.action}</span>
                          <ArrowRight className="w-3 h-3 text-text-muted" />
                          <span className="text-accent-primary">{step.environmentId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {workflows.length === 0 && (
                <div className="text-xs text-text-muted text-center py-4">
                  No workflows created. Click + to create your first cross-environment workflow.
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${
                  selectedDevice === device.id ? 'bg-accent-primary/10' : 'hover:bg-bg-tertiary'
                }`}
                onClick={() => setSelectedDevice(device.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {device.type === 'desktop' && <Monitor className="w-4 h-4 text-accent-primary" />}
                    {device.type === 'mobile' && <Smartphone className="w-4 h-4 text-accent-primary" />}
                    {device.type === 'server' && <HardDrive className="w-4 h-4 text-accent-primary" />}
                    <span className="text-sm font-medium text-text-primary">{device.name}</span>
                  </div>
                  <div className={`flex items-center ${device.status === 'online' ? 'text-green-400' : 'text-gray-400'}`}>
                    {device.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  </div>
                </div>

                <div className="text-xs text-text-muted mb-2">
                  {device.os} • {device.ipAddress}
                </div>

                {device.status === 'online' && device.cpuUsage !== undefined && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span className="flex items-center">
                        <Cpu className="w-3 h-3 mr-1" />
                        CPU
                      </span>
                      <span>{device.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-1">
                      <div
                        className="bg-accent-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${device.cpuUsage}%` }}
                      />
                    </div>
                  </div>
                )}

                {device.status === 'online' && device.memoryUsage !== undefined && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span className="flex items-center">
                        <HardDrive className="w-3 h-3 mr-1" />
                        Memory
                      </span>
                      <span>{device.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${device.memoryUsage}%` }}
                      />
                    </div>
                  </div>
                )}

                {device.networkLatency !== undefined && (
                  <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                    <span className="flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      Latency
                    </span>
                    <span>{device.networkLatency}ms</span>
                  </div>
                )}

                <div className="flex space-x-1">
                  {activeEnvironment && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        connectDeviceToEnvironment(device.id, activeEnvironment);
                      }}
                      className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                      disabled={device.status !== 'online'}
                    >
                      Connect
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Device specific actions could go here
                    }}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  >
                    Config
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Split View Area */}
        <div className="flex-1 flex">
          {environments.length >= 2 ? (
            <>
              {/* Left Panel */}
              <div className="flex-1 relative">
                <ResizableBox
                  width={(window.innerWidth - 256) * (splitRatio / 100)}
                  height={Infinity}
                  minConstraints={[300, 200]}
                  maxConstraints={[(window.innerWidth - 256) * 0.8, Infinity]}
                  resizeHandles={['e']}
                  onResize={handleResize}
                  className="h-full"
                >
                  <div className="h-full bg-bg-primary border-r border-border">
                    <div className="h-full flex flex-col">
                      {/* Panel Header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border">
                        <div className="flex items-center space-x-2">
                          <Monitor className="w-4 h-4 text-accent-primary" />
                          <span className="text-sm font-medium text-text-primary">
                            {environments[0]?.name}
                          </span>
                          <div className={`flex items-center ${getStatusColor(environments[0]?.status)}`}>
                            {getStatusIcon(environments[0]?.status)}
                          </div>
                        </div>
                        {environments[0]?.connectedDevice && (
                          <div className="flex items-center space-x-2 text-xs text-text-muted">
                            <Zap className="w-3 h-3" />
                            <span>{environments[0].connectedDevice.name}</span>
                            <button
                              onClick={() => disconnectDeviceFromEnvironment(environments[0].id)}
                              className="text-red-400 hover:text-red-300"
                              title="Disconnect device"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Panel Content */}
                      <div className="flex-1 overflow-hidden">
                        <iframe
                          src={environments[0]?.url}
                          className="w-full h-full border-0"
                          title={environments[0]?.name}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        />
                      </div>
                    </div>
                  </div>
                </ResizableBox>
              </div>

              {/* Right Panel */}
              <div className="flex-1 bg-bg-primary">
                <div className="h-full flex flex-col">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm font-medium text-text-primary">
                        {environments[1]?.name}
                      </span>
                      <div className={`flex items-center ${getStatusColor(environments[1]?.status)}`}>
                        {getStatusIcon(environments[1]?.status)}
                      </div>
                    </div>
                    {environments[1]?.connectedDevice && (
                      <div className="flex items-center space-x-2 text-xs text-text-muted">
                        <Zap className="w-3 h-3" />
                        <span>{environments[1].connectedDevice.name}</span>
                        <button
                          onClick={() => disconnectDeviceFromEnvironment(environments[1].id)}
                          className="text-red-400 hover:text-red-300"
                          title="Disconnect device"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Panel Content */}
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={environments[1]?.url}
                      className="w-full h-full border-0"
                      title={environments[1]?.name}
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-bg-secondary">
              <div className="text-center">
                <Monitor className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No Desktop Environments</h3>
                <p className="text-text-secondary">
                  Configure desktop environments to get started with side-by-side viewing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Desktop;