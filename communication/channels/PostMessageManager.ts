/**
 * PostMessage Manager
 * Handles secure postMessage communication between main interface and embedded UIs
 */

import {
  UnifiedMessage,
  MessageEnvelope,
  PanelConfig,
  MessageValidationResult,
  CommunicationError,
  MessageChannel,
  MessagePriority,
  MessageType
} from '../core/types';
import { MessageValidator } from '../security/MessageValidator';
import { Logger } from '../utils/Logger';

export class PostMessageManager {
  private validator: MessageValidator;
  private logger: Logger;
  private panels: Map<string, PanelConfig> = new Map();
  private messageHandlers: Map<string, (message: UnifiedMessage) => Promise<void>> = new Map();
  private pendingMessages: Map<string, { message: UnifiedMessage; timeout: NodeJS.Timeout }> = new Map();
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();

  constructor(
    private config: any, // CommunicationConfig
    validator: MessageValidator
  ) {
    this.validator = validator;
    this.logger = new Logger('PostMessageManager');
    this.setupMessageListener();
  }

  /**
   * Register an embedded panel
   */
  registerPanel(config: PanelConfig): void {
    this.panels.set(config.id, config);
    this.logger.info(`Registered panel: ${config.id}`, { panelId: config.id, url: config.url });
  }

  /**
   * Unregister a panel
   */
  unregisterPanel(panelId: string): void {
    this.panels.delete(panelId);
    this.logger.info(`Unregistered panel: ${panelId}`);
  }

  /**
   * Send a message to a specific panel
   */
  async sendMessage(panelId: string, message: UnifiedMessage): Promise<void> {
    const panel = this.panels.get(panelId);
    if (!panel) {
      throw new CommunicationError(
        'PANEL_NOT_FOUND',
        `Panel not found: ${panelId}`,
        'main',
        panelId,
        Date.now()
      );
    }

    // Check rate limiting
    if (!this.checkRateLimit(panelId)) {
      throw new CommunicationError(
        'RATE_LIMIT_EXCEEDED',
        'Message rate limit exceeded',
        'main',
        panelId,
        Date.now()
      );
    }

    // Prepare message envelope
    const envelope: MessageEnvelope = {
      message: {
        ...message,
        channel: MessageChannel.POSTMESSAGE,
        timestamp: Date.now()
      },
      origin: this.getPanelOrigin(panel)
    };

    // Validate message
    const validation = await this.validator.validateMessageEnvelope(envelope);
    if (!validation.isValid) {
      throw new CommunicationError(
        'VALIDATION_FAILED',
        `Message validation failed: ${validation.errors.join(', ')}`,
        'main',
        panelId,
        Date.now()
      );
    }

    // Use sanitized message if available
    const messageToSend = validation.sanitizedMessage || envelope.message;

    // Send message
    await this.sendMessageToIframe(panelId, messageToSend);
    this.logger.debug(`Sent message to panel: ${panelId}`, { messageId: message.id, type: message.type });
  }

  /**
   * Broadcast message to all panels
   */
  async broadcastMessage(message: UnifiedMessage): Promise<void> {
    const promises = Array.from(this.panels.keys()).map(panelId =>
      this.sendMessage(panelId, { ...message, target: 'broadcast' })
        .catch(error => {
          this.logger.warn(`Failed to send broadcast to panel ${panelId}:`, error);
          return null; // Don't fail the entire broadcast
        })
    );

    await Promise.allSettled(promises);
    this.logger.debug(`Broadcasted message to ${this.panels.size} panels`, { messageId: message.id, type: message.type });
  }

  /**
   * Register a message handler
   */
  onMessage(type: string, handler: (message: UnifiedMessage) => Promise<void>): void {
    this.messageHandlers.set(type, handler);
    this.logger.debug(`Registered message handler for type: ${type}`);
  }

