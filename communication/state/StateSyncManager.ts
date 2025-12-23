/**
 * State Synchronization Manager
 * Manages state synchronization across embedded UIs using CRDT-based conflict resolution
 */

import {
  StateSyncMessage,
  StateConflict,
  StateSubscription,
  UnifiedMessage,
  MessageType,
  MessageChannel
} from '../core/types';
import { CommunicationHub } from '../core/CommunicationHub';
import { Logger } from '../utils/Logger';

interface StateEntry {
  value: any;
  version: number;
  lastModified: number;
  source: string;
  checksum: string;
}

interface SyncOperation {
  type: 'set' | 'merge' | 'delete';
  key: string;
  value?: any;
  version: number;
  source: string;
}

export class StateSyncManager {
  private globalState: Map<string, StateEntry> = new Map();
  private panelStates: Map<string, Map<string, StateEntry>> = new Map();
  private subscriptions: Map<string, StateSubscription[]> = new Map();
  private pendingOperations: Map<string, SyncOperation[]> = new Map();
  private logger: Logger;
  private hub: CommunicationHub;

  constructor(hub: CommunicationHub) {
    this.hub = hub;
    this.logger = new Logger('StateSyncManager');
    this.setupMessageHandlers();
  }

  /**
   * Set global state value
   */
  async setGlobalState(key: string, value: any, source: string = 'system'): Promise<void> {
    const operation: SyncOperation = {
      type: 'set',
      key,
      value,
      version: this.getNextVersion(key),
      source
    };

    await this.applyOperation(operation, true);
    await this.broadcastStateUpdate(key);
  }

