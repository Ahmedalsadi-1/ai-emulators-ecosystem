/**
 * Context Preserver
 * Handles context preservation and restoration across navigation events
 */

import { NavigationEntry, UnifiedMessage, MessageType, MessageChannel } from '../core/types';
import { CommunicationHub } from '../core/CommunicationHub';
import { StateSyncManager } from '../state/StateSyncManager';
import { Logger } from '../utils/Logger';

export interface ContextSnapshot {
  id: string;
  panelId: string;
  route: string;
  params?: any;
  formData?: any;
  scrollPosition?: { x: number; y: number };
  selection?: any;
  customData?: Record<string, any>;
  timestamp: number;
  expiresAt?: number;
}

export interface ContextPreservationOptions {
  includeFormData?: boolean;
  includeScrollPosition?: boolean;
  includeSelection?: boolean;
  customDataKeys?: string[];
  ttl?: number; // time to live in milliseconds
}

export class ContextPreserver {
  private logger: Logger;
  private hub: CommunicationHub;
  private stateSync: StateSyncManager;
  private contextStorage: Map<string, ContextSnapshot> = new Map();

  constructor(hub: CommunicationHub, stateSync: StateSyncManager) {
    this.hub = hub;
    this.stateSync = stateSync;
    this.logger = new Logger('ContextPreserver');
  }

  /**
   * Preserve context for a panel
   */
  async preserveContext(
    panelId: string,
    options: ContextPreservationOptions = {}
  ): Promise<string> {
    try {
      // Request context data from panel
      const response = await this.hub.sendMessageWithResponse({
        id: this.generateMessageId(),
        type: MessageType.NAVIGATION_CHANGE,
        source: 'context_preserver',
        target: panelId,
        channel: MessageChannel.POSTMESSAGE,
        payload: {
          action: 'capture_context',
          options
        },
        timestamp: Date.now()
      }, 5000);

      const contextData = response.payload.contextData;
      const snapshotId = this.generateSnapshotId();

      const snapshot: ContextSnapshot = {
        id: snapshotId,
        panelId,
        route: contextData.route || '',
        params: contextData.params,
        formData: options.includeFormData ? contextData.formData : undefined,
        scrollPosition: options.includeScrollPosition ? contextData.scrollPosition : undefined,
        selection: options.includeSelection ? contextData.selection : undefined,
        customData: this.extractCustomData(contextData, options.customDataKeys),
        timestamp: Date.now(),
        expiresAt: options.ttl ? Date.now() + options.ttl : undefined
      };

      // Store locally
      this.contextStorage.set(snapshotId, snapshot);

      // Store in state sync for persistence
      await this.stateSync.setPanelState(
        'context',
        `snapshot_${snapshotId}`,
        snapshot,
        'system'
      );

      this.logger.info(`Preserved context for panel: ${panelId}`, { snapshotId, route: snapshot.route });
      return snapshotId;

    } catch (error) {
      this.logger.error(`Failed to preserve context for panel: ${panelId}`, error);
      throw error;
    }
  }

  /**
   * Restore context for a panel
   */
  async restoreContext(panelId: string, snapshotId: string): Promise<void> {
    try {
      let snapshot = this.contextStorage.get(snapshotId);

      // Try to load from state sync if not in memory
      if (!snapshot) {
        snapshot = await this.stateSync.getPanelState('context', `snapshot_${snapshotId}`);
      }

      if (!snapshot) {
        throw new Error(`Context snapshot not found: ${snapshotId}`);
      }

      // Check if expired
      if (snapshot.expiresAt && Date.now() > snapshot.expiresAt) {
        await this.deleteSnapshot(snapshotId);
        throw new Error(`Context snapshot expired: ${snapshotId}`);
      }

      // Send context data to panel
      await this.hub.sendMessage({
        id: this.generateMessageId(),
        type: MessageType.NAVIGATION_CHANGE,
        source: 'context_preserver',
        target: panelId,
        channel: MessageChannel.POSTMESSAGE,
        payload: {
          action: 'restore_context',
          contextData: {
            route: snapshot.route,
            params: snapshot.params,
            formData: snapshot.formData,
            scrollPosition: snapshot.scrollPosition,
            selection: snapshot.selection,
            customData: snapshot.customData
          }
        },
        timestamp: Date.now()
      });

      this.logger.info(`Restored context for panel: ${panelId}`, { snapshotId, route: snapshot.route });

    } catch (error) {
      this.logger.error(`Failed to restore context for panel: ${panelId}`, error);
      throw error;
    }
  }

