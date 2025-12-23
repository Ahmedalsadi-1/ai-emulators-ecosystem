/**
 * Navigation Manager
 * Coordinates navigation events between embedded UIs and maintains consistent navigation state
 */

import {
  NavigationContext,
  NavigationEntry,
  Breadcrumb,
  NavigationChange,
  UnifiedMessage,
  MessageType,
  MessageChannel
} from '../core/types';
import { CommunicationHub } from '../core/CommunicationHub';
import { StateSyncManager } from '../state/StateSyncManager';
import { Logger } from '../utils/Logger';

export interface NavigationTarget {
  panelId: string;
  route: string;
  params?: any;
  context?: any;
}

export interface NavigationOptions {
  preserveContext?: boolean;
  addToHistory?: boolean;
  updateBreadcrumbs?: boolean;
  silent?: boolean;
}

export class NavigationManager {
  private logger: Logger;
  private hub: CommunicationHub;
  private stateSync: StateSyncManager;
  private navigationContext: NavigationContext;
  private navigationHistory: NavigationEntry[] = [];
  private maxHistorySize = 50;

  constructor(hub: CommunicationHub, stateSync: StateSyncManager) {
    this.hub = hub;
    this.stateSync = stateSync;
    this.logger = new Logger('NavigationManager');

    // Initialize navigation context
    this.navigationContext = {
      currentPanel: '',
      panelHistory: [],
      breadcrumbs: [],
      crossPanelData: new Map()
    };

    this.setupMessageHandlers();
  }

  /**
   * Switch to a different panel
   */
  async switchToPanel(panelId: string, options: NavigationOptions = {}): Promise<void> {
    const { preserveContext = true, addToHistory = true, updateBreadcrumbs = true } = options;

    try {
      // Preserve current context if requested
      if (preserveContext && this.navigationContext.currentPanel) {
        await this.preserveCurrentContext();
      }

      // Create navigation change
      const change: NavigationChange = {
        type: 'switch',
        fromPanel: this.navigationContext.currentPanel,
        toPanel: panelId,
        preserveContext
      };

      // Add to history
      if (addToHistory) {
        this.addToHistory(change);
      }

      // Update navigation context
      this.navigationContext.currentPanel = panelId;
      await this.updateNavigationContext();

      // Update breadcrumbs
      if (updateBreadcrumbs) {
        await this.updateBreadcrumbs(change);
      }

      // Notify panels of navigation change
      await this.broadcastNavigationChange(change);

      // Restore context for target panel
      if (preserveContext) {
        await this.restorePanelContext(panelId);
      }

      this.logger.info(`Switched to panel: ${panelId}`, { preserveContext, addToHistory });

    } catch (error) {
      this.logger.error(`Failed to switch to panel: ${panelId}`, error);
      throw error;
    }
  }

  /**
   * Navigate within current panel
   */
  async navigateWithinPanel(
    route: string,
    params?: any,
    options: NavigationOptions = {}
  ): Promise<void> {
    const { addToHistory = true, updateBreadcrumbs = true } = options;

    if (!this.navigationContext.currentPanel) {
      throw new Error('No active panel to navigate within');
    }

    try {
      const change: NavigationChange = {
        type: 'navigate',
        toPanel: this.navigationContext.currentPanel,
        route,
        params,
        preserveContext: true
      };

      // Add to history
      if (addToHistory) {
        this.addToHistory(change);
      }

      // Update breadcrumbs
      if (updateBreadcrumbs) {
        await this.updateBreadcrumbs(change);
      }

      // Send navigation message to current panel
      await this.sendNavigationToPanel(this.navigationContext.currentPanel, change);

      // Broadcast navigation change
      await this.broadcastNavigationChange(change);

      this.logger.info(`Navigated within panel: ${route}`, { panelId: this.navigationContext.currentPanel, params });

    } catch (error) {
      this.logger.error(`Failed to navigate within panel: ${route}`, error);
      throw error;
    }
  }

  /**
   * Navigate to a specific target
   */
  async navigateToTarget(target: NavigationTarget, options: NavigationOptions = {}): Promise<void> {
    const { panelId, route, params, context } = target;

    // Switch panel if necessary
    if (panelId !== this.navigationContext.currentPanel) {
      await this.switchToPanel(panelId, { ...options, preserveContext: false });
    }

    // Apply context if provided
    if (context) {
      await this.applyNavigationContext(context);
    }

    // Navigate to route
    await this.navigateWithinPanel(route, params, options);
  }

  /**
   * Go back in navigation history
   */
  async goBack(): Promise<void> {
    const previousEntry = this.getPreviousEntry();
    if (!previousEntry) {
      throw new Error('No previous navigation entry available');
    }

    const change: NavigationChange = {
      type: 'back',
      toPanel: previousEntry.panelId,
      route: previousEntry.route,
      params: previousEntry.params,
      preserveContext: true
    };

    await this.navigateToEntry(previousEntry);
    await this.broadcastNavigationChange(change);

    this.logger.info('Navigated back', { toPanel: previousEntry.panelId, route: previousEntry.route });
  }