  /**
   * Send message with response expectation
   */
  async sendMessageWithResponse(panelId: string, message: UnifiedMessage, timeout = 5000): Promise<UnifiedMessage> {
    return new Promise((resolve, reject) => {
      const correlationId = message.correlationId || this.generateCorrelationId();

      // Set up response handler
      const responseHandler = async (response: UnifiedMessage) => {
        if (response.correlationId === correlationId) {
          this.removeMessageHandler(`response:${correlationId}`);
          clearTimeout(timeoutHandle);
          resolve(response);
        }
      };

      // Register temporary response handler
      this.onMessage(`response:${correlationId}`, responseHandler);

      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.removeMessageHandler(`response:${correlationId}`);
        reject(new CommunicationError(
          'TIMEOUT',
          `Message timeout after ${timeout}ms`,
          'main',
          panelId,
          Date.now(),
          undefined,
          correlationId
        ));
      }, timeout);

      // Send message
      this.sendMessage(panelId, { ...message, correlationId })
        .catch(reject);
    });
  }

  /**
   * Get panel configuration
   */
  getPanelConfig(panelId: string): PanelConfig | undefined {
    return this.panels.get(panelId);
  }

  /**
   * Get all registered panels
   */
  getRegisteredPanels(): PanelConfig[] {
    return Array.from(this.panels.values());
  }

  /**
   * Update panel configuration
   */
  updatePanelConfig(panelId: string, updates: Partial<PanelConfig>): void {
    const existing = this.panels.get(panelId);
    if (existing) {
      this.panels.set(panelId, { ...existing, ...updates });
      this.logger.info(`Updated panel config: ${panelId}`, updates);
    }
  }

  /**
   * Set up the main message listener
   */
  private setupMessageListener(): void {
    window.addEventListener('message', this.handleMessage.bind(this), false);
    this.logger.info('PostMessage listener setup complete');
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      // Find panel that matches the origin
      const panelId = this.findPanelByOrigin(event.origin);
      if (!panelId) {
        this.logger.warn('Received message from unknown origin:', event.origin);
        return;
      }

      const envelope: MessageEnvelope = {
        message: event.data,
        origin: event.origin,
        sourceWindow: event.source as Window
      };

      // Validate message
      const validation = await this.validator.validateMessageEnvelope(envelope);
      if (!validation.isValid) {
        this.logger.error('Message validation failed:', validation.errors);
        this.sendErrorResponse(panelId, 'VALIDATION_FAILED', validation.errors.join(', '));
        return;
      }

      const message = validation.sanitizedMessage || envelope.message;
      this.logger.debug(`Received message from panel: ${panelId}`, {
        messageId: message.id,
        type: message.type,
        correlationId: message.correlationId
      });

      // Handle message
      await this.processMessage(panelId, message);

    } catch (error) {
      this.logger.error('Error handling message:', error);
    }
  }

  /**
   * Process a validated message
   */
  private async processMessage(panelId: string, message: UnifiedMessage): Promise<void> {
    // Check if it's a response to a pending message
    if (message.correlationId && this.pendingMessages.has(message.correlationId)) {
      const pending = this.pendingMessages.get(message.correlationId)!;
      clearTimeout(pending.timeout);
      this.pendingMessages.delete(message.correlationId);
      // Response will be handled by the waiting promise
      return;
    }

    // Find and execute handler
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        this.logger.error(`Error in message handler for ${message.type}:`, error);
        this.sendErrorResponse(panelId, 'HANDLER_ERROR', error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      this.logger.warn(`No handler found for message type: ${message.type}`);
      this.sendErrorResponse(panelId, 'UNKNOWN_MESSAGE_TYPE', `No handler for message type: ${message.type}`);
    }
  }

  /**
   * Send message to iframe
   */
  private async sendMessageToIframe(panelId: string, message: UnifiedMessage): Promise<void> {
    const panel = this.panels.get(panelId);
    if (!panel) {
      throw new Error(`Panel not found: ${panelId}`);
    }

    // Find the iframe element
    const iframe = document.querySelector(`iframe[data-panel-id="${panelId}"]`) as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) {
      throw new Error(`Iframe not found for panel: ${panelId}`);
    }

    // Send message
    iframe.contentWindow.postMessage(message, this.getPanelOrigin(panel));
  }

  /**
   * Send error response to panel
   */
  private sendErrorResponse(panelId: string, code: string, message: string): void {
    const errorMessage: UnifiedMessage = {
      id: this.generateMessageId(),
      type: MessageType.ERROR_RESPONSE,
      source: 'main',
      target: panelId,
      channel: MessageChannel.POSTMESSAGE,
      payload: { code, message },
      timestamp: Date.now(),
      priority: MessagePriority.HIGH
    };

    this.sendMessage(panelId, errorMessage).catch(error => {
      this.logger.error('Failed to send error response:', error);
    });
  }

  /**
   * Find panel by origin
   */
  private findPanelByOrigin(origin: string): string | null {
    for (const [panelId, panel] of this.panels.entries()) {
      if (panel.allowedOrigins.includes(origin)) {
        return panelId;
      }
    }
    return null;
  }

  /**
   * Get panel origin
   */
  private getPanelOrigin(panel: PanelConfig): string {
    // Use the first allowed origin as the target
    return panel.allowedOrigins[0] || '*';
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(panelId: string): boolean {
    const now = Date.now();
    const limit = this.config.rateLimitPerSecond || 10;
    const windowSize = 1000; // 1 second

    const rateLimit = this.rateLimiter.get(panelId);
    if (!rateLimit || now > rateLimit.resetTime) {
      this.rateLimiter.set(panelId, { count: 1, resetTime: now + windowSize });
      return true;
    }

    if (rateLimit.count >= limit) {
      return false;
    }

    rateLimit.count++;
    return true;
  }

  /**
   * Remove message handler
   */
  private removeMessageHandler(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register event listener
   */
  onEvent(eventType: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Get metrics
   */
  getMetrics(): any {
    return {
      registeredPanels: this.panels.size,
      pendingMessages: this.pendingMessages.size,
      activeRateLimits: this.rateLimiter.size
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    return {
      status: 'healthy',
      details: {
        registeredPanels: this.panels.size,
        pendingMessages: this.pendingMessages.size
      }
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));

    // Clear pending messages
    for (const [id, { timeout }] of this.pendingMessages.entries()) {
      clearTimeout(timeout);
    }
    this.pendingMessages.clear();
    this.eventListeners.clear();

    this.logger.info('PostMessageManager destroyed');
  }
}