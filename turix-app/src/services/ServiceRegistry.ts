// Service Registry for managing TuriX services
export interface ServiceConfig {
  name: string;
  displayName: string;
  description: string;
  capabilities: string[];
  actions: string[];
  ui: any; // React component
  commands: string[];
  endpoint?: string;
  mcpPort?: number;
}

class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceConfig> = new Map();

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  registerService(config: ServiceConfig): void {
    this.services.set(config.name, config);

    // Notify Electron main process
    if (window.electronAPI) {
      window.electronAPI.registerService(config);
    }
  }

  unregisterService(name: string): void {
    this.services.delete(name);
  }

  getService(name: string): ServiceConfig | undefined {
    return this.services.get(name);
  }

  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  getServicesByCapability(capability: string): ServiceConfig[] {
    return this.getAllServices().filter(service =>
      service.capabilities.includes(capability)
    );
  }

  processCommand(command: string): { service: string; action: string; params: any } | null {
    const lowerCommand = command.toLowerCase();

    for (const [serviceName, service] of this.services) {
      // Check direct command matches
      for (const cmd of service.commands) {
        if (lowerCommand.includes(cmd.toLowerCase())) {
          return {
            service: serviceName,
            action: cmd,
            params: this.extractParams(command, cmd)
          };
        }
      }

      // Check capability-based commands
      for (const capability of service.capabilities) {
        if (lowerCommand.includes(capability.toLowerCase())) {
          return {
            service: serviceName,
            action: capability,
            params: this.extractParams(command, capability)
          };
        }
      }
    }

    return null;
  }

  private extractParams(command: string, matchedTerm: string): any {
    // Simple parameter extraction - can be enhanced
    const afterMatch = command.toLowerCase().split(matchedTerm.toLowerCase())[1]?.trim();
    return afterMatch ? { query: afterMatch } : {};
  }
}

export default ServiceRegistry;