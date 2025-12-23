import Docker from 'dockerode';

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  health?: 'healthy' | 'unhealthy' | 'unknown';
  ports?: string[];
  cpu?: number;
  memory?: number;
  created?: string;
  project?: string;
}

export interface LogOptions {
  tail?: number;
  since?: string;
  follow?: boolean;
}

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
    });
  }

  async getAllServices(): Promise<ServiceStatus[]> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      const services: ServiceStatus[] = [];

      for (const container of containers) {
        const service = await this.getContainerStatus(container);
        if (service) {
          services.push(service);
        }
      }

      return services;
    } catch (error) {
      throw new Error(`Failed to get services: ${error.message}`);
    }
  }

  async getServiceStatus(serviceName: string): Promise<ServiceStatus | null> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: { name: [serviceName] }
      });

      if (containers.length === 0) {
        return null;
      }

      return await this.getContainerStatus(containers[0]);
    } catch (error) {
      throw new Error(`Failed to get service status: ${error.message}`);
    }
  }

  private async getContainerStatus(containerInfo: any): Promise<ServiceStatus> {
    const container = this.docker.getContainer(containerInfo.Id);

    try {
      const stats = await container.stats({ stream: false });
      const inspection = await container.inspect();

      // Extract project from labels or compose project
      const project = inspection.Config.Labels?.['com.docker.compose.project'] ||
                     inspection.Config.Labels?.['ai-ecosystem.project'] ||
                     'unknown';

      // Get health status
      let health: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
      if (inspection.State.Health) {
        health = inspection.State.Health.Status;
      }

      // Extract ports
      const ports: string[] = [];
      if (inspection.NetworkSettings.Ports) {
        Object.entries(inspection.NetworkSettings.Ports).forEach(([internal, external]) => {
          if (external && external.length > 0) {
            external.forEach((port: any) => {
              ports.push(`${port.HostPort}:${internal.split('/')[0]}`);
            });
          }
        });
      }

      // Calculate CPU and memory usage
      const cpuPercent = this.calculateCPUPercent(stats);
      const memoryUsage = stats.memory_stats?.usage || 0;
      const memoryLimit = stats.memory_stats?.limit || 0;
      const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

      return {
        name: containerInfo.Names[0].replace('/', ''),
        status: containerInfo.State === 'running' ? 'running' :
                containerInfo.State === 'exited' ? 'stopped' : 'error',
        health,
        ports,
        cpu: Math.round(cpuPercent * 100) / 100,
        memory: Math.round(memoryPercent * 100) / 100,
        created: inspection.Created,
        project
      };
    } catch (error) {
      return {
        name: containerInfo.Names[0].replace('/', ''),
        status: 'error',
        project: 'unknown'
      };
    }
  }

  async startService(serviceName: string): Promise<void> {
    const container = await this.findContainer(serviceName);
    if (!container) {
      throw new Error(`Service ${serviceName} not found`);
    }

    await container.start();
  }

  async stopService(serviceName: string): Promise<void> {
    const container = await this.findContainer(serviceName);
    if (!container) {
      throw new Error(`Service ${serviceName} not found`);
    }

    await container.stop();
  }

  async restartService(serviceName: string): Promise<void> {
    const container = await this.findContainer(serviceName);
    if (!container) {
      throw new Error(`Service ${serviceName} not found`);
    }

    await container.restart();
  }

  async getServiceLogs(serviceName: string, options: LogOptions = {}): Promise<string[]> {
    const container = await this.findContainer(serviceName);
    if (!container) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const logOptions = {
      stdout: true,
      stderr: true,
      tail: options.tail || 100,
      timestamps: true,
      ...(options.since && { since: Math.floor(new Date(options.since).getTime() / 1000) })
    };

    const logs = await container.logs(logOptions);
    return logs.toString().split('\n').filter(line => line.trim());
  }

  async getServiceMetrics(serviceName: string): Promise<any> {
    const container = await this.findContainer(serviceName);
    if (!container) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const stats = await container.stats({ stream: false });
    return {
      cpu: this.calculateCPUPercent(stats),
      memory: {
        usage: stats.memory_stats?.usage || 0,
        limit: stats.memory_stats?.limit || 0,
        percent: stats.memory_stats?.limit ?
          (stats.memory_stats.usage / stats.memory_stats.limit) * 100 : 0
      },
      network: stats.networks || {},
      blockIO: stats.blkio_stats || {}
    };
  }

  private async findContainer(serviceName: string) {
    const containers = await this.docker.listContainers({
      all: true,
      filters: { name: [serviceName] }
    });

    if (containers.length === 0) {
      return null;
    }

    return this.docker.getContainer(containers[0].Id);
  }

  private calculateCPUPercent(stats: any): number {
    if (!stats || !stats.cpu_stats || !stats.precpu_stats) {
      return 0;
    }

    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

    if (systemDelta > 0 && cpuDelta > 0) {
      const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
      return cpuPercent;
    }

    return 0;
  }
}