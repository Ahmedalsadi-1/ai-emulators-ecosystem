/**
 * Performance Monitoring and Reporting System
 *
 * Provides real-time performance monitoring, alerting, and comprehensive reporting
 * for the unified application ecosystem.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as os from 'os';
import * as process from 'process';
import { PerformanceObserver, performance } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: Date;
  serviceId: string;
  serviceName: string;

  // System metrics
  cpu: {
    usage: number; // Percentage
    loadAverage: number[];
  };

  memory: {
    used: number; // MB
    total: number; // MB
    usage: number; // Percentage
  };

  disk: {
    used: number; // MB
    total: number; // MB
    usage: number; // Percentage
  };

  // Application metrics
  responseTime: {
    average: number; // ms
    p50: number; // ms
    p95: number; // ms
    p99: number; // ms
  };

  throughput: {
    requestsPerSecond: number;
    bytesPerSecond: number;
  };

  errorRate: {
    total: number;
    rate: number; // Percentage
  };

  // Connection metrics
  connections: {
    active: number;
    total: number;
  };

  // Custom metrics
  custom: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'cpu' | 'memory' | 'disk' | 'response_time' | 'error_rate' | 'throughput';
  serviceId: string;
  serviceName: string;
  message: string;
  value: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface PerformanceReport {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  services: {
    serviceId: string;
    serviceName: string;
    metrics: PerformanceMetrics[];
    alerts: PerformanceAlert[];
    summary: {
      avgResponseTime: number;
      maxResponseTime: number;
      totalRequests: number;
      errorCount: number;
      uptime: number; // Percentage
    };
  }[];
  system: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  };
  recommendations: string[];
}

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metrics: Map<string, PerformanceMetrics[]> = new Map();
  private readonly alerts: PerformanceAlert[] = [];
  private readonly thresholds: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeThresholds();
    this.setupPerformanceObserver();
    this.startMonitoring();
  }

  private initializeThresholds() {
    // CPU thresholds
    this.thresholds.set('cpu.warning', 70);
    this.thresholds.set('cpu.critical', 90);

    // Memory thresholds
    this.thresholds.set('memory.warning', 80);
    this.thresholds.set('memory.critical', 95);

    // Disk thresholds
    this.thresholds.set('disk.warning', 85);
    this.thresholds.set('disk.critical', 95);

    // Response time thresholds (ms)
    this.thresholds.set('response_time.warning', 1000);
    this.thresholds.set('response_time.critical', 5000);

    // Error rate thresholds (%)
    this.thresholds.set('error_rate.warning', 5);
    this.thresholds.set('error_rate.critical', 15);

    // Throughput minimum thresholds
    this.thresholds.set('throughput.minimum', 10); // requests per second
  }

  private setupPerformanceObserver() {
    const obs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        this.logger.debug(`Performance: ${entry.name} took ${entry.duration}ms`);
      }
    });

    obs.observe({ entryTypes: ['measure', 'function'] });
  }

  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      await this.collectSystemMetrics();
      await this.checkThresholds();
      await this.cleanupOldData();
    }, 30000); // Monitor every 30 seconds
  }

  async collectSystemMetrics(serviceId: string = 'system', serviceName: string = 'Unified System') {
    const timestamp = new Date();

    const metrics: PerformanceMetrics = {
      timestamp,
      serviceId,
      serviceName,
      cpu: {
        usage: this.getCpuUsage(),
        loadAverage: os.loadavg(),
      },
      memory: {
        used: this.getMemoryUsage().used,
        total: this.getMemoryUsage().total,
        usage: this.getMemoryUsage().usage,
      },
      disk: {
        used: this.getDiskUsage().used,
        total: this.getDiskUsage().total,
        usage: this.getDiskUsage().usage,
      },
      responseTime: {
        average: 0, // Will be updated by application metrics
        p50: 0,
        p95: 0,
        p99: 0,
      },
      throughput: {
        requestsPerSecond: 0,
        bytesPerSecond: 0,
      },
      errorRate: {
        total: 0,
        rate: 0,
      },
      connections: {
        active: 0,
        total: 0,
      },
      custom: {},
    };

    // Store metrics
    if (!this.metrics.has(serviceId)) {
      this.metrics.set(serviceId, []);
    }

    const serviceMetrics = this.metrics.get(serviceId)!;
    serviceMetrics.push(metrics);

    // Keep only last 100 metrics per service
    if (serviceMetrics.length > 100) {
      serviceMetrics.shift();
    }

    // Emit metrics collected event
    this.eventEmitter.emit('performance.metrics.collected', metrics);
  }

  recordApplicationMetrics(
    serviceId: string,
    serviceName: string,
    responseTime: number,
    success: boolean,
    bytesTransferred: number = 0
  ) {
    const metrics = this.metrics.get(serviceId);
    if (!metrics || metrics.length === 0) return;

    const latestMetrics = metrics[metrics.length - 1];

    // Update response time metrics
    latestMetrics.responseTime.average = (
      latestMetrics.responseTime.average + responseTime
    ) / 2;

    // Update throughput
    latestMetrics.throughput.requestsPerSecond += 1;
    latestMetrics.throughput.bytesPerSecond += bytesTransferred;

    // Update error rate
    if (!success) {
      latestMetrics.errorRate.total += 1;
    }

    // Calculate error rate percentage
    const totalRequests = latestMetrics.throughput.requestsPerSecond;
    if (totalRequests > 0) {
      latestMetrics.errorRate.rate = (latestMetrics.errorRate.total / totalRequests) * 100;
    }
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~(100 * totalIdle / totalTick);
  }

  private getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      usage: Math.round((usedMem / totalMem) * 100), // Percentage
    };
  }

  private getDiskUsage() {
    // Note: In a real implementation, you'd use a library like 'diskusage'
    // For now, return mock data
    return {
      used: 50000, // MB
      total: 100000, // MB
      usage: 50, // Percentage
    };
  }

  private async checkThresholds() {
    for (const [serviceId, serviceMetrics] of this.metrics.entries()) {
      if (serviceMetrics.length === 0) continue;

      const latest = serviceMetrics[serviceMetrics.length - 1];
      const serviceName = latest.serviceName;

      // Check CPU usage
      if (latest.cpu.usage >= this.thresholds.get('cpu.critical')!) {
        await this.createAlert('critical', 'cpu', serviceId, serviceName,
          `Critical CPU usage: ${latest.cpu.usage}%`, latest.cpu.usage, this.thresholds.get('cpu.critical')!);
      } else if (latest.cpu.usage >= this.thresholds.get('cpu.warning')!) {
        await this.createAlert('high', 'cpu', serviceId, serviceName,
          `High CPU usage: ${latest.cpu.usage}%`, latest.cpu.usage, this.thresholds.get('cpu.warning')!);
      }

      // Check memory usage
      if (latest.memory.usage >= this.thresholds.get('memory.critical')!) {
        await this.createAlert('critical', 'memory', serviceId, serviceName,
          `Critical memory usage: ${latest.memory.usage}%`, latest.memory.usage, this.thresholds.get('memory.critical')!);
      } else if (latest.memory.usage >= this.thresholds.get('memory.warning')!) {
        await this.createAlert('high', 'memory', serviceId, serviceName,
          `High memory usage: ${latest.memory.usage}%`, latest.memory.usage, this.thresholds.get('memory.warning')!);
      }

      // Check response time
      if (latest.responseTime.average >= this.thresholds.get('response_time.critical')!) {
        await this.createAlert('critical', 'response_time', serviceId, serviceName,
          `Critical response time: ${latest.responseTime.average}ms`, latest.responseTime.average, this.thresholds.get('response_time.critical')!);
      } else if (latest.responseTime.average >= this.thresholds.get('response_time.warning')!) {
        await this.createAlert('high', 'response_time', serviceId, serviceName,
          `High response time: ${latest.responseTime.average}ms`, latest.responseTime.average, this.thresholds.get('response_time.warning')!);
      }

      // Check error rate
      if (latest.errorRate.rate >= this.thresholds.get('error_rate.critical')!) {
        await this.createAlert('critical', 'error_rate', serviceId, serviceName,
          `Critical error rate: ${latest.errorRate.rate}%`, latest.errorRate.rate, this.thresholds.get('error_rate.critical')!);
      } else if (latest.errorRate.rate >= this.thresholds.get('error_rate.warning')!) {
        await this.createAlert('high', 'error_rate', serviceId, serviceName,
          `High error rate: ${latest.errorRate.rate}%`, latest.errorRate.rate, this.thresholds.get('error_rate.warning')!);
      }
    }
  }

  private async createAlert(
    severity: PerformanceAlert['severity'],
    type: PerformanceAlert['type'],
    serviceId: string,
    serviceName: string,
    message: string,
    value: number,
    threshold: number
  ) {
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(
      alert => alert.type === type &&
               alert.serviceId === serviceId &&
               !alert.resolved &&
               alert.severity === severity
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.value = value;
      existingAlert.timestamp = new Date();
    } else {
      // Create new alert
      const alert: PerformanceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        severity,
        type,
        serviceId,
        serviceName,
        message,
        value,
        threshold,
        resolved: false,
      };

      this.alerts.push(alert);

      // Emit alert event
      this.eventEmitter.emit('performance.alert.created', alert);

      this.logger.warn(`Performance Alert: ${message}`);
    }
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      this.eventEmitter.emit('performance.alert.resolved', alert);
      this.logger.info(`Performance Alert Resolved: ${alert.message}`);
    }
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  getResolvedAlerts(limit: number = 100): PerformanceAlert[] {
    return this.alerts
      .filter(alert => alert.resolved)
      .sort((a, b) => b.resolvedAt!.getTime() - a.resolvedAt!.getTime())
      .slice(0, limit);
  }

  getMetrics(serviceId?: string, limit: number = 50): PerformanceMetrics[] {
    if (serviceId) {
      const serviceMetrics = this.metrics.get(serviceId) || [];
      return serviceMetrics.slice(-limit);
    }

    // Return metrics for all services
    const allMetrics: PerformanceMetrics[] = [];
    for (const serviceMetrics of this.metrics.values()) {
      allMetrics.push(...serviceMetrics.slice(-limit));
    }

    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  async generatePerformanceReport(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      id: `report-${Date.now()}`,
      timestamp: new Date(),
      period: { start: startDate, end: endDate },
      services: [],
      system: {
        totalServices: 0,
        healthyServices: 0,
        degradedServices: 0,
        unhealthyServices: 0,
        overallHealth: 'healthy',
      },
      recommendations: [],
    };

    // Generate service-level reports
    for (const [serviceId, serviceMetrics] of this.metrics.entries()) {
      const periodMetrics = serviceMetrics.filter(
        m => m.timestamp >= startDate && m.timestamp <= endDate
      );

      if (periodMetrics.length === 0) continue;

      const latestMetrics = periodMetrics[periodMetrics.length - 1];
      const serviceAlerts = this.alerts.filter(
        a => a.serviceId === serviceId &&
             a.timestamp >= startDate &&
             a.timestamp <= endDate
      );

      // Calculate summary statistics
      const responseTimes = periodMetrics.map(m => m.responseTime.average).filter(rt => rt > 0);
      const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
      const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
      const totalRequests = periodMetrics.reduce((sum, m) => sum + m.throughput.requestsPerSecond, 0);
      const errorCount = periodMetrics.reduce((sum, m) => sum + m.errorRate.total, 0);

      // Calculate uptime (simple approximation based on error rate)
      const avgErrorRate = periodMetrics.reduce((sum, m) => sum + m.errorRate.rate, 0) / periodMetrics.length;
      const uptime = Math.max(0, 100 - avgErrorRate);

      const serviceReport = {
        serviceId,
        serviceName: latestMetrics.serviceName,
        metrics: periodMetrics,
        alerts: serviceAlerts,
        summary: {
          avgResponseTime,
          maxResponseTime,
          totalRequests,
          errorCount,
          uptime,
        },
      };

      report.services.push(serviceReport);
    }

    // Calculate system-level statistics
    report.system.totalServices = report.services.length;
    report.system.healthyServices = report.services.filter(s => s.summary.uptime >= 99.9).length;
    report.system.degradedServices = report.services.filter(s => s.summary.uptime >= 95 && s.summary.uptime < 99.9).length;
    report.system.unhealthyServices = report.services.filter(s => s.summary.uptime < 95).length;

    // Determine overall health
    const healthyPercentage = report.system.healthyServices / report.system.totalServices;
    if (healthyPercentage >= 0.95) {
      report.system.overallHealth = 'healthy';
    } else if (healthyPercentage >= 0.80) {
      report.system.overallHealth = 'degraded';
    } else if (healthyPercentage >= 0.50) {
      report.system.overallHealth = 'unhealthy';
    } else {
      report.system.overallHealth = 'critical';
    }

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];

    // CPU recommendations
    const highCpuServices = report.services.filter(s =>
      s.metrics.some(m => m.cpu.usage > 80)
    );
    if (highCpuServices.length > 0) {
      recommendations.push(`Optimize CPU usage for services: ${highCpuServices.map(s => s.serviceName).join(', ')}`);
    }

    // Memory recommendations
    const highMemoryServices = report.services.filter(s =>
      s.metrics.some(m => m.memory.usage > 85)
    );
    if (highMemoryServices.length > 0) {
      recommendations.push(`Review memory usage for services: ${highMemoryServices.map(s => s.serviceName).join(', ')}`);
    }

    // Response time recommendations
    const slowServices = report.services.filter(s =>
      s.summary.avgResponseTime > 1000
    );
    if (slowServices.length > 0) {
      recommendations.push(`Improve response times for services: ${slowServices.map(s => s.serviceName).join(', ')}`);
    }

    // Error rate recommendations
    const errorProneServices = report.services.filter(s =>
      s.summary.errorCount > s.summary.totalRequests * 0.05
    );
    if (errorProneServices.length > 0) {
      recommendations.push(`Reduce error rates for services: ${errorProneServices.map(s => s.serviceName).join(', ')}`);
    }

    // Scale recommendations
    if (report.system.overallHealth === 'critical') {
      recommendations.push('Consider scaling up infrastructure or optimizing resource allocation');
    } else if (report.system.overallHealth === 'unhealthy') {
      recommendations.push('Monitor services closely and consider horizontal scaling');
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push('System performance is within acceptable ranges');
      recommendations.push('Continue monitoring and consider implementing additional performance optimizations');
    }

    return recommendations;
  }

  private cleanupOldData() {
    const retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffDate = new Date(Date.now() - retentionPeriod);

    // Clean up old metrics
    for (const [serviceId, serviceMetrics] of this.metrics.entries()) {
      const filteredMetrics = serviceMetrics.filter(m => m.timestamp >= cutoffDate);
      this.metrics.set(serviceId, filteredMetrics);
    }

    // Clean up old alerts (keep resolved alerts for 7 days)
    const alertRetentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    const alertCutoffDate = new Date(Date.now() - alertRetentionPeriod);

    const filteredAlerts = this.alerts.filter(alert =>
      !alert.resolved || alert.resolvedAt! >= alertCutoffDate
    );

    this.alerts.splice(0, this.alerts.length - filteredAlerts.length, ...filteredAlerts);
  }

  // Graceful shutdown
  onModuleDestroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}