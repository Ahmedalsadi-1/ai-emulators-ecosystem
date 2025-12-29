import { Injectable, Logger } from '@nestjs/common';

export interface PerformanceMetrics {
  provider: string;
  model: string;
  responseTime: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  success: boolean;
  timestamp: Date;
  error?: string;
}

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>) {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetrics);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    this.logger.debug(
      `Performance metrics recorded: ${metrics.provider}/${metrics.model} - ${metrics.responseTime}ms, ${metrics.success ? 'SUCCESS' : 'FAILED'}`
    );
  }

  getMetrics(
    provider?: string,
    model?: string,
    limit: number = 100
  ): PerformanceMetrics[] {
    let filtered = this.metrics;

    if (provider) {
      filtered = filtered.filter(m => m.provider === provider);
    }

    if (model) {
      filtered = filtered.filter(m => m.model === model);
    }

    return filtered.slice(-limit);
  }

  getProviderStats(provider?: string) {
    const metrics = provider ? this.getMetrics(provider) : this.metrics;

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalTokens: 0,
      };
    }

    const successful = metrics.filter(m => m.success);
    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);

    return {
      totalRequests: metrics.length,
      successRate: (successful.length / metrics.length) * 100,
      averageResponseTime: totalResponseTime / metrics.length,
      totalTokens,
    };
  }

  getRecentErrors(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter(m => !m.success)
      .slice(-limit);
  }

  getTopSlowest(limit: number = 10): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }
}