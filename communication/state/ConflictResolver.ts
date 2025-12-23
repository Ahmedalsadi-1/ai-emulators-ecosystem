/**
 * Conflict Resolver
 * Handles state conflicts using various resolution strategies
 */

import { StateConflict, StateSyncMessage } from '../core/types';
import { Logger } from '../utils/Logger';

export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  MANUAL_RESOLUTION = 'manual_resolution',
  MERGE_DEEP = 'merge_deep',
  MERGE_SHALLOW = 'merge_shallow',
  SOURCE_PRIORITY = 'source_priority'
}

export interface ConflictResolutionOptions {
  strategy: ConflictResolutionStrategy;
  prioritySources?: string[];
  customResolver?: (conflict: StateConflict) => Promise<any>;
  autoResolve: boolean;
}

export class ConflictResolver {
  private logger: Logger;
  private pendingConflicts: Map<string, StateConflict[]> = new Map();
  private resolutionCallbacks: Map<string, (resolution: any) => void> = new Map();

  constructor() {
    this.logger = new Logger('ConflictResolver');
  }

  /**
   * Resolve conflicts for a state key
   */
  async resolveConflicts(
    stateKey: string,
    conflicts: StateConflict[],
    options: ConflictResolutionOptions
  ): Promise<StateSyncMessage | null> {
    if (conflicts.length === 0) return null;

    this.logger.info(`Resolving ${conflicts.length} conflicts for ${stateKey}`);

    if (options.autoResolve) {
      return this.autoResolveConflicts(stateKey, conflicts, options);
    } else {
      // Store for manual resolution
      this.pendingConflicts.set(stateKey, conflicts);
      this.logger.info(`Stored ${conflicts.length} conflicts for manual resolution: ${stateKey}`);
      return null;
    }
  }

  /**
   * Automatically resolve conflicts
   */
  private autoResolveConflicts(
    stateKey: string,
    conflicts: StateConflict[],
    options: ConflictResolutionOptions
  ): StateSyncMessage {
    let resolvedValue: any;

    switch (options.strategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        resolvedValue = this.resolveLastWriteWins(conflicts);
        break;

      case ConflictResolutionStrategy.SOURCE_PRIORITY:
        resolvedValue = this.resolveBySourcePriority(conflicts, options.prioritySources || []);
        break;

      case ConflictResolutionStrategy.MERGE_DEEP:
        resolvedValue = this.resolveByDeepMerge(conflicts);
        break;

      case ConflictResolutionStrategy.MERGE_SHALLOW:
        resolvedValue = this.resolveByShallowMerge(conflicts);
        break;

      case ConflictResolutionStrategy.MANUAL_RESOLUTION:
        // This shouldn't happen if autoResolve is true, but fallback
        resolvedValue = conflicts[0].remoteValue;
        break;

      default:
        resolvedValue = conflicts[0].remoteValue;
    }

    // Mark conflicts as resolved
    for (const conflict of conflicts) {
      conflict.resolved = true;
      conflict.resolution = resolvedValue;
    }

    return {
      stateKey,
      state: resolvedValue,
      version: Math.max(...conflicts.map(c => c.remoteVersion)),
      lastModified: Date.now(),
      source: 'conflict_resolver',
      conflicts
    };
  }

  /**
   * Resolve using last write wins strategy
   */
  private resolveLastWriteWins(conflicts: StateConflict[]): any {
    // Sort by version (highest first)
    const sorted = conflicts.sort((a, b) => b.remoteVersion - a.remoteVersion);
    return sorted[0].remoteValue;
  }

  /**
   * Resolve by source priority
   */
  private resolveBySourcePriority(conflicts: StateConflict[], prioritySources: string[]): any {
    // This would need source information in conflicts
    // For now, fallback to last write wins
    return this.resolveLastWriteWins(conflicts);
  }

  /**
   * Resolve by deep merging all values
   */
  private resolveByDeepMerge(conflicts: StateConflict[]): any {
    let merged = conflicts[0].localValue;

    for (let i = 1; i < conflicts.length; i++) {
      merged = this.deepMerge(merged, conflicts[i].remoteValue);
    }

    return merged;
  }

  /**
   * Resolve by shallow merging all values
   */
  private resolveByShallowMerge(conflicts: StateConflict[]): any {
    let merged = { ...conflicts[0].localValue };

    for (let i = 1; i < conflicts.length; i++) {
      merged = { ...merged, ...conflicts[i].remoteValue };
    }

    return merged;
  }

  /**
   * Manually resolve conflicts
   */
  async resolveManually(stateKey: string, resolution: any): Promise<StateSyncMessage | null> {
    const conflicts = this.pendingConflicts.get(stateKey);
    if (!conflicts) {
      this.logger.warn(`No pending conflicts found for ${stateKey}`);
      return null;
    }

    // Apply resolution to all conflicts
    for (const conflict of conflicts) {
      conflict.resolved = true;
      conflict.resolution = resolution;
    }

    // Create resolved state message
    const resolvedMessage: StateSyncMessage = {
      stateKey,
      state: resolution,
      version: Math.max(...conflicts.map(c => c.remoteVersion)) + 1,
      lastModified: Date.now(),
      source: 'manual_resolution',
      conflicts
    };

    // Clean up
    this.pendingConflicts.delete(stateKey);

    this.logger.info(`Manually resolved conflicts for ${stateKey}`);
    return resolvedMessage;
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(stateKey?: string): Map<string, StateConflict[]> {
    if (stateKey) {
      const conflicts = this.pendingConflicts.get(stateKey);
      return conflicts ? new Map([[stateKey, conflicts]]) : new Map();
    }
    return new Map(this.pendingConflicts);
  }

  /**
   * Check if there are pending conflicts
   */
  hasPendingConflicts(stateKey: string): boolean {
    return this.pendingConflicts.has(stateKey);
  }

  /**
   * Clear all pending conflicts
   */
  clearPendingConflicts(): void {
    const count = this.pendingConflicts.size;
    this.pendingConflicts.clear();
    this.logger.info(`Cleared ${count} pending conflict sets`);
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    if (this.isPlainObject(target) && this.isPlainObject(source)) {
      const result = { ...target };
      for (const key in source) {
        if (this.isPlainObject(source[key]) && key in result && this.isPlainObject(result[key])) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }
    return source;
  }

  /**
   * Check if value is plain object
   */
  private isPlainObject(value: any): boolean {
    return value !== null && typeof value === 'object' && value.constructor === Object;
  }

  /**
   * Get conflict statistics
   */
  getStats(): any {
    const totalPending = Array.from(this.pendingConflicts.values()).reduce((sum, conflicts) => sum + conflicts.length, 0);

    return {
      pendingConflictSets: this.pendingConflicts.size,
      totalPendingConflicts: totalPending,
      resolvedConflicts: 0 // Could track this if needed
    };
  }
}