  /**
   * Go forward in navigation history (if supported)
   */
  async goForward(): Promise<void> {
    // For now, forward navigation is not implemented
    // Could be added with a more complex history stack
    throw new Error('Forward navigation not implemented');
  }

  /**
   * Get current navigation context
   */
  getNavigationContext(): NavigationContext {
    return { ...this.navigationContext };
  }

  /**
   * Set cross-panel data
   */
  setCrossPanelData(key: string, data: any): void {
    this.navigationContext.crossPanelData.set(key, data);
    this.logger.debug(`Set cross-panel data: ${key}`);
  }

  /**
   * Get cross-panel data
   */
  getCrossPanelData(key: string): any {
    return this.navigationContext.crossPanelData.get(key);
  }

  /**
   * Clear cross-panel data
   */
  clearCrossPanelData(key?: string): void {
    if (key) {
      this.navigationContext.crossPanelData.delete(key);
    } else {
      this.navigationContext.crossPanelData.clear();
    }
    this.logger.debug(`Cleared cross-panel data${key ? `: ${key}` : ''}`);
  }

  /**
   * Get navigation history
   */
  getNavigationHistory(limit?: number): NavigationEntry[] {
    const history = [...this.navigationHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.navigationContext.breadcrumbs];
  }

  /**
   * Add custom breadcrumb
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'id'>): string {
    const id = this.generateBreadcrumbId();
    const newBreadcrumb: Breadcrumb = {
      id,
      ...breadcrumb
    };

    this.navigationContext.breadcrumbs.push(newBreadcrumb);
    this.logger.debug(`Added breadcrumb: ${breadcrumb.label}`);

    return id;
  }

  /**
   * Remove breadcrumb
   */
  removeBreadcrumb(breadcrumbId: string): boolean {
    const index = this.navigationContext.breadcrumbs.findIndex(b => b.id === breadcrumbId);
    if (index > -1) {
      this.navigationContext.breadcrumbs.splice(index, 1);
      this.logger.debug(`Removed breadcrumb: ${breadcrumbId}`);
      return true;
    }
    return false;
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.navigationContext.breadcrumbs = [];
    this.logger.debug('Cleared breadcrumbs');
  }

