import { ServiceDefinition } from '@/types';

export class LoadBalancer {
  private serviceMetrics: Map<string, { requests: number; responseTime: number }> = new Map();

  async selectTarget(services: ServiceDefinition[]): Promise<ServiceDefinition> {
    if (services.length === 1) {
      return services[0];
    }

    // Filter healthy services
    const healthyServices = services.filter(s => s.status === 'healthy');

    if (healthyServices.length === 0) {
      // Fallback to any available service
      return services[0];
    }

    // Use least connections strategy for now
    // In production, you might want round-robin, weighted, or other strategies
    return this.leastConnections(healthyServices);
  }

  private leastConnections(services: ServiceDefinition[]): ServiceDefinition {
    let selectedService = services[0];
    let minRequests = this.getServiceRequests(selectedService.id);

    for (const service of services.slice(1)) {
      const requests = this.getServiceRequests(service.id);
      if (requests < minRequests) {
        selectedService = service;
        minRequests = requests;
      }
    }

    // Increment request count for selected service
    this.incrementRequests(selectedService.id);

    return selectedService;
  }

  private getServiceRequests(serviceId: string): number {
    return this.serviceMetrics.get(serviceId)?.requests || 0;
  }

  private incrementRequests(serviceId: string): void {
    const metrics = this.serviceMetrics.get(serviceId) || { requests: 0, responseTime: 0 };
    metrics.requests++;
    this.serviceMetrics.set(serviceId, metrics);
  }

  updateResponseTime(serviceId: string, responseTime: number): void {
    const metrics = this.serviceMetrics.get(serviceId) || { requests: 0, responseTime: 0 };
    metrics.responseTime = responseTime;
    this.serviceMetrics.set(serviceId, metrics);
  }

  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.serviceMetrics);
  }
}