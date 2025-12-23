import { ServiceDefinition, ServiceStatus } from '@/types';

export class ServiceRegistry {
  private services = new Map<string, ServiceDefinition>();

  async register(service: ServiceDefinition): Promise<void> {
    this.services.set(service.id, {
      ...service,
      status: 'unknown' as ServiceStatus,
      lastHealthCheck: new Date()
    });
  }

  async discover(serviceId: string): Promise<ServiceDefinition | null> {
    return this.services.get(serviceId) || null;
  }

  async getAllServices(): Promise<ServiceDefinition[]> {
    return Array.from(this.services.values());
  }

  async getServicesByCategory(category: string): Promise<ServiceDefinition[]> {
    return Array.from(this.services.values())
      .filter(service => service.metadata.category === category);
  }

  async updateServiceStatus(serviceId: string, status: ServiceStatus): Promise<void> {
    const service = this.services.get(serviceId);
    if (service) {
      service.status = status;
      service.lastHealthCheck = new Date();
    }
  }
}