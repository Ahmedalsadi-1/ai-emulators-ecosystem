import { register, collectDefaultMetrics, Gauge, Counter, Histogram, Registry } from 'prom-client';
import { ServiceMetrics, SystemMetrics } from '@/types';

export class MetricsCollector {
  private registry: Registry;
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();

  // Prometheus metrics
  private httpRequestTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private serviceHealthStatus: Gauge<string>;
  private activeConnections: Gauge<string>;
  private errorTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // Enable default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // Custom metrics
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'status_code', 'service_id'],
      registers: [this.registry]
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'service_id'],
      buckets: [0.1, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry]
    });

    this.serviceHealthStatus = new Gauge({
      name: 'service_health_status',
      help: 'Health status of services (0=unhealthy, 1=healthy, 2=maintenance)',
      labelNames: ['service_id'],
      registers: [this.registry]
    });

    this.activeConnections = new Gauge({
      name: 'active_connections_total',
      help: 'Number of active WebSocket connections',
      registers: [this.registry]
    });

    this.errorTotal = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'service_id'],
      registers: [this.registry]
    });
  }

  async start(): Promise<void> {
    console.log('Metrics collector started');
  }

  async stop(): Promise<void> {
    console.log('Metrics collector stopped');
  }

  requestMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const serviceId = this.extractServiceId(req);

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000; // Convert to seconds

        // Record metrics
        this.httpRequestTotal
          .labels(req.method, res.statusCode.toString(), serviceId)
          .inc();

        this.httpRequestDuration
          .labels(req.method, serviceId)
          .observe(duration);
      });

      next();
    };
  }

  async recordRequest(data: {
    serviceId: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    success: boolean;
  }): Promise<void> {
    // Update service metrics
    const metrics = this.getOrCreateServiceMetrics(data.serviceId);
    metrics.requestsTotal++;

    if (data.success) {
      metrics.requestsSuccessful++;
    } else {
      metrics.requestsFailed++;
    }

    // Update average response time (simple moving average)
    const alpha = 0.1; // Smoothing factor
    metrics.averageResponseTime =
      alpha * data.responseTime + (1 - alpha) * metrics.averageResponseTime;

    // Update error rate
    metrics.errorRate = metrics.requestsFailed / metrics.requestsTotal;

    metrics.lastUpdated = new Date();

    // Update Prometheus metrics
    this.httpRequestTotal
      .labels(data.method, data.statusCode.toString(), data.serviceId)
      .inc();

    this.httpRequestDuration
      .labels(data.method, data.serviceId)
      .observe(data.responseTime / 1000);
  }

  async recordError(data: {
    serviceId: string;
    method: string;
    path: string;
    errorType: string;
    responseTime: number;
  }): Promise<void> {
    // Update service metrics
    const metrics = this.getOrCreateServiceMetrics(data.serviceId);
    metrics.requestsTotal++;
    metrics.requestsFailed++;
    metrics.errorRate = metrics.requestsFailed / metrics.requestsTotal;
    metrics.lastUpdated = new Date();

    // Update Prometheus metrics
    this.errorTotal
      .labels(data.errorType, data.serviceId)
      .inc();
  }

  updateServiceHealth(serviceId: string, status: string): void {
    let statusValue = 0;
    switch (status) {
      case 'healthy':
        statusValue = 1;
        break;
      case 'maintenance':
        statusValue = 2;
        break;
      case 'unhealthy':
      case 'unknown':
        statusValue = 0;
        break;
    }

    this.serviceHealthStatus
      .labels(serviceId)
      .set(statusValue);
  }

  updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  getServiceMetrics(serviceId: string): ServiceMetrics | null {
    return this.serviceMetrics.get(serviceId) || null;
  }

  getAllServiceMetrics(): Record<string, ServiceMetrics> {
    return Object.fromEntries(this.serviceMetrics);
  }

  getSystemMetrics(): SystemMetrics {
    const serviceMetrics = Array.from(this.serviceMetrics.values());

    const totalRequests = serviceMetrics.reduce((sum, m) => sum + m.requestsTotal, 0);
    const totalSuccessful = serviceMetrics.reduce((sum, m) => sum + m.requestsSuccessful, 0);
    const totalFailed = serviceMetrics.reduce((sum, m) => sum + m.requestsFailed, 0);

    // Calculate average response time across all services
    const avgResponseTime = serviceMetrics.length > 0
      ? serviceMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / serviceMetrics.length
      : 0;

    return {
      totalRequests,
      activeConnections: 0, // Will be updated by WebSocket manager
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user,
      uptime: process.uptime()
    };
  }

  // Get Prometheus metrics as string
  async getPrometheusMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  // Get metrics in JSON format
  getMetricsJSON(): {
    services: Record<string, ServiceMetrics>;
    system: SystemMetrics;
    timestamp: Date;
  } {
    return {
      services: this.getAllServiceMetrics(),
      system: this.getSystemMetrics(),
      timestamp: new Date()
    };
  }

  private getOrCreateServiceMetrics(serviceId: string): ServiceMetrics {
    let metrics = this.serviceMetrics.get(serviceId);
    if (!metrics) {
      metrics = {
        serviceId,
        requestsTotal: 0,
        requestsSuccessful: 0,
        requestsFailed: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
        lastUpdated: new Date()
      };
      this.serviceMetrics.set(serviceId, metrics);
    }
    return metrics;
  }

  private extractServiceId(req: any): string {
    // Extract service ID from URL path
    const pathSegments = req.path.split('/').filter(Boolean);

    if (pathSegments[0] === 'api' && pathSegments[1] === 'v1') {
      if (pathSegments[2] === 'projects' && pathSegments[3]) {
        return pathSegments[3];
      }
    }

    return 'orchestrator';
  }

  // Reset all metrics (useful for testing)
  reset(): void {
    this.serviceMetrics.clear();
    this.registry.resetMetrics();
    collectDefaultMetrics({ register: this.registry });
  }
}