  /**
   * Get global state value
   */
  getGlobalState(key: string): any {
    const entry = this.globalState.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   * Set panel-specific state value
   */
  async setPanelState(panelId: string, key: string, value: any, source: string = 'system'): Promise<void> {
    const operation: SyncOperation = {
      type: 'set',
      key,
      value,
      version: this.getNextVersion(key, panelId),
      source
    };

    await this.applyOperation(operation, false, panelId);
    await this.notifySubscribers(key, panelId);
  }

  /**
   * Get panel-specific state value
   */
  getPanelState(panelId: string, key: string): any {
    const panelState = this.panelStates.get(panelId);
    if (!panelState) return undefined;

    const entry = panelState.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   * Merge state (deep merge for objects)
   */
  async mergeGlobalState(key: string, updates: any, source: string = 'system'): Promise<void> {
    const currentValue = this.getGlobalState(key) || {};
    const mergedValue = this.deepMerge(currentValue, updates);

    await this.setGlobalState(key, mergedValue, source);
  }

  /**
   * Merge panel state
   */
  async mergePanelState(panelId: string, key: string, updates: any, source: string = 'system'): Promise<void> {
    const currentValue = this.getPanelState(panelId, key) || {};
    const mergedValue = this.deepMerge(currentValue, updates);

    await this.setPanelState(panelId, key, mergedValue, source);
  }

  /**
   * Delete state value
   */
  async deleteGlobalState(key: string, source: string = 'system'): Promise<void> {
    const operation: SyncOperation = {
      type: 'delete',
      key,
      version: this.getNextVersion(key),
      source
    };

    await this.applyOperation(operation, true);
    await this.broadcastStateUpdate(key);
  }

  /**
   * Delete panel state value
   */
  async deletePanelState(panelId: string, key: string, source: string = 'system'): Promise<void> {
    const operation: SyncOperation = {
      type: 'delete',
      key,
      version: this.getNextVersion(key, panelId),
      source
    };

    await this.applyOperation(operation, false, panelId);
    await this.notifySubscribers(key, panelId);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(panelId: string, stateKeys: string[], callback: (message: StateSyncMessage) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: StateSubscription = {
      panelId,
      stateKeys,
      callback
    };

    for (const key of stateKeys) {
      if (!this.subscriptions.has(key)) {
        this.subscriptions.set(key, []);
      }
      this.subscriptions.get(key)!.push(subscription);
    }

    this.logger.debug(`Created subscription: ${subscriptionId} for panel: ${panelId}`, { stateKeys });
    return subscriptionId;
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(subscriptionId: string): void {
    // Find and remove subscription
    for (const [key, subs] of this.subscriptions.entries()) {
      const filteredSubs = subs.filter(sub => sub.panelId !== subscriptionId);
      if (filteredSubs.length === 0) {
        this.subscriptions.delete(key);
      } else {
        this.subscriptions.set(key, filteredSubs);
      }
    }
  }

  /**
   * Sync state to specific panel
   */
  async syncToPanel(panelId: string, stateKey: string): Promise<void> {
    const state = this.getGlobalState(stateKey) || this.getPanelState(panelId, stateKey);
    if (state !== undefined) {
      const message: StateSyncMessage = {
        stateKey,
        state,
        version: this.getCurrentVersion(stateKey, panelId),
        lastModified: Date.now(),
        source: 'system'
      };

      await this.sendStateMessage(panelId, message);
    }
  }

  /**
   * Sync state from panel
   */
  async syncFromPanel(panelId: string, stateKey: string, state: any): Promise<void> {
    // Check for conflicts
    const conflicts = this.detectConflicts(panelId, stateKey, state);
    if (conflicts.length > 0) {
      await this.resolveConflicts(panelId, stateKey, state, conflicts);
    } else {
      await this.setPanelState(panelId, stateKey, state, panelId);
    }
  }

  /**
   * Request state sync from panel
   */
  async requestStateSync(panelId: string, stateKeys: string[]): Promise<Map<string, any>> {
    const result = new Map<string, any>();

    for (const key of stateKeys) {
      const state = this.getPanelState(panelId, key);
      if (state !== undefined) {
        result.set(key, state);
      }
    }

    return result;
  }

  /**
   * Broadcast state update to all subscribers
   */
  async broadcastStateUpdate(stateKey: string): Promise<void> {
    const state = this.getGlobalState(stateKey);
    if (state === undefined) return;

    const message: StateSyncMessage = {
      stateKey,
      state,
      version: this.getCurrentVersion(stateKey),
      lastModified: Date.now(),
      source: 'system'
    };

    // Send via WebSocket for real-time updates
    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.STATE_UPDATE,
      source: 'system',
      target: 'broadcast',
      channel: MessageChannel.WEBSOCKET,
      payload: message,
      timestamp: Date.now()
    });

    // Also send via postMessage to panels
    await this.notifySubscribers(stateKey);
  }

  /**
   * Get current version of state
   */
  private getCurrentVersion(key: string, panelId?: string): number {
    if (panelId) {
      const panelState = this.panelStates.get(panelId);
      const entry = panelState?.get(key);
      return entry?.version || 0;
    } else {
      const entry = this.globalState.get(key);
      return entry?.version || 0;
    }
  }

  /**
   * Get next version number
   */
  private getNextVersion(key: string, panelId?: string): number {
    return this.getCurrentVersion(key, panelId) + 1;
  }

  /**
   * Apply sync operation
   */
  private async applyOperation(operation: SyncOperation, isGlobal: boolean, panelId?: string): Promise<void> {
    const entry: StateEntry = {
      value: operation.value,
      version: operation.version,
      lastModified: Date.now(),
      source: operation.source,
      checksum: this.generateChecksum(operation.value)
    };

    if (isGlobal) {
      switch (operation.type) {
        case 'set':
        case 'merge':
          this.globalState.set(operation.key, entry);
          break;
        case 'delete':
          this.globalState.delete(operation.key);
          break;
      }
    } else if (panelId) {
      if (!this.panelStates.has(panelId)) {
        this.panelStates.set(panelId, new Map());
      }
      const panelState = this.panelStates.get(panelId)!;

      switch (operation.type) {
        case 'set':
        case 'merge':
          panelState.set(operation.key, entry);
          break;
        case 'delete':
          panelState.delete(operation.key);
          break;
      }
    }

    this.logger.debug(`Applied ${operation.type} operation`, {
      key: operation.key,
      panelId,
      version: operation.version,
      source: operation.source
    });
  }

  /**
   * Detect state conflicts
   */
  private detectConflicts(panelId: string, stateKey: string, newState: any): StateConflict[] {
    const currentEntry = this.panelStates.get(panelId)?.get(stateKey);
    if (!currentEntry) return [];

    const conflicts: StateConflict[] = [];

    // Simple conflict detection based on checksum
    const newChecksum = this.generateChecksum(newState);
    if (currentEntry.checksum !== newChecksum) {
      conflicts.push({
        key: stateKey,
        localValue: currentEntry.value,
        remoteValue: newState,
        localVersion: currentEntry.version,
        remoteVersion: currentEntry.version + 1,
        resolved: false
      });
    }

    return conflicts;
  }

  /**
   * Resolve state conflicts
   */
  private async resolveConflicts(panelId: string, stateKey: string, newState: any, conflicts: StateConflict[]): Promise<void> {
    // Simple resolution: last write wins
    for (const conflict of conflicts) {
      conflict.resolved = true;
      conflict.resolution = newState;
    }

    await this.setPanelState(panelId, stateKey, newState, panelId);
    this.logger.info(`Resolved ${conflicts.length} conflicts for ${stateKey} in panel ${panelId}`);
  }

  /**
   * Notify subscribers of state changes
   */
  private async notifySubscribers(stateKey: string, panelId?: string): Promise<void> {
    const subs = this.subscriptions.get(stateKey);
    if (!subs) return;

    const state = panelId ? this.getPanelState(panelId, stateKey) : this.getGlobalState(stateKey);
    if (state === undefined) return;

    const message: StateSyncMessage = {
      stateKey,
      state,
      version: this.getCurrentVersion(stateKey, panelId),
      lastModified: Date.now(),
      source: panelId || 'system'
    };

    for (const subscription of subs) {
      if (!panelId || subscription.panelId === panelId) {
        try {
          await subscription.callback(message);
        } catch (error) {
          this.logger.error(`Error in state subscription callback:`, error);
        }
      }
    }
  }

  /**
   * Send state message to panel
   */
  private async sendStateMessage(panelId: string, message: StateSyncMessage): Promise<void> {
    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.STATE_SYNC,
      source: 'system',
      target: panelId,
      channel: MessageChannel.POSTMESSAGE,
      payload: message,
      timestamp: Date.now()
    });
  }

