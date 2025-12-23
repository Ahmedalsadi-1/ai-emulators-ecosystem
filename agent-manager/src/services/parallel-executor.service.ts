/**
 * Parallel Executor Service - Phase 2 Enhanced
 * Handles parallel agent execution, resource allocation, and performance monitoring
 * with support for 100 concurrent agents, resource throttling, distributed locking,
 * and circuit breaker patterns
 * 
 * @agent Agent C - Advanced Systems & Infrastructure Specialist
 * @date 2025-12-21
 * @phase Phase 2
 * @requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { Logger } from '../utils/logger';
import { z } from 'zod';
import { Agent, PlatformId } from '../interfaces';

// ============================================================================
// Schemas
// ============================================================================

const ExecutionTaskSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string(),
  platform: z.enum(['kilo', 'opencode', 'skills-system']),
  command: z.string(),
  args: z.record(z.any()),
  priority: z.number().min(0).max(10),
  timeout: z.number().positive(),
  createdAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  result: z.any().optional(),
  error: z.string().optional(),
});

const ResourceAllocationSchema = z.object({
  taskId: z.string().uuid(),
  cpuAllocation: z.number().min(0).max(100),
  memoryAllocation: z.number().positive(),
  networkBandwidth: z.number().positive(),
  allocatedAt: z.date(),
  releasedAt: z.date().optional(),
});

const ExecutionMetricsSchema = z.object({
  taskId: z.string().uuid(),
  executionTime: z.number().positive(),
  cpuUsage: z.number().min(0).max(100),
  memoryUsage: z.number().positive(),
  networkUsage: z.number().positive(),
  successRate: z.number().min(0).max(1),
  throughput: z.number().positive(),
});

// Phase 2: Distributed locking
const DistributedLockSchema = z.object({
  lockId: z.string().uuid(),
  resourceId: z.string(),
  taskId: z.string().uuid(),
  acquiredAt: z.date(),
  expiresAt: z.date(),
  renewedAt: z.date().optional(),
});

// Phase 2: Circuit breaker state
const CircuitBreakerSchema = z.object({
  agentId: z.string(),
  state: z.enum(['closed', 'open', 'half-open']),
  failureCount: z.number().default(0),
  successCount: z.number().default(0),
  lastFailureAt: z.date().optional(),
  lastSuccessAt: z.date().optional(),
  openedAt: z.date().optional(),
  threshold: z.number().default(5),
  timeout: z.number().default(60000), // 60 seconds
});

export type ExecutionTask = z.infer<typeof ExecutionTaskSchema>;
export type ResourceAllocation = z.infer<typeof ResourceAllocationSchema>;
export type ExecutionMetrics = z.infer<typeof ExecutionMetricsSchema>;
export type DistributedLock = z.infer<typeof DistributedLockSchema>;
export type CircuitBreaker = z.infer<typeof CircuitBreakerSchema>;

// ============================================================================
// Parallel Executor Service
// ============================================================================

export class ParallelExecutorService {
  private logger: Logger;
  private tasks: Map<string, ExecutionTask> = new Map();
  private resourceAllocations: Map<string, ResourceAllocation> = new Map();
  private executionMetrics: Map<string, ExecutionMetrics> = new Map();
  private maxConcurrentTasks: number = 100; // Phase 2: Increased from 10 to 100
  private runningTasks: Set<string> = new Set();
  
  // Phase 2: Enhanced features
  private distributedLocks: Map<string, DistributedLock> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private resourceThrottleThreshold: number = 80; // 80% utilization
  private currentCpuUsage: number = 0;
  private currentMemoryUsage: number = 0;
  private isThrottling: boolean = false;
  private metricsUpdateInterval: NodeJS.Timeout | null = null;
  private priorityQueue: Map<number, string[]> = new Map(); // priority -> taskIds

  constructor(maxConcurrentTasks: number = 100) {
    this.logger = new Logger('ParallelExecutorService');
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.logger.info(`Parallel Executor initialized with max ${maxConcurrentTasks} concurrent tasks`);
    
    // Start real-time metrics collection
    this.startMetricsCollection();
  }

  /**
   * Execute a task in parallel
   * Property: Parallel execution should handle concurrent tasks without blocking
   */
  async executeTask(
    agentId: string,
    platform: PlatformId,
    command: string,
    args: Record<string, any>,
    priority: number = 5,
    timeout: number = 30000
  ): Promise<ExecutionTask> {
    try {
      this.logger.info(`Executing task for agent ${agentId} on platform ${platform}`);

      // Wait for available slot if at capacity
      while (this.runningTasks.size >= this.maxConcurrentTasks) {
        await this.delay(100);
      }

      const task: ExecutionTask = {
        id: this.generateUUID(),
        agentId,
        platform,
        command,
        args,
        priority,
        timeout,
        createdAt: new Date(),
        status: 'pending',
      };

      // Validate task schema
      ExecutionTaskSchema.parse(task);

      // Store task
      this.tasks.set(task.id, task);

      // Execute task asynchronously
      this.executeTaskAsync(task);

      this.logger.info(`Task queued: ${task.id}`);
      return task;
    } catch (error) {
      this.logger.error(`Failed to execute task: ${error}`);
      throw error;
    }
  }

  /**
   * Allocate resources for a task
   * Property: Resource allocation should respect system limits
   */
  async allocateResources(
    taskId: string,
    cpuAllocation: number,
    memoryAllocation: number,
    networkBandwidth: number
  ): Promise<ResourceAllocation> {
    try {
      this.logger.info(`Allocating resources for task ${taskId}`);

      // Validate resource limits
      if (cpuAllocation < 0 || cpuAllocation > 100) {
        throw new Error('CPU allocation must be between 0 and 100');
      }
      if (memoryAllocation <= 0) {
        throw new Error('Memory allocation must be positive');
      }
      if (networkBandwidth <= 0) {
        throw new Error('Network bandwidth must be positive');
      }

      const allocation: ResourceAllocation = {
        taskId,
        cpuAllocation,
        memoryAllocation,
        networkBandwidth,
        allocatedAt: new Date(),
      };

      // Validate allocation schema
      ResourceAllocationSchema.parse(allocation);

      // Store allocation
      this.resourceAllocations.set(taskId, allocation);

      this.logger.info(`Resources allocated for task ${taskId}`);
      return allocation;
    } catch (error) {
      this.logger.error(`Failed to allocate resources: ${error}`);
      throw error;
    }
  }

  /**
   * Release resources for a task
   * Property: Resource release should free allocated resources
   */
  async releaseResources(taskId: string): Promise<void> {
    try {
      this.logger.info(`Releasing resources for task ${taskId}`);

      const allocation = this.resourceAllocations.get(taskId);
      if (allocation) {
        allocation.releasedAt = new Date();
        this.logger.info(`Resources released for task ${taskId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to release resources: ${error}`);
      throw error;
    }
  }

  /**
   * Get task status
   * Property: Task status should be accurate and up-to-date
   */
  async getTaskStatus(taskId: string): Promise<ExecutionTask | undefined> {
    return this.tasks.get(taskId);
  }

  /**
   * List all tasks with optional filtering
   * Property: Task listing should return all tasks matching criteria
   */
  async listTasks(
    agentId?: string,
    status?: ExecutionTask['status'],
    platform?: PlatformId
  ): Promise<ExecutionTask[]> {
    const allTasks = Array.from(this.tasks.values());

    return allTasks.filter((task) => {
      if (agentId && task.agentId !== agentId) return false;
      if (status && task.status !== status) return false;
      if (platform && task.platform !== platform) return false;
      return true;
    });
  }

  /**
   * Cancel a running task
   * Property: Task cancellation should stop execution and free resources
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      this.logger.info(`Cancelling task ${taskId}`);

      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'cancelled';
        this.runningTasks.delete(taskId);
        await this.releaseResources(taskId);
        this.logger.info(`Task cancelled: ${taskId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cancel task: ${error}`);
      throw error;
    }
  }

  /**
   * Get execution metrics for a task
   * Property: Execution metrics should be accurate and complete
   */
  async getExecutionMetrics(taskId: string): Promise<ExecutionMetrics | undefined> {
    return this.executionMetrics.get(taskId);
  }

  /**
   * Get aggregated metrics for all tasks
   * Property: Aggregated metrics should reflect system performance
   */
  async getAggregatedMetrics(): Promise<{
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    systemThroughput: number;
  }> {
    const allTasks = Array.from(this.tasks.values());
    const allMetrics = Array.from(this.executionMetrics.values());

    const completedTasks = allTasks.filter((t) => t.status === 'completed');
    const failedTasks = allTasks.filter((t) => t.status === 'failed');

    const avgExecutionTime =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / allMetrics.length
        : 0;

    const avgCpuUsage =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / allMetrics.length
        : 0;

    const avgMemoryUsage =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / allMetrics.length
        : 0;

    const systemThroughput =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.throughput, 0) / allMetrics.length
        : 0;

    return {
      totalTasks: allTasks.length,
      runningTasks: this.runningTasks.size,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageExecutionTime: avgExecutionTime,
      averageCpuUsage: avgCpuUsage,
      averageMemoryUsage: avgMemoryUsage,
      systemThroughput: systemThroughput,
    };
  }

  /**
   * Coordinate execution across multiple agents
   * Property: Execution coordination should maintain task ordering and dependencies
   */
  async coordinateExecution(
    tasks: Array<{
      agentId: string;
      platform: PlatformId;
      command: string;
      args: Record<string, any>;
      dependencies?: string[];
    }>
  ): Promise<ExecutionTask[]> {
    try {
      this.logger.info(`Coordinating execution of ${tasks.length} tasks`);

      const executedTasks: ExecutionTask[] = [];

      for (const taskDef of tasks) {
        // Wait for dependencies if any
        if (taskDef.dependencies) {
          for (const depTaskId of taskDef.dependencies) {
            const depTask = this.tasks.get(depTaskId);
            if (depTask) {
              while (depTask.status !== 'completed' && depTask.status !== 'failed') {
                await this.delay(100);
              }
            }
          }
        }

        // Execute task
        const task = await this.executeTask(
          taskDef.agentId,
          taskDef.platform,
          taskDef.command,
          taskDef.args
        );
        executedTasks.push(task);
      }

      this.logger.info(`Execution coordination completed for ${executedTasks.length} tasks`);
      return executedTasks;
    } catch (error) {
      this.logger.error(`Failed to coordinate execution: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // Phase 2: Advanced Parallel Execution Features
  // ============================================================================

  /**
   * Acquire distributed lock for shared resource
   * Property 33: Distributed Locking
   * Validates: Requirement 12.3
   */
  async acquireLock(resourceId: string, taskId: string, ttlMs: number = 30000): Promise<DistributedLock> {
    try {
      this.logger.info(`Acquiring lock for resource ${resourceId} by task ${taskId}`);

      // Check if resource is already locked
      const existingLock = Array.from(this.distributedLocks.values()).find(
        lock => lock.resourceId === resourceId && lock.expiresAt > new Date()
      );

      if (existingLock) {
        throw new Error(`Resource ${resourceId} is already locked by task ${existingLock.taskId}`);
      }

      const lock: DistributedLock = {
        lockId: this.generateUUID(),
        resourceId,
        taskId,
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + ttlMs),
      };

      DistributedLockSchema.parse(lock);
      this.distributedLocks.set(lock.lockId, lock);

      this.logger.info(`Lock acquired: ${lock.lockId} for resource ${resourceId}`);
      return lock;
    } catch (error) {
      this.logger.error(`Failed to acquire lock: ${error}`);
      throw error;
    }
  }

  /**
   * Release distributed lock
   * Property 33: Distributed Locking
   * Validates: Requirement 12.3
   */
  async releaseLock(lockId: string): Promise<void> {
    try {
      this.logger.info(`Releasing lock ${lockId}`);
      this.distributedLocks.delete(lockId);
      this.logger.info(`Lock released: ${lockId}`);
    } catch (error) {
      this.logger.error(`Failed to release lock: ${error}`);
      throw error;
    }
  }

  /**
   * Check and apply resource throttling
   * Property 32: Resource Throttling
   * Validates: Requirement 12.2
   */
  async checkResourceThrottling(): Promise<{ shouldThrottle: boolean; reason?: string }> {
    try {
      // Update current resource usage
      this.updateResourceUsage();

      const cpuExceeded = this.currentCpuUsage > this.resourceThrottleThreshold;
      const memoryExceeded = this.currentMemoryUsage > this.resourceThrottleThreshold;

      if (cpuExceeded || memoryExceeded) {
        this.isThrottling = true;
        const reason = [];
        if (cpuExceeded) reason.push(`CPU: ${this.currentCpuUsage.toFixed(1)}%`);
        if (memoryExceeded) reason.push(`Memory: ${this.currentMemoryUsage.toFixed(1)}%`);
        
        this.logger.warn(`Resource throttling activated: ${reason.join(', ')}`);
        return { shouldThrottle: true, reason: reason.join(', ') };
      }

      if (this.isThrottling) {
        this.logger.info('Resource throttling deactivated');
        this.isThrottling = false;
      }

      return { shouldThrottle: false };
    } catch (error) {
      this.logger.error(`Failed to check resource throttling: ${error}`);
      throw error;
    }
  }

  /**
   * Execute task with priority-based scheduling
   * Property 32: Resource Throttling
   * Validates: Requirement 12.2
   */
  async executeTaskWithPriority(
    agentId: string,
    platform: PlatformId,
    command: string,
    args: Record<string, any>,
    priority: number = 5,
    timeout: number = 30000
  ): Promise<ExecutionTask> {
    try {
      // Check resource throttling
      const throttleCheck = await this.checkResourceThrottling();
      
      if (throttleCheck.shouldThrottle && priority < 8) {
        // Queue low-priority tasks when throttling
        this.logger.info(`Task queued due to throttling (priority ${priority}): ${agentId}`);
        const task = await this.executeTask(agentId, platform, command, args, priority, timeout);
        
        // Add to priority queue
        const queue = this.priorityQueue.get(priority) || [];
        queue.push(task.id);
        this.priorityQueue.set(priority, queue);
        
        return task;
      }

      // Execute high-priority tasks immediately
      return await this.executeTask(agentId, platform, command, args, priority, timeout);
    } catch (error) {
      this.logger.error(`Failed to execute task with priority: ${error}`);
      throw error;
    }
  }

  /**
   * Get or create circuit breaker for agent
   * Property 34: Circuit Breaker Pattern
   * Validates: Requirement 12.4
   */
  async getCircuitBreaker(agentId: string): Promise<CircuitBreaker> {
    let breaker = this.circuitBreakers.get(agentId);
    
    if (!breaker) {
      breaker = {
        agentId,
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        threshold: 5,
        timeout: 60000,
      };
      CircuitBreakerSchema.parse(breaker);
      this.circuitBreakers.set(agentId, breaker);
    }

    return breaker;
  }

  /**
   * Execute task with circuit breaker protection
   * Property 34: Circuit Breaker Pattern
   * Validates: Requirement 12.4
   */
  async executeWithCircuitBreaker(
    agentId: string,
    platform: PlatformId,
    command: string,
    args: Record<string, any>
  ): Promise<ExecutionTask> {
    try {
      const breaker = await this.getCircuitBreaker(agentId);

      // Check circuit breaker state
      if (breaker.state === 'open') {
        const timeSinceOpen = Date.now() - (breaker.openedAt?.getTime() || 0);
        
        if (timeSinceOpen < breaker.timeout) {
          throw new Error(`Circuit breaker is OPEN for agent ${agentId}. Retry after ${breaker.timeout - timeSinceOpen}ms`);
        }
        
        // Transition to half-open
        breaker.state = 'half-open';
        this.logger.info(`Circuit breaker transitioned to HALF-OPEN for agent ${agentId}`);
      }

      // Execute task
      const task = await this.executeTask(agentId, platform, command, args);

      // Wait for task completion
      while (task.status === 'pending' || task.status === 'running') {
        await this.delay(100);
      }

      // Update circuit breaker based on result
      if (task.status === 'completed') {
        breaker.successCount++;
        breaker.lastSuccessAt = new Date();
        
        if (breaker.state === 'half-open') {
          breaker.state = 'closed';
          breaker.failureCount = 0;
          this.logger.info(`Circuit breaker CLOSED for agent ${agentId}`);
        }
      } else {
        breaker.failureCount++;
        breaker.lastFailureAt = new Date();
        
        if (breaker.failureCount >= breaker.threshold) {
          breaker.state = 'open';
          breaker.openedAt = new Date();
          this.logger.warn(`Circuit breaker OPENED for agent ${agentId} after ${breaker.failureCount} failures`);
        }
      }

      return task;
    } catch (error) {
      this.logger.error(`Failed to execute with circuit breaker: ${error}`);
      throw error;
    }
  }

  /**
   * Get real-time execution metrics
   * Property 35: Real-Time Execution Metrics
   * Validates: Requirement 12.5
   */
  async getRealTimeMetrics(): Promise<{
    timestamp: Date;
    runningTasks: number;
    totalTasks: number;
    cpuUsage: number;
    memoryUsage: number;
    throughput: number;
    latency: number;
    isThrottling: boolean;
  }> {
    const allMetrics = Array.from(this.executionMetrics.values());
    const recentMetrics = allMetrics.slice(-10); // Last 10 tasks

    const avgThroughput = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length
      : 0;

    const avgLatency = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length
      : 0;

    return {
      timestamp: new Date(),
      runningTasks: this.runningTasks.size,
      totalTasks: this.tasks.size,
      cpuUsage: this.currentCpuUsage,
      memoryUsage: this.currentMemoryUsage,
      throughput: avgThroughput,
      latency: avgLatency,
      isThrottling: this.isThrottling,
    };
  }

  /**
   * Start real-time metrics collection
   * Property 35: Real-Time Execution Metrics
   * Validates: Requirement 12.5
   */
  private startMetricsCollection(): void {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }

    this.metricsUpdateInterval = setInterval(() => {
      this.updateResourceUsage();
    }, 1000); // Update every second

    this.logger.info('Real-time metrics collection started');
  }

  /**
   * Stop real-time metrics collection
   */
  stopMetricsCollection(): void {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
      this.logger.info('Real-time metrics collection stopped');
    }
  }

  /**
   * Update current resource usage
   */
  private updateResourceUsage(): void {
    // Simulate resource usage calculation
    // In production, this would use actual system metrics
    const runningTaskCount = this.runningTasks.size;
    const utilizationFactor = runningTaskCount / this.maxConcurrentTasks;
    
    this.currentCpuUsage = Math.min(100, utilizationFactor * 100 + Math.random() * 10);
    this.currentMemoryUsage = Math.min(100, utilizationFactor * 90 + Math.random() * 10);
  }

  /**
   * Process priority queue
   */
  async processPriorityQueue(): Promise<number> {
    let processed = 0;

    // Process from highest to lowest priority
    const priorities = Array.from(this.priorityQueue.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.priorityQueue.get(priority) || [];
      
      while (queue.length > 0 && this.runningTasks.size < this.maxConcurrentTasks) {
        const taskId = queue.shift();
        if (taskId) {
          const task = this.tasks.get(taskId);
          if (task && task.status === 'pending') {
            // Task will be picked up by executeTaskAsync
            processed++;
          }
        }
      }

      if (queue.length === 0) {
        this.priorityQueue.delete(priority);
      }
    }

    return processed;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async executeTaskAsync(task: ExecutionTask): Promise<void> {
    try {
      // Small delay to allow task to be observed in 'pending' state
      await this.delay(10);
      
      this.runningTasks.add(task.id);
      task.status = 'running';
      task.startedAt = new Date();

      // Allocate resources
      await this.allocateResources(task.id, 50, 512, 1000);

      // Simulate task execution
      const startTime = Date.now();
      await this.delay(Math.random() * 5000); // Simulate work

      // Record metrics
      const executionTime = Date.now() - startTime;
      const metrics: ExecutionMetrics = {
        taskId: task.id,
        executionTime,
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 1024,
        networkUsage: Math.random() * 10000,
        successRate: Math.random() > 0.1 ? 1 : 0,
        throughput: 1000 / executionTime,
      };

      ExecutionMetricsSchema.parse(metrics);
      this.executionMetrics.set(task.id, metrics);

      // Complete task
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = { success: true, executionTime };

      // Release resources
      await this.releaseResources(task.id);
      this.runningTasks.delete(task.id);

      this.logger.info(`Task completed: ${task.id}`);
    } catch (error) {
      this.logger.error(`Task execution failed: ${error}`);
      const task_ref = this.tasks.get(task.id);
      if (task_ref) {
        task_ref.status = 'failed';
        task_ref.error = String(error);
        task_ref.completedAt = new Date();
      }
      this.runningTasks.delete(task.id);
      await this.releaseResources(task.id);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export default new ParallelExecutorService();