  /**
   * Synchronize navigation state across panels
   */
  async syncNavigationState(panelId: string): Promise<void> {
    const context = this.getNavigationContext();

    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.NAVIGATION_SYNC,
      source: 'navigation_manager',
      target: panelId,
      channel: MessageChannel.POSTMESSAGE,
      payload: { context },
      timestamp: Date.now()
    });

    this.logger.debug(`Synced navigation state to panel: ${panelId}`);
  }

  /**
   * Handle navigation request from panel
   */
  private async handleNavigationRequest(message: UnifiedMessage): Promise<void> {
    const { target, route, params, options } = message.payload;

    try {
      if (target.panelId !== this.navigationContext.currentPanel) {
        // Cross-panel navigation
        await this.navigateToTarget(target, options);
      } else {
        // Within-panel navigation
        await this.navigateWithinPanel(route, params, options);
      }

      // Send success response
      await this.sendNavigationResponse(message, true);

    } catch (error) {
      this.logger.error('Navigation request failed:', error);
      await this.sendNavigationResponse(message, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Preserve current panel context
   */
  private async preserveCurrentContext(): Promise<void> {
    if (!this.navigationContext.currentPanel) return;

    const panelId = this.navigationContext.currentPanel;

    // Request context preservation from current panel
    try {
      const response = await this.hub.sendMessageWithResponse({
        id: this.generateMessageId(),
        type: MessageType.NAVIGATION_CHANGE,
        source: 'navigation_manager',
        target: panelId,
        channel: MessageChannel.POSTMESSAGE,
        payload: { action: 'preserve_context' },
        timestamp: Date.now()
      }, 5000);

      if (response.payload.context) {
        // Store context in state sync
        await this.stateSync.setPanelState(
          'navigation',
          `context_${panelId}`,
          response.payload.context,
          'system'
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to preserve context for panel: ${panelId}`, error);
    }
  }

  /**
   * Restore panel context
   */
  private async restorePanelContext(panelId: string): Promise<void> {
    try {
      const context = await this.stateSync.getPanelState('navigation', `context_${panelId}`);
      if (context) {
        await this.hub.sendMessage({
          id: this.generateMessageId(),
          type: MessageType.NAVIGATION_CHANGE,
          source: 'navigation_manager',
          target: panelId,
          channel: MessageChannel.POSTMESSAGE,
          payload: { action: 'restore_context', context },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to restore context for panel: ${panelId}`, error);
    }
  }

  /**
   * Apply navigation context
   */
  private async applyNavigationContext(context: any): Promise<void> {
    if (!this.navigationContext.currentPanel) return;

    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.NAVIGATION_CHANGE,
      source: 'navigation_manager',
      target: this.navigationContext.currentPanel,
      channel: MessageChannel.POSTMESSAGE,
      payload: { action: 'apply_context', context },
      timestamp: Date.now()
    });
  }

  /**
   * Add entry to navigation history
   */
  private addToHistory(change: NavigationChange): void {
    const entry: NavigationEntry = {
      panelId: change.toPanel,
      route: change.route || '',
      params: change.params,
      timestamp: Date.now(),
      context: change.preserveContext ? { ...this.navigationContext } : undefined
    };

    this.navigationHistory.push(entry);

    // Maintain max history size
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.shift();
    }
  }

  /**
   * Get previous navigation entry
   */
  private getPreviousEntry(): NavigationEntry | null {
    return this.navigationHistory.length > 1 ?
      this.navigationHistory[this.navigationHistory.length - 2] : null;
  }

  /**
   * Navigate to history entry
   */
  private async navigateToEntry(entry: NavigationEntry): Promise<void> {
    await this.navigateToTarget({
      panelId: entry.panelId,
      route: entry.route,
      params: entry.params,
      context: entry.context
    }, { addToHistory: false });
  }

  /**
   * Update navigation context in state sync
   */
  private async updateNavigationContext(): Promise<void> {
    await this.stateSync.setGlobalState(
      'navigation_context',
      this.navigationContext,
      'system'
    );
  }

  /**
   * Update breadcrumbs based on navigation change
   */
  private async updateBreadcrumbs(change: NavigationChange): Promise<void> {
    // Clear existing breadcrumbs for new panel
    if (change.type === 'switch') {
      this.clearBreadcrumbs();

      // Add panel breadcrumb
      this.addBreadcrumb({
        label: change.toPanel,
        panelId: change.toPanel,
        clickable: false
      });
    }

    // Add route breadcrumb if applicable
    if (change.route) {
      this.addBreadcrumb({
        label: change.route,
        panelId: change.toPanel,
        route: change.route,
        params: change.params,
        clickable: true
      });
    }
  }

  /**
   * Broadcast navigation change
   */
  private async broadcastNavigationChange(change: NavigationChange): Promise<void> {
    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.NAVIGATION_CHANGE,
      source: 'navigation_manager',
      target: 'broadcast',
      channel: MessageChannel.WEBSOCKET,
      payload: { change },
      timestamp: Date.now()
    });
  }

  /**
   * Send navigation message to panel
   */
  private async sendNavigationToPanel(panelId: string, change: NavigationChange): Promise<void> {
    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.NAVIGATION_CHANGE,
      source: 'navigation_manager',
      target: panelId,
      channel: MessageChannel.POSTMESSAGE,
      payload: { change },
      timestamp: Date.now()
    });
  }

  /**
   * Send navigation response
   */
  private async sendNavigationResponse(
    originalMessage: UnifiedMessage,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.NAVIGATION_SYNC,
      source: 'navigation_manager',
      target: originalMessage.source,
      channel: originalMessage.channel,
      payload: { success, error },
      timestamp: Date.now(),
      correlationId: originalMessage.correlationId
    });
  }

  /**
   * Set up message handlers
   */
  private setupMessageHandlers(): void {
    // Handle navigation requests
    this.hub.onMessage(MessageType.NAVIGATION_REQUEST, async (message) => {
      await this.handleNavigationRequest(message);
    });

    // Handle navigation broadcasts from panels
    this.hub.onMessage(MessageType.NAVIGATION_BROADCAST, async (message) => {
      const { change } = message.payload;
      await this.handleNavigationBroadcast(message.source, change);
    });
  }

  /**
   * Handle navigation broadcast from panel
   */
  private async handleNavigationBroadcast(sourcePanelId: string, change: NavigationChange): Promise<void> {
    // Update local navigation context if necessary
    if (change.toPanel !== this.navigationContext.currentPanel) {
      this.navigationContext.currentPanel = change.toPanel;
      await this.updateNavigationContext();
    }

    // Re-broadcast to other panels
    await this.hub.sendMessage({
      id: this.generateMessageId(),
      type: MessageType.NAVIGATION_CHANGE,
      source: 'navigation_manager',
      target: 'broadcast',
      channel: MessageChannel.WEBSOCKET,
      payload: { change, sourcePanelId },
      timestamp: Date.now()
    });
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate breadcrumb ID
   */
  private generateBreadcrumbId(): string {
    return `bc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get navigation statistics
   */
  getStats(): any {
    return {
      currentPanel: this.navigationContext.currentPanel,
      historySize: this.navigationHistory.length,
      breadcrumbCount: this.navigationContext.breadcrumbs.length,
      crossPanelDataKeys: Array.from(this.navigationContext.crossPanelData.keys())
    };
  }
}