  /**
   * Set up message handlers
   */
  private setupMessageHandlers(): void {
    // Handle state sync requests
    this.hub.onMessage(MessageType.STATE_REQUEST, async (message) => {
      const { stateKeys } = message.payload;
      const panelStates = await this.requestStateSync(message.source, stateKeys);

      await this.hub.sendMessage({
        id: this.generateMessageId(),
        type: MessageType.STATE_RESPONSE,
        source: 'system',
        target: message.source,
        channel: message.channel,
        payload: {
          requestedKeys: stateKeys,
          states: Object.fromEntries(panelStates)
        },
        timestamp: Date.now(),
        correlationId: message.correlationId
      });
    });

    // Handle state updates from panels
    this.hub.onMessage(MessageType.STATE_UPDATE, async (message) => {
      const { stateKey, state } = message.payload;
      await this.syncFromPanel(message.source, stateKey, state);
    });
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    if (this.isPlainObject(target) && this.isPlainObject(source)) {
      const result = { ...target };
      for (const key in source) {
        if (this.isPlainObject(source[key]) && key in result) {
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
   * Generate checksum for state
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
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all state keys
   */
  getAllStateKeys(panelId?: string): string[] {
    if (panelId) {
      const panelState = this.panelStates.get(panelId);
      return panelState ? Array.from(panelState.keys()) : [];
    } else {
      return Array.from(this.globalState.keys());
    }
  }

  /**
   * Clear all state
   */
  clear(panelId?: string): void {
    if (panelId) {
      this.panelStates.delete(panelId);
    } else {
      this.globalState.clear();
      this.panelStates.clear();
    }
    this.logger.info(`Cleared state${panelId ? ` for panel: ${panelId}` : ' globally'}`);
  }
}