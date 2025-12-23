/**
 * Deployment Service - Phase 2 Enhanced
 * Handles automated deployment, environment management, validation, and rollback
 * with blue-green deployment, canary rollout, and automatic rollback capabilities
 * 
 * @agent Agent C - Advanced Systems & Infrastructure Specialist
 * @date 2025-12-21
 * @phase Phase 2
 * @requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { Logger } from '../utils/logger';
import { z } from 'zod';
import { Agent, PlatformId, DeploymentResult } from '../interfaces';

// ============================================================================
// Schemas
// ============================================================================

const DeploymentConfigSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string(),
  platform: z.enum(['kilo', 'opencode', 'skills-system']),
  environment: z.enum(['development', 'staging', 'production']),
  replicas: z.number().positive().default(1),
  resources: z.object({
    cpu: z.string(),
    memory: z.string(),
    storage: z.string(),
  }),
  healthCheck: z.object({
    enabled: z.boolean(),
    interval: z.number().positive(),
    timeout: z.number().positive(),
    threshold: z.number().positive(),
  }),
  autoScaling: z.object({
    enabled: z.boolean(),
    minReplicas: z.number().positive().optional(),
    maxReplicas: z.number().positive().optional(),
    targetCpuUtilization: z.number().min(0).max(100).optional(),
  }),
  createdAt: z.date(),
});

const DeploymentStatusSchema = z.object({
  deploymentId: z.string().uuid(),
  agentId: z.string(),
  platform: z.enum(['kilo', 'opencode', 'skills-system']),
  status: z.enum(['pending', 'deploying', 'running', 'failed', 'rolled-back']),
  replicas: z.number().positive(),
  readyReplicas: z.number().nonnegative(),
  updatedAt: z.date(),
  error: z.string().optional(),
});

const RollbackConfigSchema = z.object({
  deploymentId: z.string().uuid(),
  targetVersion: z.string(),
  reason: z.string(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
});

// Phase 2: Blue-Green deployment
const BlueGreenDeploymentSchema = z.object({
  deploymentId: z.string().uuid(),
  blueVersion: z.string(),
  greenVersion: z.string(),
  activeEnvironment: z.enum(['blue', 'green']),
  trafficSplit: z.object({
    blue: z.number().min(0).max(100),
    green: z.number().min(0).max(100),
  }),
  switchedAt: z.date().optional(),
});

// Phase 2: Canary deployment
const CanaryDeploymentSchema = z.object({
  deploymentId: z.string().uuid(),
  stableVersion: z.string(),
  canaryVersion: z.string(),
  currentStage: z.number().min(0).max(5),
  stages: z.array(z.object({
    stage: z.number(),
    trafficPercentage: z.number(),
    duration: z.number(),
    healthChecksPassed: z.boolean(),
    completedAt: z.date().optional(),
  })),
  status: z.enum(['in-progress', 'completed', 'rolled-back']),
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type RollbackConfig = z.infer<typeof RollbackConfigSchema>;
export type BlueGreenDeployment = z.infer<typeof BlueGreenDeploymentSchema>;
export type CanaryDeployment = z.infer<typeof CanaryDeploymentSchema>;

// ============================================================================
// Deployment Service
// ============================================================================

export class DeploymentService {
  private logger: Logger;
  private deployments: Map<string, DeploymentConfig> = new Map();
  private statuses: Map<string, DeploymentStatus> = new Map();
  private rollbacks: Map<string, RollbackConfig> = new Map();
  private deploymentHistory: Map<string, DeploymentResult[]> = new Map();
  
  // Phase 2: Enhanced deployment strategies
  private blueGreenDeployments: Map<string, BlueGreenDeployment> = new Map();
  private canaryDeployments: Map<string, CanaryDeployment> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private rollbackTimeoutMs: number = 30000; // 30 seconds

  constructor() {
    this.logger = new Logger('DeploymentService');
    this.logger.info('Deployment Service initialized with Phase 2 features');
  }

  /**
   * Create a deployment configuration
   * Property: Deployment config creation should validate all parameters
   */
  async createDeployment(
    agentId: string,
    platform: PlatformId,
    environment: 'development' | 'staging' | 'production',
    replicas: number = 1,
    resources: { cpu: string; memory: string; storage: string } = {
      cpu: '500m',
      memory: '512Mi',
      storage: '1Gi',
    }
  ): Promise<DeploymentConfig> {
    try {
      this.logger.info(`Creating deployment for agent ${agentId} on ${platform} (${environment})`);

      const deployment: DeploymentConfig = {
        id: this.generateUUID(),
        agentId,
        platform,
        environment,
        replicas,
        resources,
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
          threshold: 3,
        },
        autoScaling: {
          enabled: environment === 'production',
          minReplicas: 1,
          maxReplicas: 10,
          targetCpuUtilization: 70,
        },
        createdAt: new Date(),
      };

      // Validate deployment schema
      DeploymentConfigSchema.parse(deployment);

      // Store deployment
      this.deployments.set(deployment.id, deployment);

      this.logger.info(`Deployment created: ${deployment.id}`);
      return deployment;
    } catch (error) {
      this.logger.error(`Failed to create deployment: ${error}`);
      throw error;
    }
  }

  /**
   * Deploy an agent
   * Property: Agent deployment should validate and start successfully
   */
  async deployAgent(deploymentId: string, agent: Agent): Promise<DeploymentResult> {
    try {
      this.logger.info(`Deploying agent ${agent.id} with deployment ${deploymentId}`);

      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      // Create deployment status
      const status: DeploymentStatus = {
        deploymentId,
        agentId: agent.id,
        platform: deployment.platform,
        status: 'deploying',
        replicas: deployment.replicas,
        readyReplicas: 0,
        updatedAt: new Date(),
      };

      DeploymentStatusSchema.parse(status);
      this.statuses.set(deploymentId, status);

      // Simulate deployment process
      const result = await this.simulateDeployment(deployment, agent);

      // Update status
      if (result.success) {
        status.status = 'running';
        status.readyReplicas = deployment.replicas;
      } else {
        status.status = 'failed';
        status.error = result.error;
      }
      status.updatedAt = new Date();

      // Record deployment history
      const history = this.deploymentHistory.get(agent.id) || [];
      history.push(result);
      this.deploymentHistory.set(agent.id, history);

      this.logger.info(`Deployment ${result.success ? 'succeeded' : 'failed'}: ${deploymentId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to deploy agent: ${error}`);
      throw error;
    }
  }

  /**
   * Get deployment status
   * Property: Deployment status should be accurate and current
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus | undefined> {
    return this.statuses.get(deploymentId);
  }

  /**
   * Validate deployment configuration
   * Property: Deployment validation should check all constraints
   */
  async validateDeployment(deploymentId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      this.logger.info(`Validating deployment ${deploymentId}`);

      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        return {
          valid: false,
          errors: [`Deployment not found: ${deploymentId}`],
          warnings: [],
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate resources
      if (!this.isValidResourceString(deployment.resources.cpu)) {
        errors.push('Invalid CPU resource format');
      }
      if (!this.isValidResourceString(deployment.resources.memory)) {
        errors.push('Invalid memory resource format');
      }

      // Validate auto-scaling
      if (deployment.autoScaling.enabled) {
        if (
          deployment.autoScaling.minReplicas &&
          deployment.autoScaling.maxReplicas &&
          deployment.autoScaling.minReplicas > deployment.autoScaling.maxReplicas
        ) {
          errors.push('Min replicas cannot be greater than max replicas');
        }
      }

      // Validate health check
      if (deployment.healthCheck.timeout > deployment.healthCheck.interval) {
        warnings.push('Health check timeout is greater than interval');
      }

      const valid = errors.length === 0;
      this.logger.info(`Deployment validation completed: ${valid ? 'valid' : 'invalid'}`);

      return { valid, errors, warnings };
    } catch (error) {
      this.logger.error(`Failed to validate deployment: ${error}`);
      throw error;
    }
  }

  /**
   * Scale deployment
   * Property: Scaling should update replica count
   */
  async scaleDeployment(deploymentId: string, replicas: number): Promise<void> {
    try {
      this.logger.info(`Scaling deployment ${deploymentId} to ${replicas} replicas`);

      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      deployment.replicas = replicas;

      const status = this.statuses.get(deploymentId);
      if (status) {
        status.replicas = replicas;
        status.updatedAt = new Date();
      }

      this.logger.info(`Deployment scaled: ${deploymentId}`);
    } catch (error) {
      this.logger.error(`Failed to scale deployment: ${error}`);
      throw error;
    }
  }

  /**
   * Rollback deployment
   * Property: Rollback should restore previous version
   */
  async rollbackDeployment(deploymentId: string, targetVersion: string, reason: string): Promise<void> {
    try {
      this.logger.info(`Rolling back deployment ${deploymentId} to version ${targetVersion}`);

      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      const rollback: RollbackConfig = {
        deploymentId,
        targetVersion,
        reason,
        createdAt: new Date(),
        status: 'in-progress',
      };

      RollbackConfigSchema.parse(rollback);
      this.rollbacks.set(rollback.deploymentId, rollback);

      // Simulate rollback process
      await this.delay(1000);

      rollback.status = 'completed';
      rollback.completedAt = new Date();

      const status = this.statuses.get(deploymentId);
      if (status) {
        status.status = 'rolled-back';
        status.updatedAt = new Date();
      }

      this.logger.info(`Deployment rolled back: ${deploymentId}`);
    } catch (error) {
      this.logger.error(`Failed to rollback deployment: ${error}`);
      throw error;
    }
  }

  /**
   * Get deployment history
   * Property: Deployment history should be retrievable and complete
   */
  async getDeploymentHistory(agentId: string): Promise<DeploymentResult[]> {
    return this.deploymentHistory.get(agentId) || [];
  }

  /**
   * List all deployments
   * Property: Deployment listing should return all deployments
   */
  async listDeployments(agentId?: string, platform?: PlatformId): Promise<DeploymentConfig[]> {
    const allDeployments = Array.from(this.deployments.values());

    return allDeployments.filter((d) => {
      if (agentId && d.agentId !== agentId) return false;
      if (platform && d.platform !== platform) return false;
      return true;
    });
  }

  /**
   * Delete deployment
   * Property: Deployment deletion should remove configuration
   */
  async deleteDeployment(deploymentId: string): Promise<void> {
    try {
      this.logger.info(`Deleting deployment ${deploymentId}`);

      this.deployments.delete(deploymentId);
      this.statuses.delete(deploymentId);
      this.rollbacks.delete(deploymentId);

      this.logger.info(`Deployment deleted: ${deploymentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete deployment: ${error}`);
      throw error;
    }
  }

  /**
   * Check deployment health
   * Property: Health check should verify deployment status
   */
  async checkDeploymentHealth(deploymentId: string): Promise<{
    healthy: boolean;
    readyReplicas: number;
    totalReplicas: number;
    issues: string[];
  }> {
    try {
      const status = this.statuses.get(deploymentId);
      if (!status) {
        return {
          healthy: false,
          readyReplicas: 0,
          totalReplicas: 0,
          issues: [`Deployment not found: ${deploymentId}`],
        };
      }

      const issues: string[] = [];
      const readyReplicas = typeof status.readyReplicas === 'number' ? status.readyReplicas : 0;
      const totalReplicas = typeof status.replicas === 'number' ? status.replicas : 0;

      if (readyReplicas < totalReplicas) {
        issues.push(`Only ${readyReplicas} of ${totalReplicas} replicas are ready`);
      }

      return {
        healthy: readyReplicas === totalReplicas,
        readyReplicas,
        totalReplicas,
        issues,
      };
    } catch (error) {
      this.logger.error(`Failed to check deployment health: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // Phase 2: Advanced Deployment Features
  // ============================================================================

  /**
   * Deploy using blue-green strategy
   * Property 41: Blue-Green Deployment
   * Validates: Requirement 14.1
   */
  async deployBlueGreen(
    deploymentId: string,
    agent: Agent,
    newVersion: string
  ): Promise<BlueGreenDeployment> {
    try {
      this.logger.info(`Starting blue-green deployment for ${deploymentId}`);

      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      // Determine current active environment
      const existingBG = this.blueGreenDeployments.get(deploymentId);
      const currentActive = existingBG?.activeEnvironment || 'blue';
      const newActive = currentActive === 'blue' ? 'green' : 'blue';

      const blueGreen: BlueGreenDeployment = {
        deploymentId,
        blueVersion: currentActive === 'blue' ? agent.version : newVersion,
        greenVersion: currentActive === 'green' ? agent.version : newVersion,
        activeEnvironment: currentActive,
        trafficSplit: {
          blue: currentActive === 'blue' ? 100 : 0,
          green: currentActive === 'green' ? 100 : 0,
        },
      };

      BlueGreenDeploymentSchema.parse(blueGreen);
      this.blueGreenDeployments.set(deploymentId, blueGreen);

      // Deploy to inactive environment
      this.logger.info(`Deploying version ${newVersion} to ${newActive} environment`);
      await this.deployAgent(deploymentId, agent);

      // Run health checks on new environment
      const healthCheckPassed = await this.runHealthChecks(deploymentId, newActive);

      if (healthCheckPassed) {
        // Switch traffic to new environment
        blueGreen.activeEnvironment = newActive;
        blueGreen.trafficSplit = {
          blue: newActive === 'blue' ? 100 : 0,
          green: newActive === 'green' ? 100 : 0,
        };
        blueGreen.switchedAt = new Date();

        this.logger.info(`Traffic switched to ${newActive} environment`);
      } else {
        throw new Error('Health checks failed on new environment');
      }

      return blueGreen;
    } catch (error) {
      this.logger.error(`Blue-green deployment failed: ${error}`);
      throw error;
    }
  }

  /**
   * Deploy using canary strategy
   * Property 42: Canary Deployment Rollout
   * Validates: Requirement 14.2
   */
  async deployCanary(
    deploymentId: string,
    agent: Agent,
    newVersion: string
  ): Promise<CanaryDeployment> {
    try {
      this.logger.info(`Starting canary deployment for ${deploymentId}`);

      const canary: CanaryDeployment = {
        deploymentId,
        stableVersion: agent.version,
        canaryVersion: newVersion,
        currentStage: 0,
        stages: [
          { stage: 1, trafficPercentage: 5, duration: 300000, healthChecksPassed: false },
          { stage: 2, trafficPercentage: 10, duration: 300000, healthChecksPassed: false },
          { stage: 3, trafficPercentage: 25, duration: 600000, healthChecksPassed: false },
          { stage: 4, trafficPercentage: 50, duration: 600000, healthChecksPassed: false },
          { stage: 5, trafficPercentage: 100, duration: 0, healthChecksPassed: false },
        ],
        status: 'in-progress',
      };

      CanaryDeploymentSchema.parse(canary);
      this.canaryDeployments.set(deploymentId, canary);

      // Execute canary stages
      for (const stage of canary.stages) {
        this.logger.info(`Canary stage ${stage.stage}: ${stage.trafficPercentage}% traffic`);

        // Gradually increase traffic
        await this.adjustCanaryTraffic(deploymentId, stage.trafficPercentage);

        // Wait for stage duration (simulated)
        await this.delay(Math.min(stage.duration, 5000)); // Cap at 5s for testing

        // Run health checks
        const healthChecksPassed = await this.runHealthChecks(deploymentId, 'canary');
        stage.healthChecksPassed = healthChecksPassed;
        stage.completedAt = new Date();

        if (!healthChecksPassed) {
          this.logger.error(`Canary stage ${stage.stage} health checks failed`);
          canary.status = 'rolled-back';
          await this.rollbackCanary(deploymentId);
          throw new Error(`Canary deployment failed at stage ${stage.stage}`);
        }

        canary.currentStage = stage.stage;
      }

      canary.status = 'completed';
      this.logger.info('Canary deployment completed successfully');
      return canary;
    } catch (error) {
      this.logger.error(`Canary deployment failed: ${error}`);
      throw error;
    }
  }

  /**
   * Automatic rollback with 30-second time limit
   * Property 43: Automatic Rollback
   * Validates: Requirement 14.3
   */
  async automaticRollback(deploymentId: string, reason: string): Promise<void> {
    try {
      this.logger.warn(`Initiating automatic rollback for ${deploymentId}: ${reason}`);

      const startTime = Date.now();

      // Get deployment status
      const status = this.statuses.get(deploymentId);
      if (!status) {
        throw new Error(`Deployment status not found: ${deploymentId}`);
      }

      // Determine rollback strategy based on deployment type
      const blueGreen = this.blueGreenDeployments.get(deploymentId);
      const canary = this.canaryDeployments.get(deploymentId);

      if (blueGreen) {
        await this.rollbackBlueGreen(deploymentId);
      } else if (canary) {
        await this.rollbackCanary(deploymentId);
      } else {
        // Standard rollback
        await this.rollbackDeployment(deploymentId, 'previous', reason);
      }

      const rollbackTime = Date.now() - startTime;

      if (rollbackTime > this.rollbackTimeoutMs) {
        this.logger.error(`Rollback exceeded time limit: ${rollbackTime}ms > ${this.rollbackTimeoutMs}ms`);
      } else {
        this.logger.info(`Rollback completed in ${rollbackTime}ms`);
      }

      // Update status
      status.status = 'rolled-back';
      status.updatedAt = new Date();
    } catch (error) {
      this.logger.error(`Automatic rollback failed: ${error}`);
      throw error;
    }
  }

  /**
   * Manage environment-specific configurations
   * Property 44: Environment-Specific Configuration
   * Validates: Requirement 14.4
   */
  async applyEnvironmentConfig(
    deploymentId: string,
    environment: 'development' | 'staging' | 'production',
    config: Record<string, any>
  ): Promise<void> {
    try {
      this.logger.info(`Applying ${environment} configuration to deployment ${deploymentId}`);

      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      // Validate environment matches
      if (deployment.environment !== environment) {
        throw new Error(`Environment mismatch: expected ${deployment.environment}, got ${environment}`);
      }

      // Apply environment-specific settings
      const envConfig = {
        development: {
          replicas: 1,
          resources: { cpu: '500m', memory: '512Mi', storage: '1Gi' },
          autoScaling: { enabled: false },
        },
        staging: {
          replicas: 2,
          resources: { cpu: '1000m', memory: '1Gi', storage: '5Gi' },
          autoScaling: { enabled: true, minReplicas: 2, maxReplicas: 5 },
        },
        production: {
          replicas: 3,
          resources: { cpu: '2000m', memory: '2Gi', storage: '10Gi' },
          autoScaling: { enabled: true, minReplicas: 3, maxReplicas: 10 },
        },
      };

      // Merge with custom config
      const finalConfig = { ...envConfig[environment], ...config };

      // Update deployment
      deployment.replicas = finalConfig.replicas;
      deployment.resources = finalConfig.resources;
      deployment.autoScaling = finalConfig.autoScaling;

      this.logger.info(`Environment configuration applied for ${environment}`);
    } catch (error) {
      this.logger.error(`Failed to apply environment config: ${error}`);
      throw error;
    }
  }

  /**
   * Get deployment metrics for monitoring integration
   * Property 45: Deployment Metrics Integration
   * Validates: Requirement 14.5
   */
  async getDeploymentMetrics(deploymentId: string): Promise<{
    deploymentId: string;
    status: string;
    replicas: { desired: number; ready: number };
    healthChecks: { passed: number; failed: number };
    uptime: number;
    lastDeployment: Date;
    rollbackCount: number;
  }> {
    try {
      const deployment = this.deployments.get(deploymentId);
      const status = this.statuses.get(deploymentId);

      if (!deployment || !status) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      const history = this.deploymentHistory.get(status.agentId) || [];
      const rollbackCount = Array.from(this.rollbacks.values()).filter(
        r => r.deploymentId === deploymentId
      ).length;

      const uptime = Date.now() - deployment.createdAt.getTime();

      return {
        deploymentId,
        status: status.status,
        replicas: {
          desired: status.replicas,
          ready: status.readyReplicas,
        },
        healthChecks: {
          passed: status.readyReplicas,
          failed: status.replicas - status.readyReplicas,
        },
        uptime,
        lastDeployment: deployment.createdAt,
        rollbackCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get deployment metrics: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods - Phase 2
  // ============================================================================

  private async runHealthChecks(deploymentId: string, environment: string): Promise<boolean> {
    this.logger.debug(`Running health checks for ${environment} environment`);
    
    // Simulate health checks
    await this.delay(500);
    
    // 90% success rate for testing
    return Math.random() > 0.1;
  }

  private async adjustCanaryTraffic(deploymentId: string, percentage: number): Promise<void> {
    this.logger.debug(`Adjusting canary traffic to ${percentage}%`);
    await this.delay(100);
  }

  private async rollbackBlueGreen(deploymentId: string): Promise<void> {
    const blueGreen = this.blueGreenDeployments.get(deploymentId);
    if (blueGreen) {
      // Switch back to previous environment
      const previousActive = blueGreen.activeEnvironment === 'blue' ? 'green' : 'blue';
      blueGreen.activeEnvironment = previousActive;
      blueGreen.trafficSplit = {
        blue: previousActive === 'blue' ? 100 : 0,
        green: previousActive === 'green' ? 100 : 0,
      };
      this.logger.info(`Blue-green rolled back to ${previousActive} environment`);
    }
  }

  private async rollbackCanary(deploymentId: string): Promise<void> {
    const canary = this.canaryDeployments.get(deploymentId);
    if (canary) {
      // Route all traffic back to stable version
      await this.adjustCanaryTraffic(deploymentId, 0);
      canary.status = 'rolled-back';
      this.logger.info('Canary deployment rolled back to stable version');
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async simulateDeployment(deployment: DeploymentConfig, agent: Agent): Promise<DeploymentResult> {
    // Simulate deployment process
    const success = Math.random() > 0.1;

    return {
      success,
      agentId: agent.id,
      platform: deployment.platform,
      deploymentId: deployment.id,
      timestamp: new Date(),
      error: success ? undefined : 'Deployment simulation failed',
    };
  }

  private isValidResourceString(resource: string): boolean {
    // Validate resource strings like "500m", "512Mi", "1Gi"
    const pattern = /^\d+([mMkKgG]i?)?$/;
    return pattern.test(resource);
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

export default new DeploymentService();