  /**
   * Create context snapshot from navigation entry
   */
  async createSnapshotFromEntry(entry: NavigationEntry, options: ContextPreservationOptions = {}): Promise<string> {
    const snapshotId = this.generateSnapshotId();

    const snapshot: ContextSnapshot = {
      id: snapshotId,
      panelId: entry.panelId,
      route: entry.route,
      params: entry.params,
      timestamp: entry.timestamp,
      expiresAt: options.ttl ? Date.now() + options.ttl : undefined
    };

    // Store snapshot
    this.contextStorage.set(snapshotId, snapshot);
    await this.stateSync.setPanelState(
      'context',
      `snapshot_${snapshotId}`,
      snapshot,
      'system'
    );

    this.logger.debug(`Created snapshot from navigation entry: ${snapshotId}`);
    return snapshotId;
  }

  /**
   * Get context snapshot
   */
  getSnapshot(snapshotId: string): ContextSnapshot | null {
    return this.contextStorage.get(snapshotId) || null;
  }

  /**
   * List snapshots for a panel
   */
  getPanelSnapshots(panelId: string): ContextSnapshot[] {
    return Array.from(this.contextStorage.values())
      .filter(snapshot => snapshot.panelId === panelId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete context snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    this.contextStorage.delete(snapshotId);

    try {
      await this.stateSync.deletePanelState('context', `snapshot_${snapshotId}`);
    } catch (error) {
      this.logger.warn(`Failed to delete snapshot from state sync: ${snapshotId}`, error);
    }

    this.logger.debug(`Deleted context snapshot: ${snapshotId}`);
  }

  /**
   * Clean up expired snapshots
   */
  async cleanupExpiredSnapshots(): Promise<void> {
    const now = Date.now();
    let cleaned = 0;

    for (const [snapshotId, snapshot] of this.contextStorage.entries()) {
      if (snapshot.expiresAt && now > snapshot.expiresAt) {
        await this.deleteSnapshot(snapshotId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Cleaned up ${cleaned} expired context snapshots`);
    }
  }

  /**
   * Merge context snapshots
   */
  mergeSnapshots(baseSnapshotId: string, overlaySnapshotId: string): ContextSnapshot | null {
    const base = this.getSnapshot(baseSnapshotId);
    const overlay = this.getSnapshot(overlaySnapshotId);

    if (!base || !overlay) {
      return null;
    }

    const merged: ContextSnapshot = {
      ...base,
      id: this.generateSnapshotId(),
      timestamp: Date.now(),
      customData: {
        ...base.customData,
        ...overlay.customData
      }
    };

    // Deep merge form data if present
    if (base.formData && overlay.formData) {
      merged.formData = this.deepMerge(base.formData, overlay.formData);
    } else if (overlay.formData) {
      merged.formData = overlay.formData;
    }

    // Store merged snapshot
    this.contextStorage.set(merged.id, merged);

    this.logger.debug(`Merged snapshots: ${baseSnapshotId} + ${overlaySnapshotId} = ${merged.id}`);
    return merged;
  }

  /**
   * Export context snapshot
   */
  exportSnapshot(snapshotId: string): string | null {
    const snapshot = this.getSnapshot(snapshotId);
    if (!snapshot) return null;

    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Import context snapshot
   */
  importSnapshot(snapshotData: string): string | null {
    try {
      const snapshot: ContextSnapshot = JSON.parse(snapshotData);

      // Validate snapshot structure
      if (!snapshot.id || !snapshot.panelId) {
        throw new Error('Invalid snapshot structure');
      }

      // Generate new ID to avoid conflicts
      const newId = this.generateSnapshotId();
      snapshot.id = newId;

      this.contextStorage.set(newId, snapshot);
      this.logger.info(`Imported context snapshot: ${newId}`);

      return newId;
    } catch (error) {
      this.logger.error('Failed to import snapshot:', error);
      return null;
    }
  }

  /**
   * Extract custom data based on keys
   */
  private extractCustomData(contextData: any, customDataKeys?: string[]): Record<string, any> | undefined {
    if (!customDataKeys || !contextData.customData) {
      return contextData.customData;
    }

    const extracted: Record<string, any> = {};
    for (const key of customDataKeys) {
      if (contextData.customData[key] !== undefined) {
        extracted[key] = contextData.customData[key];
      }
    }

    return extracted;
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
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get context preservation statistics
   */
  getStats(): any {
    const snapshots = Array.from(this.contextStorage.values());
    const now = Date.now();

    return {
      totalSnapshots: snapshots.length,
      snapshotsByPanel: snapshots.reduce((acc, snap) => {
        acc[snap.panelId] = (acc[snap.panelId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      expiredSnapshots: snapshots.filter(s => s.expiresAt && now > s.expiresAt).length,
      averageSnapshotSize: snapshots.length > 0 ?
        snapshots.reduce((sum, snap) => sum + this.getSnapshotSize(snap), 0) / snapshots.length : 0
    };
  }

  /**
   * Get approximate snapshot size in bytes
   */
  private getSnapshotSize(snapshot: ContextSnapshot): number {
    return new Blob([JSON.stringify(snapshot)]).size;
  }
}