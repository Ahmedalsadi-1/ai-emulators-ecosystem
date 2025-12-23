/**
 * Configuration Manager Service
 * Manages unified configuration for all platforms
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import { getLogger } from '../utils/logger';
import { SystemConfiguration, ValidationError } from '../interfaces';
import { SystemConfigurationSchema } from '../config/schemas';

const logger = getLogger();

export class ConfigurationService {
  private logger = getLogger();
  private config: SystemConfiguration | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();
  }

  /**
   * Load configuration from file
   */
  async loadConfiguration(): Promise<SystemConfiguration> {
    try {
      this.logger.info({ path: this.configPath }, 'Loading configuration');

      const data = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);

      // Validate configuration
      const validated = SystemConfigurationSchema.parse(parsed);

      this.config = validated;

      this.logger.info({ path: this.configPath }, 'Configuration loaded successfully');
      return validated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { path: this.configPath, error: errorMessage },
        'Failed to load configuration'
      );

      throw new ValidationError(`Failed to load configuration: ${errorMessage}`);
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config: SystemConfiguration): Promise<void> {
    try {
      this.logger.info({ path: this.configPath }, 'Saving configuration');

      // Validate configuration
      const validated = SystemConfigurationSchema.parse(config);

      // Create directory if it doesn't exist
      const dir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
      mkdirSync(dir, { recursive: true });

      // Write configuration
      writeFileSync(this.configPath, JSON.stringify(validated, null, 2), {
        mode: 0o600,
      });

      this.config = validated;

      this.logger.info({ path: this.configPath }, 'Configuration saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { path: this.configPath, error: errorMessage },
        'Failed to save configuration'
      );

      throw new ValidationError(`Failed to save configuration: ${errorMessage}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): SystemConfiguration {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfiguration() first.');
    }
    return this.config;
  }

  /**
   * Update configuration value
   */
  async updateConfiguration(updates: Partial<SystemConfiguration>): Promise<void> {
    try {
      const current = this.getConfiguration();
      const updated = { ...current, ...updates };

      await this.saveConfiguration(updated);

      this.logger.info('Configuration updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: errorMessage }, 'Failed to update configuration');

      throw new ValidationError(`Failed to update configuration: ${errorMessage}`);
    }
  }

  /**
   * Validate configuration
   */
  async validateConfiguration(config: SystemConfiguration): Promise<boolean> {
    try {
      SystemConfigurationSchema.parse(config);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: errorMessage }, 'Configuration validation failed');
      return false;
    }
  }

  /**
   * Get platform configuration
   */
  getPlatformConfiguration(platform: 'kilo' | 'opencode' | 'skills-system') {
    const config = this.getConfiguration();
    return config.platforms.find((p) => p.id === platform);
  }

  /**
   * Check platform is enabled
   */
  isPlatformEnabled(platform: 'kilo' | 'opencode' | 'skills-system'): boolean {
    const platformConfig = this.getPlatformConfiguration(platform);
    return platformConfig?.enabled || false;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfiguration() {
    return this.getConfiguration().logging;
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfiguration() {
    return this.getConfiguration().monitoring;
  }

  /**
   * Get default configuration path
   */
  private getDefaultConfigPath(): string {
    const home = homedir();
    return resolve(home, '.agent-manager', 'config.json');
  }

  /**
   * Create default configuration
   */
  static createDefaultConfiguration(): SystemConfiguration {
    return {
      basePath: resolve(homedir(), '.agent-manager'),
      agentsPath: 'agents',
      skillsPath: 'skills',
      cacheEnabled: true,
      validationEnabled: true,
      platforms: [
        {
          id: 'kilo',
          enabled: true,
          cli: {
            path: '/usr/local/bin/kilocode',
            version: '^1.0.0',
            autoUpdate: true,
          },
          authentication: {
            method: 'api-key',
            keyPath: resolve(homedir(), '.kilocode', 'auth.json'),
          },
          features: {
            'cloud-sync': true,
            'parallel-mode': true,
            'mcp-integration': true,
          },
        },
        {
          id: 'opencode',
          enabled: true,
          cli: {
            path: '/usr/local/bin/opencode',
            version: '^2.0.0',
            autoUpdate: true,
          },
          authentication: {
            method: 'provider-keys',
            keyPath: resolve(homedir(), '.local', 'share', 'opencode', 'auth.json'),
          },
          features: {
            'provider-management': true,
            'session-management': true,
            'mcp-integration': true,
          },
        },
        {
          id: 'skills-system',
          enabled: true,
          cli: {
            path: resolve(homedir(), '.agent-manager', 'bin', 'agent-skills'),
            version: '^1.0.0',
            autoUpdate: false,
          },
          authentication: {
            method: 'api-key',
            keyPath: resolve(homedir(), '.agent-skills', 'auth.json'),
          },
          features: {
            'skill-execution': true,
            'dependency-resolution': true,
          },
        },
      ],
      logging: {
        level: 'info',
        outputs: [
          {
            type: 'console',
          },
          {
            type: 'file',
            path: resolve(homedir(), '.agent-manager', 'logs', 'agent-manager.log'),
          },
        ],
        correlation: {
          enabled: true,
          sessionTracking: true,
          crossPlatformCorrelation: true,
        },
      },
      monitoring: {
        prometheus: {
          enabled: true,
          port: 9090,
          metrics: [
            'agent_operations_total',
            'platform_response_time',
            'session_duration',
            'sync_errors_total',
          ],
        },
        grafana: {
          enabled: true,
          dashboards: [
            'unified-agent-overview',
            'platform-comparison',
            'performance-metrics',
          ],
        },
      },
    };
  }
}

export default new ConfigurationService();
