/**
 * CLI Installer Service
 * Handles installation, verification, and management of Kilo CLI and OpenCode
 */

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { getLogger } from '../utils/logger';
import { PlatformId, PlatformError } from '../interfaces';

const logger = getLogger();

export interface CLIInstallationConfig {
  platform: PlatformId;
  path: string;
  version: string;
  autoUpdate: boolean;
}

export interface CLIInstallationResult {
  success: boolean;
  platform: PlatformId;
  version?: string;
  path?: string;
  error?: string;
  timestamp: Date;
}

export interface CLIVerificationResult {
  installed: boolean;
  platform: PlatformId;
  version?: string;
  path?: string;
  compatible: boolean;
  error?: string;
}

export class CLIInstallerService {
  private logger = getLogger();

  /**
   * Detect if a CLI tool is installed
   */
  async detectCLI(platform: PlatformId): Promise<CLIVerificationResult> {
    try {
      const command = platform === 'kilo' ? 'kilocode' : 'opencode';
      const version = this.getVersion(command);

      if (!version) {
        return {
          installed: false,
          platform,
          compatible: false,
          error: `${command} not found in PATH`,
        };
      }

      const path = this.getPath(command);
      const compatible = this.checkCompatibility(platform, version);

      return {
        installed: true,
        platform,
        version,
        path,
        compatible,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { platform, error: errorMessage },
        'Failed to detect CLI'
      );

      return {
        installed: false,
        platform,
        compatible: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Install a CLI tool
   */
  async installCLI(config: CLIInstallationConfig): Promise<CLIInstallationResult> {
    try {
      this.logger.info(
        { platform: config.platform, version: config.version },
        'Starting CLI installation'
      );

      // Check if already installed
      const existing = await this.detectCLI(config.platform);
      if (existing.installed && existing.compatible) {
        this.logger.info(
          { platform: config.platform, version: existing.version },
          'CLI already installed and compatible'
        );

        return {
          success: true,
          platform: config.platform,
          version: existing.version,
          path: existing.path,
          timestamp: new Date(),
        };
      }

      // Install via npm
      const command = config.platform === 'kilo' ? '@kilocode/cli' : 'opencode';
      const installCommand = `npm install -g ${command}@${config.version}`;

      this.logger.debug(
        { command: installCommand },
        'Executing installation command'
      );

      execSync(installCommand, { stdio: 'inherit' });

      // Verify installation
      const verification = await this.detectCLI(config.platform);

      if (!verification.installed) {
        throw new Error('Installation completed but CLI not found');
      }

      this.logger.info(
        { platform: config.platform, version: verification.version },
        'CLI installation successful'
      );

      return {
        success: true,
        platform: config.platform,
        version: verification.version,
        path: verification.path,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { platform: config.platform, error: errorMessage },
        'CLI installation failed'
      );

      return {
        success: false,
        platform: config.platform,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify CLI installation and compatibility
   */
  async verifyCLI(platform: PlatformId, expectedVersion?: string): Promise<CLIVerificationResult> {
    try {
      const detection = await this.detectCLI(platform);

      if (!detection.installed) {
        return detection;
      }

      // Check version compatibility if expected version provided
      if (expectedVersion && detection.version) {
        const compatible = this.isVersionCompatible(detection.version, expectedVersion);
        if (!compatible) {
          return {
            ...detection,
            compatible: false,
            error: `Version ${detection.version} not compatible with ${expectedVersion}`,
          };
        }
      }

      return detection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { platform, error: errorMessage },
        'CLI verification failed'
      );

      return {
        installed: false,
        platform,
        compatible: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update CLI tool to latest version
   */
  async updateCLI(platform: PlatformId): Promise<CLIInstallationResult> {
    try {
      this.logger.info({ platform }, 'Starting CLI update');

      const command = platform === 'kilo' ? '@kilocode/cli' : 'opencode';
      const updateCommand = `npm install -g ${command}@latest`;

      execSync(updateCommand, { stdio: 'inherit' });

      const verification = await this.detectCLI(platform);

      if (!verification.installed) {
        throw new Error('Update completed but CLI not found');
      }

      this.logger.info(
        { platform, version: verification.version },
        'CLI update successful'
      );

      return {
        success: true,
        platform,
        version: verification.version,
        path: verification.path,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { platform, error: errorMessage },
        'CLI update failed'
      );

      return {
        success: false,
        platform,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get CLI version
   */
  private getVersion(command: string): string | null {
    try {
      const output = execSync(`${command} --version`, { encoding: 'utf-8' }).trim();
      // Extract version number (e.g., "1.2.3" from "kilocode version 1.2.3")
      const match = output.match(/(\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get CLI path
   */
  private getPath(command: string): string | undefined {
    try {
      const output = execSync(`which ${command}`, { encoding: 'utf-8' }).trim();
      return output || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if CLI version is compatible
   */
  private checkCompatibility(platform: PlatformId, version: string): boolean {
    try {
      // Parse version
      const parts = version.split('.');
      if (parts.length < 2) {
        return false;
      }

      const major = parseInt(parts[0], 10);
      const minor = parseInt(parts[1], 10);

      // Define minimum compatible versions
      const minVersions: Record<PlatformId, { major: number; minor: number }> = {
        kilo: { major: 1, minor: 0 },
        opencode: { major: 2, minor: 0 },
        'skills-system': { major: 1, minor: 0 },
      };

      const minVersion = minVersions[platform];
      if (!minVersion) {
        return false;
      }

      // Check compatibility
      if (major > minVersion.major) {
        return true;
      }
      if (major === minVersion.major && minor >= minVersion.minor) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if version is compatible with expected version range
   */
  private isVersionCompatible(version: string, expectedRange: string): boolean {
    try {
      // Simple semver compatibility check
      // For now, just check major version matches
      const versionParts = version.split('.');
      const expectedParts = expectedRange.replace(/[\^~]/, '').split('.');

      if (!versionParts[0] || !expectedParts[0]) {
        return false;
      }

      const versionMajor = parseInt(versionParts[0], 10);
      const expectedMajor = parseInt(expectedParts[0], 10);

      return versionMajor === expectedMajor;
    } catch {
      return false;
    }
  }

  /**
   * Execute CLI command
   */
  async executeCommand(
    platform: PlatformId,
    command: string,
    args: string[] = []
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const cliCommand = platform === 'kilo' ? 'kilocode' : 'opencode';
      const child = spawn(cliCommand, [command, ...args]);

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });

      child.on('error', (error) => {
        reject(new PlatformError(platform, `Failed to execute command: ${error.message}`));
      });
    });
  }
}

export default new CLIInstallerService();
