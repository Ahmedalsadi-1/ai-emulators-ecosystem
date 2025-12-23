import axios, { AxiosResponse } from 'axios';
import { ServiceDefinition, HealthCheckResult, ServiceStatus } from '@/types';

export class HealthChecker {
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly healthCheckTimeout = 10000; // 10 seconds
  private readonly healthCheckIntervalMs = 30000; // 30 seconds

  constructor(private serviceRegistry: any) {}

  async start(): Promise<void> {
    console.log('Starting health checker...');

    // Perform initial health checks
    await this.performHealthChecks();

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    console.log('Health checker stopped');
  }

  async checkHealth(service: ServiceDefinition): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const response: AxiosResponse = await axios.get(`${service.baseUrl}${service.healthCheck}`, {
        timeout: this.healthCheckTimeout,
        headers: {
          'User-Agent': 'Orchestrator-Health-Checker/1.0',
          'Accept': 'application/json',
        },
        validateStatus: (status) => status < 500, // Accept any status below 500
      });

      const responseTime = Date.now() - startTime;
      const status = this.determineServiceStatus(response, responseTime);

      return {
        serviceId: service.id,
        status,
        responseTime,
        timestamp: new Date(),
        details: {
          statusCode: response.status,
          responseSize: JSON.stringify(response.data).length,
          headers: response.headers,
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        serviceId: service.id,
        status: 'unhealthy',
        responseTime,
        error: error.message,
        timestamp: new Date(),
        details: {
          errorType: error.code || 'UNKNOWN_ERROR',
          isTimeout: error.code === 'ECONNABORTED',
          isConnectionRefused: error.code === 'ECONNREFUSED',
        }
      };
    }
  }

  private async performHealthChecks(): Promise<void> {
    try {
      const services = await this.serviceRegistry.getAllServices();

      // Perform health checks in parallel with concurrency limit
      const concurrencyLimit = 5;
      const results: HealthCheckResult[] = [];

      for (let i = 0; i < services.length; i += concurrencyLimit) {
        const batch = services.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map((service: ServiceDefinition) => this.checkHealth(service));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      // Update service statuses
      for (const result of results) {
        await this.serviceRegistry.updateServiceStatus(result.serviceId, result.status);

        // Log status changes
        if (result.status !== 'healthy') {
          console.warn(`Service ${result.serviceId} health check failed:`, {
            status: result.status,
            responseTime: result.responseTime,
            error: result.error
          });
        }
      }

      // Log summary
      const healthyCount = results.filter(r => r.status === 'healthy').length;
      const totalCount = results.length;
      console.log(`Health check completed: ${healthyCount}/${totalCount} services healthy`);

    } catch (error) {
      console.error('Error performing health checks:', error);
    }
  }

  private determineServiceStatus(response: AxiosResponse, responseTime: number): ServiceStatus {
    // Check HTTP status
    if (response.status >= 200 && response.status < 300) {
      // Check response time (if too slow, consider degraded)
      if (responseTime > 5000) { // 5 seconds threshold
        return 'maintenance'; // Degraded performance
      }
      return 'healthy';
    }

    // 3xx redirects might be acceptable
    if (response.status >= 300 && response.status < 400) {
      return 'healthy';
    }

    // 4xx client errors usually mean unhealthy
    if (response.status >= 400 && response.status < 500) {
      return 'unhealthy';
    }

    // 5xx server errors
    return 'unhealthy';
  }

  async getHealthStatus(): Promise<Record<string, HealthCheckResult>> {
    const services = await this.serviceRegistry.getAllServices();
    const results: Record<string, HealthCheckResult> = {};

    for (const service of services) {
      results[service.id] = await this.checkHealth(service);
    }

    return results;
  }

  async getServiceHealth(serviceId: string): Promise<HealthCheckResult | null> {
    const service = await this.serviceRegistry.discover(serviceId);
    if (!service) {
      return null;
    }

    return await this.checkHealth(service);
  }

  // Get overall system health
  async getSystemHealth(): Promise<{
    overall: ServiceStatus;
    services: Record<string, ServiceStatus>;
    timestamp: Date;
  }> {
    const healthStatuses = await this.getHealthStatus();
    const services = Object.values(healthStatuses);

    // Determine overall health
    let overall: ServiceStatus = 'healthy';
    if (services.some(s => s.status === 'unhealthy')) {
      overall = 'unhealthy';
    } else if (services.some(s => s.status === 'maintenance')) {
      overall = 'maintenance';
    } else if (services.some(s => s.status === 'unknown')) {
      overall = 'unknown';
    }

    return {
      overall,
      services: Object.fromEntries(
        Object.entries(healthStatuses).map(([id, result]) => [id, result.status])
      ),
      timestamp: new Date()
    };
  }
}