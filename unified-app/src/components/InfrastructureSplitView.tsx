import { useState, useEffect, useRef } from 'react';
import { BarChart3, Server, Activity, Zap, Settings, RefreshCw, Play, Square, Trash2 } from 'lucide-react';
import { useUnifiedAppStore } from '@/hooks/useAppStore';
import { cn } from '@/utils/cn';

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'error';
  ports: string[];
  created: string;
  cpu: number;
  memory: number;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: { rx: number; tx: number };
}

export function InfrastructureSplitView() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: { rx: 0, tx: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);

  const { getAppsByCategory } = useUnifiedAppStore();
  const grafanaIframeRef = useRef<HTMLIFrameElement>(null);
  const dockerIframeRef = useRef<HTMLIFrameElement>(null);

  // Handle messages from embedded iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our expected origins
      const allowedOrigins = ['http://localhost:3020', 'http://localhost:8080'];
      if (!allowedOrigins.includes(event.origin)) return;

      try {
        const data = event.data;

        switch (data.type) {
          case 'grafana_dashboard_loaded':
            console.log('Grafana dashboard loaded:', data);
            break;

          case 'docker_containers_updated':
            console.log('Docker containers updated:', data.containers);
            if (data.containers) {
              setContainers(data.containers);
            }
            break;

          case 'system_metrics_updated':
            console.log('System metrics updated:', data.metrics);
            if (data.metrics) {
              setSystemMetrics(data.metrics);
            }
            break;

          case 'docker_action_complete':
            console.log('Docker action completed:', data.action, data.containerId);
            // Refresh container list
            fetchContainerData();
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Error handling iframe message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send message to Grafana iframe
  const sendToGrafana = (message: any) => {
    if (grafanaIframeRef.current?.contentWindow) {
      grafanaIframeRef.current.contentWindow.postMessage(message, 'http://localhost:3020');
    }
  };

  // Send message to Docker management iframe
  const sendToDocker = (message: any) => {
    if (dockerIframeRef.current?.contentWindow) {
      dockerIframeRef.current.contentWindow.postMessage(message, 'http://localhost:8080');
    }
  };

  // Fetch container data from Docker management API
  const fetchContainerData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/containers');
      if (response.ok) {
        const data = await response.json();
        setContainers(data.containers || []);
      }
    } catch (error) {
      console.error('Failed to fetch container data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch system metrics
  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/system/metrics');
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data.metrics || systemMetrics);
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'docker-management') {
      fetchContainerData();
      fetchSystemMetrics();

      // Set up periodic refresh
      const interval = setInterval(() => {
        fetchContainerData();
        fetchSystemMetrics();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const infrastructureApps = getAppsByCategory('infrastructure');
  const grafanaApp = infrastructureApps.find(app => app.id === 'grafana-monitoring');

  const handleContainerAction = (containerId: string, action: 'start' | 'stop' | 'restart' | 'remove') => {
    sendToDocker({
      type: 'docker_action',
      action,
      containerId,
      timestamp: Date.now()
    });
  };

  const getStatusColor = (status: ContainerInfo['status']) => {
    switch (status) {
      case 'running': return 'text-status-success';
      case 'stopped': return 'text-text-muted';
      case 'error': return 'text-status-error';
      default: return 'text-text-muted';
    }
  };

  const getStatusIcon = (status: ContainerInfo['status']) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4" />;
      case 'stopped': return <Square className="w-4 h-4" />;
      case 'error': return <Trash2 className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Infrastructure Management</h1>
          <p className="text-sm text-text-muted">Monitor systems and manage container orchestration</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchContainerData();
              fetchSystemMetrics();
              sendToGrafana({ type: 'refresh_dashboard', timestamp: Date.now() });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-bg-primary rounded-md hover:bg-accent-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh All
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      {activeTab === 'docker-management' && (
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-bg-secondary border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">CPU Usage</p>
                  <p className="text-2xl font-semibold text-text-primary">{systemMetrics.cpu.toFixed(1)}%</p>
                </div>
                <Activity className="w-8 h-8 text-accent-primary" />
              </div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">Memory Usage</p>
                  <p className="text-2xl font-semibold text-text-primary">{systemMetrics.memory.toFixed(1)}%</p>
                </div>
                <Server className="w-8 h-8 text-accent-primary" />
              </div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">Disk Usage</p>
                  <p className="text-2xl font-semibold text-text-primary">{systemMetrics.disk.toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-accent-primary" />
              </div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">Containers</p>
                  <p className="text-2xl font-semibold text-text-primary">{containers.length}</p>
                </div>
                <Zap className="w-8 h-8 text-accent-primary" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area with Tabs */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-border mx-4 mt-4">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'monitoring'
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Monitoring Dashboard
            </button>
            <button
              onClick={() => setActiveTab('docker-management')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'docker-management'
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              )}
            >
              <Server className="w-4 h-4" />
              Docker Management
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-4">
            {activeTab === 'monitoring' && (
              <div className="h-full bg-bg-secondary rounded-lg border border-border overflow-hidden">
                {grafanaApp ? (
                  <>
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-primary" />
                        <span className="font-medium">{grafanaApp.name}</span>
                        <span className="text-xs px-2 py-1 bg-bg-card rounded text-text-muted">
                          {grafanaApp.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendToGrafana({ type: 'refresh_dashboard', timestamp: Date.now() })}
                          className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                        <button
                          onClick={() => sendToGrafana({ type: 'ping', timestamp: Date.now() })}
                          className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors"
                        >
                          Test Connection
                        </button>
                      </div>
                    </div>
                    <iframe
                      ref={grafanaIframeRef}
                      src={grafanaApp.url}
                      className="w-full h-[calc(100%-60px)] border-0"
                      title="Grafana Monitoring Dashboard"
                      onLoad={() => {
                        setTimeout(() => {
                          sendToGrafana({ type: 'unified_app_init', version: '1.0.0' });
                        }, 1000);
                      }}
                    />
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
                      <p className="text-text-muted">Grafana Monitoring Dashboard not available</p>
                      <p className="text-xs text-text-muted mt-2">Make sure Grafana is running on port 3020</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'docker-management' && (
              <div className="h-full flex flex-col bg-bg-secondary rounded-lg border border-border overflow-hidden">
                {/* Container List Header */}
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-accent-primary" />
                    <span className="font-medium">Container Management</span>
                    <span className="text-xs px-2 py-1 bg-bg-card rounded text-text-muted">
                      {containers.length} containers
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchContainerData}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button
                      onClick={() => sendToDocker({ type: 'ping', timestamp: Date.now() })}
                      className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors"
                    >
                      Test Connection
                    </button>
                  </div>
                </div>

                {/* Container List */}
                <div className="flex-1 overflow-y-auto">
                  {containers.length > 0 ? (
                    <div className="divide-y divide-border-color">
                      {containers.map((container) => (
                        <div key={container.id} className="p-4 hover:bg-bg-card transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={cn("flex items-center gap-1 text-sm", getStatusColor(container.status))}>
                                  {getStatusIcon(container.status)}
                                  <span className="capitalize">{container.status}</span>
                                </div>
                                <h3 className="font-medium text-text-primary">{container.name}</h3>
                                <span className="text-xs text-text-muted bg-bg-card px-2 py-1 rounded">
                                  {container.image}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                                <span>CPU: {container.cpu.toFixed(1)}%</span>
                                <span>Memory: {container.memory.toFixed(1)}%</span>
                                <span>Ports: {container.ports.join(', ') || 'None'}</span>
                                <span>Created: {new Date(container.created).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {container.status === 'running' ? (
                                <>
                                  <button
                                    onClick={() => handleContainerAction(container.id, 'stop')}
                                    className="flex items-center gap-1 px-2 py-1 border border-border rounded text-xs hover:bg-bg-card transition-colors text-status-error"
                                  >
                                    <Square className="w-3 h-3" />
                                    Stop
                                  </button>
                                  <button
                                    onClick={() => handleContainerAction(container.id, 'restart')}
                                    className="flex items-center gap-1 px-2 py-1 border border-border rounded text-xs hover:bg-bg-card transition-colors"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Restart
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleContainerAction(container.id, 'start')}
                                  className="flex items-center gap-1 px-2 py-1 bg-accent-primary text-bg-primary rounded text-xs hover:bg-accent-primary/90 transition-colors"
                                >
                                  <Play className="w-3 h-3" />
                                  Start
                                </button>
                              )}
                              <button
                                onClick={() => handleContainerAction(container.id, 'remove')}
                                className="flex items-center gap-1 px-2 py-1 border border-border rounded text-xs hover:bg-bg-card transition-colors text-status-error"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Server className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-muted">No containers found</p>
                        <p className="text-xs text-text-muted mt-2">Make sure Docker is running and monitoring API is available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}