import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, RotateCcw, Activity, Server, Zap } from 'lucide-react';

interface Service {
  name: string;
  status: 'running' | 'stopped' | 'error';
  health?: 'healthy' | 'unhealthy' | 'unknown';
  cpu?: number;
  memory?: number;
  project: string;
}

interface ProjectMonitoringProps {
  project: string;
}

export const ProjectMonitoringTab: React.FC<ProjectMonitoringProps> = ({ project }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [serviceLogs, setServiceLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
    // Set up WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'service-status') {
        setServices(data.data.filter((s: Service) => s.project === project));
      }
    };

    return () => ws.close();
  }, [project]);

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${project}/overview`);
      const data = await response.json();
      setServices(data.services);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load project data:', error);
      setLoading(false);
    }
  };

  const controlService = async (serviceName: string, action: 'start' | 'stop' | 'restart') => {
    try {
      await fetch(`/api/projects/${project}/services/${serviceName}/${action}`, {
        method: 'POST'
      });
      // Status will be updated via WebSocket
    } catch (error) {
      console.error(`Failed to ${action} service:`, error);
    }
  };

  const loadServiceDetails = async (serviceName: string) => {
    setSelectedService(serviceName);
    try {
      const [logsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/projects/${project}/services/${serviceName}/logs`),
        fetch(`/api/monitoring/metrics/${serviceName}`)
      ]);

      const logsData = await logsResponse.json();
      const metricsData = await metricsResponse.json();

      setServiceLogs(logsData.logs);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load service details:', error);
    }
  };

  const getStatusColor = (status: string, health?: string) => {
    if (status === 'running') {
      return health === 'healthy' ? 'bg-green-500' :
             health === 'unhealthy' ? 'bg-yellow-500' : 'bg-blue-500';
    }
    return status === 'stopped' ? 'bg-gray-500' : 'bg-red-500';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Service Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status - {project}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.name} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => loadServiceDetails(service.name)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{service.name}</h3>
                    <Badge className={getStatusColor(service.status, service.health)}>
                      {service.status}
                    </Badge>
                  </div>

                  {service.health && (
                    <div className="text-sm text-gray-600 mb-2">
                      Health: {service.health}
                    </div>
                  )}

                  <div className="space-y-2">
                    {service.cpu !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>CPU</span>
                          <span>{service.cpu.toFixed(1)}%</span>
                        </div>
                        <Progress value={service.cpu} className="h-2" />
                      </div>
                    )}

                    {service.memory !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Memory</span>
                          <span>{service.memory.toFixed(1)}%</span>
                        </div>
                        <Progress value={service.memory} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        controlService(service.name, 'start');
                      }}
                      disabled={service.status === 'running'}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        controlService(service.name, 'stop');
                      }}
                      disabled={service.status === 'stopped'}
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        controlService(service.name, 'restart');
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      {selectedService && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Metrics - {selectedService}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">CPU Usage</h4>
                    <div className="h-32 bg-gray-100 rounded p-2">
                      {/* Chart would go here - using placeholder */}
                      <div className="text-center text-gray-500 mt-10">
                        CPU Chart: {metrics.cpu?.[metrics.cpu.length - 1] || 0}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Memory Usage</h4>
                    <div className="h-32 bg-gray-100 rounded p-2">
                      {/* Chart would go here - using placeholder */}
                      <div className="text-center text-gray-500 mt-10">
                        Memory Chart: {metrics.memory?.[metrics.memory.length - 1] || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">Loading metrics...</div>
              )}
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Logs - {selectedService}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
                {serviceLogs.length > 0 ? (
                  serviceLogs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                ) : (
                  <div className="text-gray-500">No logs available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grafana Dashboard Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Observability Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 border rounded">
            {/* Embedded Grafana iframe would go here */}
            <iframe
              src={`/api/monitoring/dashboard/${project}`}
              className="w-full h-full"
              title={`${project} Dashboard`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};