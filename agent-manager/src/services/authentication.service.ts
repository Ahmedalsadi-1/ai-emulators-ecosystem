/**
 * Authentication Service
 * Manages authentication for both Kilo CLI and OpenCode platforms
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { homedir } from 'os';
import { getLogger } from '../utils/logger';
import { PlatformId, Credentials, AuthResult, ValidationError } from '../interfaces';

const logger = getLogger();

export interface AuthenticationConfig {
  platform: PlatformId;
  method: 'api-key' | 'oauth' | 'provider-keys';
  configPath?: string;
  keyPath?: string;
}

export class AuthenticationService {
  private logger = getLogger();
  private authCache: Map<string, { credentials: Credentials; expiresAt: Date }> = new Map();

  /**
   * Authenticate with a platform
   */
  async authenticate(
    platform: PlatformId,
    credentials: Credentials,
    config: AuthenticationConfig
  ): Promise<AuthResult> {
    try {
      this.logger.info({ platform }, 'Starting authentication');

      // Validate credentials
      this.validateCredentials(credentials);

      // Store credentials securely
      await this.storeCredentials(platform, credentials, config);

      // Verify authentication
      const verified = await this.verifyAuthentication(platform, credentials);

      if (!verified) {
        throw new Error('Authentication verification failed');
      }

      // Cache authentication
      this.authCache.set(platform, {
        credentials,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      this.logger.info({ platform }, 'Authentication successful');

      return {
        success: true,
        providerId: platform,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ platform, error: errorMessage }, 'Authentication failed');

      return {
        success: false,
        providerId: platform,
        error: errorMessage,
      };
    }
  }

  /**
   * Get stored credentials for a platform
   */
  async getCredentials(
    platform: PlatformId,
    config: AuthenticationConfig
  ): Promise<Credentials | null> {
    try {
      // Check cache first
      const cached = this.authCache.get(platform);
      if (cached && cached.expiresAt > new Date()) {
        return cached.credentials;
      }

      // Load from storage
      const credentials = await this.loadCredentials(platform, config);
      return credentials;
    } catch (error) {
      this.logger.error(
        { platform, error: error instanceof Error ? error.message : String(error) },
        'Failed to get credentials'
      );
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthentication(
    platform: PlatformId,
    config: AuthenticationConfig
  ): Promise<AuthResult> {
    try {
      this.logger.info({ platform }, 'Refreshing authentication');

      const credentials = await this.getCredentials(platform, config);
      if (!credentials) {
        throw new Error('No credentials found');
      }

      // Verify authentication is still valid
      const verified = await this.verifyAuthentication(platform, credentials);

      if (!verified) {
        throw new Error('Authentication verification failed');
      }

      // Update cache expiration
      this.authCache.set(platform, {
        credentials,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      this.logger.info({ platform }, 'Authentication refreshed');

      return {
        success: true,
        providerId: platform,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ platform, error: errorMessage }, 'Authentication refresh failed');

      return {
        success: false,
        providerId: platform,
        error: errorMessage,
      };
    }
  }

  /**
   * Revoke authentication
   */
  async revokeAuthentication(
    platform: PlatformId,
    config: AuthenticationConfig
  ): Promise<boolean> {
    try {
      this.logger.info({ platform }, 'Revoking authentication');

      // Remove from cache
      this.authCache.delete(platform);

      // Remove from storage
      await this.deleteCredentials(platform, config);

      this.logger.info({ platform }, 'Authentication revoked');
      return true;
    } catch (error) {
      this.logger.error(
        { platform, error: error instanceof Error ? error.message : String(error) },
        'Failed to revoke authentication'
      );
      return false;
    }
  }

  /**
   * Validate credentials
   */
  private validateCredentials(credentials: Credentials): void {
    if (!credentials) {
      throw new ValidationError('Credentials are required');
    }

    // At least one credential type must be provided
    const hasCredential =
      credentials.apiKey ||
      credentials.username ||
      credentials.password ||
      credentials.token ||
      credentials.customAuth;

    if (!hasCredential) {
      throw new ValidationError('At least one credential type must be provided');
    }

    // Validate API key format if provided
    if (credentials.apiKey && credentials.apiKey.length < 10) {
      throw new ValidationError('API key is too short');
    }

    // Validate username/password if provided
    if ((credentials.username || credentials.password) && !credentials.username) {
      throw new ValidationError('Username is required when password is provided');
    }
  }

  /**
   * Store credentials securely
   */
  private async storeCredentials(
    platform: PlatformId,
    credentials: Credentials,
    config: AuthenticationConfig
  ): Promise<void> {
    try {
      const configPath = config.keyPath || this.getDefaultKeyPath(platform);

      // Create directory if it doesn't exist
      const dir = dirname(configPath);
      mkdirSync(dir, { recursive: true });

      // Store credentials (in production, these should be encrypted)
      const data = {
        platform,
        credentials,
        storedAt: new Date().toISOString(),
      };

      writeFileSync(configPath, JSON.stringify(data, null, 2), {
        mode: 0o600, // Read/write for owner only
      });

      this.logger.debug({ platform, path: configPath }, 'Credentials stored');
    } catch (error) {
      throw new Error(`Failed to store credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load credentials from storage
   */
  private async loadCredentials(
    platform: PlatformId,
    config: AuthenticationConfig
  ): Promise<Credentials | null> {
    try {
      const configPath = config.keyPath || this.getDefaultKeyPath(platform);

      const data = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(data);

      return parsed.credentials || null;
    } catch (error) {
      this.logger.debug(
        { platform, error: error instanceof Error ? error.message : String(error) },
        'Failed to load credentials'
      );
      return null;
    }
  }

  /**
   * Delete stored credentials
   */
  private async deleteCredentials(
    platform: PlatformId,
    config: AuthenticationConfig
  ): Promise<void> {
    try {
      const configPath = config.keyPath || this.getDefaultKeyPath(platform);

      // In production, securely delete the file
      // For now, just remove it
      const fs = await import('fs').then((m) => m.promises);
      await fs.unlink(configPath).catch(() => {
        // File might not exist
      });

      this.logger.debug({ platform, path: configPath }, 'Credentials deleted');
    } catch (error) {
      this.logger.error(
        { platform, error: error instanceof Error ? error.message : String(error) },
        'Failed to delete credentials'
      );
    }
  }

  /**
   * Verify authentication is valid
   */
  private async verifyAuthentication(
    platform: PlatformId,
    credentials: Credentials
  ): Promise<boolean> {
    try {
      // In production, this would make an actual API call to verify
      // For now, just check that credentials are present
      if (!credentials) {
        return false;
      }

      // Simulate verification
      const hasValidCredential: boolean =
        !!(credentials.apiKey && credentials.apiKey.length > 10) ||
        !!(credentials.username && credentials.password) ||
        !!(credentials.token && credentials.token.length > 0);

      return hasValidCredential;
    } catch {
      return false;
    }
  }

  /**
   * Get default key path for platform
   */
  private getDefaultKeyPath(platform: PlatformId): string {
    const home = homedir();

    switch (platform) {
      case 'kilo':
        return resolve(home, '.kilocode', 'auth.json');
      case 'opencode':
        return resolve(home, '.local', 'share', 'opencode', 'auth.json');
      case 'skills-system':
        return resolve(home, '.agent-skills', 'auth.json');
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
}

export default new AuthenticationService();
