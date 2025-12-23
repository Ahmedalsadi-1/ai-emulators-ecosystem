/**
 * State Store
 * Provides persistence layer for state synchronization
 */

import { Logger } from '../utils/Logger';

interface StoredState {
  key: string;
  value: any;
  version: number;
  lastModified: number;
  source: string;
  checksum: string;
  ttl?: number;
}

export class StateStore {
  private logger: Logger;
  private storage: Map<string, StoredState> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private persistenceEnabled: boolean = true) {
    this.logger = new Logger('StateStore');

    if (this.persistenceEnabled) {
      this.loadFromStorage();
      this.startCleanupInterval();
    }
  }

  /**
   * Store state entry
   */
  async store(key: string, value: any, version: number, source: string, ttl?: number): Promise<void> {
    const entry: StoredState = {
      key,
      value,
      version,
      lastModified: Date.now(),
      source,
      checksum: this.generateChecksum(value),
      ttl
    };

    this.storage.set(key, entry);

    if (this.persistenceEnabled) {
      await this.persistToStorage();
    }

    this.logger.debug(`Stored state: ${key}`, { version, source });
  }

  /**
   * Retrieve state entry
   */
  retrieve(key: string): StoredState | null {
    const entry = this.storage.get(key);
    if (!entry) return null;

    // Check TTL
    if (entry.ttl && Date.now() - entry.lastModified > entry.ttl) {
      this.storage.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Delete state entry
   */
  async delete(key: string): Promise<void> {
    this.storage.delete(key);

    if (this.persistenceEnabled) {
      await this.persistToStorage();
    }

    this.logger.debug(`Deleted state: ${key}`);
  }

  /**
   * Check if key exists
   */
  exists(key: string): boolean {
    const entry = this.retrieve(key);
    return entry !== null;
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Get keys by pattern
   */
  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return this.getAllKeys().filter(key => regex.test(key));
  }

  /**
   * Clear all state
   */
  async clear(): Promise<void> {
    this.storage.clear();

    if (this.persistenceEnabled) {
      await this.persistToStorage();
    }

    this.logger.info('Cleared all stored state');
  }

  /**
   * Get storage stats
   */
  getStats(): any {
    const entries = Array.from(this.storage.values());
    const totalSize = entries.reduce((size, entry) => size + this.getEntrySize(entry), 0);
    const expiredCount = entries.filter(entry =>
      entry.ttl && Date.now() - entry.lastModified > entry.ttl
    ).length;

    return {
      totalEntries: this.storage.size,
      totalSize,
      expiredEntries: expiredCount,
      averageEntrySize: this.storage.size > 0 ? totalSize / this.storage.size : 0
    };
  }

  /**
   * Load state from persistent storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('communication_state_store');
        if (stored) {
          const data = JSON.parse(stored);
          for (const [key, entry] of Object.entries(data)) {
            this.storage.set(key, entry as StoredState);
          }
          this.logger.info(`Loaded ${Object.keys(data).length} entries from storage`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load state from storage:', error);
    }
  }

  /**
   * Persist state to storage
   */
  private async persistToStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = Object.fromEntries(this.storage);
        localStorage.setItem('communication_state_store', JSON.stringify(data));
      }
    } catch (error) {
      this.logger.error('Failed to persist state to storage:', error);
    }
  }

  /**
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Clean up every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.storage.entries()) {
      if (entry.ttl && now - entry.lastModified > entry.ttl) {
        this.storage.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired entries`);
      if (this.persistenceEnabled) {
        this.persistToStorage().catch(error => {
          this.logger.error('Failed to persist after cleanup:', error);
        });
      }
    }
  }

  /**
   * Generate checksum for value
   */
  private generateChecksum(value: any): string {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get approximate size of entry in bytes
   */
  private getEntrySize(entry: StoredState): number {
    return new Blob([JSON.stringify(entry)]).size;
  }

  /**
   * Destroy the store
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.clear().catch(error => {
      this.logger.error('Error during store destruction:', error);
    });
  }
}