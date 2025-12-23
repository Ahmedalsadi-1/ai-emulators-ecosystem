import axios from 'axios';

export interface ServiceMetrics {
  cpu: number[];
  memory: number[];
  responseTime?: number[];
  errorRate?: number[];
  timestamps: string[];
}

export interface Alert {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  service: string;
  timestamp: string;
  status: 'firing' | 'resolved';
}

export class MonitoringService {
  private prometheusUrl: string;
  private grafanaUrl: string;
  private lokiUrl: string;

  constructor() {
    this.prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
    this.grafanaUrl = process.env.GRAFANA_URL || 'http://grafana:3000';
    this.lokiUrl = process.env.LOKI_URL || 'http://loki:3100';
  }

  async getServiceMetrics(service: string, range: string = '1h'): Promise<ServiceMetrics> {
    try {
      const end = Date.now();
      const start = end - this.parseRange(range);

      // CPU usage
      const cpuQuery = `rate(container_cpu_usage_seconds_total{name="${service}"}[5m]) * 100`;
      const cpuResponse = await axios.get(`${this.prometheusUrl}/api/v1/query_range`, {
        params: {
          query: cpuQuery,
          start: start / 1000,
          end: end / 1000,
          step: 60
        }
      });

      // Memory usage
      const memoryQuery = `container_memory_usage_bytes{name="${service}"} / container_spec_memory_limit_bytes{name="${service}"} * 100`;
      const memoryResponse = await axios.get(`${this.prometheusUrl}/api/v1/query_range`, {
        params: {
          query: memoryQuery,
          start: start / 1000,
          end: end / 1000,
          step: 60
        }
      });

      return {
        cpu: cpuResponse.data.data.result[0]?.values?.map((v: any) => parseFloat(v[1])) || [],
        memory: memoryResponse.data.data.result[0]?.values?.map((v: any) => parseFloat(v[1])) || [],
        timestamps: cpuResponse.data.data.result[0]?.values?.map((v: any) => new Date(v[0] * 1000).toISOString()) || []
      };
    } catch (error) {
      throw new Error(`Failed to get metrics: ${error.message}`);
    }
  }

  async getProjectDashboardUrl(project: string): Promise<string> {
    // Create project-specific dashboard URL
    const dashboardId = this.getProjectDashboardId(project);
    return `${this.grafanaUrl}/d/${dashboardId}?orgId=1&refresh=30s`;
  }

  async getAlerts(active: boolean = true): Promise<Alert[]> {
    try {
      const response = await axios.get(`${this.prometheusUrl}/api/v1/alerts`);
      const alerts = response.data.data.alerts;

      return alerts
        .filter((alert: any) => !active || alert.state === 'firing')
        .map((alert: any) => ({
          name: alert.labels.alertname,
          severity: alert.labels.severity,
          description: alert.annotations.description,
          service: alert.labels.service || 'unknown',
          timestamp: new Date(alert.activeAt).toISOString(),
          status: alert.state
        }));
    } catch (error) {
      throw new Error(`Failed to get alerts: ${error.message}`);
    }
  }

  async getSystemOverview(): Promise<any> {
    try {
      const queries = {
        totalServices: 'count(up)',
        healthyServices: 'count(up == 1)',
        cpuTotal: 'sum(rate(container_cpu_usage_seconds_total[5m])) * 100',
        memoryTotal: 'sum(container_memory_usage_bytes) / sum(container_spec_memory_limit_bytes) * 100',
        activeAlerts: 'count(ALERTS{alertstate="firing"})'
      };

      const results: any = {};

      for (const [key, query] of Object.entries(queries)) {
        try {
          const response = await axios.get(`${this.prometheusUrl}/api/v1/query`, {
            params: { query }
          });
          results[key] = response.data.data.result[0]?.value?.[1] || 0;
        } catch (error) {
          results[key] = 0;
        }
      }

      return {
        totalServices: parseInt(results.totalServices),
        healthyServices: parseInt(results.healthyServices),
        unhealthyServices: parseInt(results.totalServices) - parseInt(results.healthyServices),
        cpuUsage: parseFloat(results.cpuTotal),
        memoryUsage: parseFloat(results.memoryTotal),
        activeAlerts: parseInt(results.activeAlerts)
      };
    } catch (error) {
      throw new Error(`Failed to get system overview: ${error.message}`);
    }
  }

  async getServiceLogs(service: string, options: any = {}): Promise<string[]> {
    try {
      const query = `{job="${service}"}`;
      const params: any = {
        query,
        limit: options.limit || 100
      };

      if (options.since) {
        params.start = new Date(options.since).getTime() / 1000;
      }

      const response = await axios.get(`${this.lokiUrl}/loki/api/v1/query_range`, { params });

      return response.data.data.result[0]?.values?.map((v: any) => v[1]) || [];
    } catch (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }

  private parseRange(range: string): number {
    const unit = range.slice(-1);
    const value = parseInt(range.slice(0, -1));

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 60 * 60 * 1000; // 1 hour default
    }
  }

  private getProjectDashboardId(project: string): string {
    // Map project names to dashboard IDs
    const dashboardMap: { [key: string]: string } = {
      'bytebot': 'bytebot-monitoring',
      'factif-ai': 'factif-monitoring',
      'postiz-app': 'postiz-monitoring',
      'aios': 'aios-monitoring',
      'wan2gp': 'wan2gp-monitoring'
    };

    return dashboardMap[project] || 'system-overview';
  }
}