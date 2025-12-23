/**
 * Communication Hub
 * Central orchestrator for all communication channels and message routing
 */

import {
  UnifiedMessage,
  CommunicationConfig,
  PanelConfig,
  CommunicationEvent,
  MessageChannel,
  MessageType
} from './types';
import { PostMessageManager } from '../channels/PostMessageManager';
import { WebSocketManager } from '../channels/WebSocketManager';
import { MessageValidator } from '../security/MessageValidator';
import { Logger } from '../utils/Logger';

export class CommunicationHub {
  private postMessageManager: PostMessageManager;
  private webSocketManager: WebSocketManager;
  private validator: MessageValidator;
  private logger: Logger;
  private config: CommunicationConfig;
  private eventListeners: Map<string, ((event: CommunicationEvent) => void)[]> = new Map();

  constructor(config: CommunicationConfig) {
    this.config = config;
    this.logger = new Logger('CommunicationHub');
    this.validator = new MessageValidator(config);
    this.postMessageManager = new PostMessageManager(config, this.validator);
    this.webSocketManager = new WebSocketManager(config);

    this.setupEventForwarding();
    this.logger.info('CommunicationHub initialized');
  }

  /**
   * Initialize the communication system
   */
  async initialize(): Promise<void> {
    try {
      await this.webSocketManager.initialize();
      this.setupMessageHandlers();
      this.logger.info('CommunicationHub initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize CommunicationHub:', error);
      throw error;
    }
  }

  /**
   * Register an embedded panel
   */
  registerPanel(config: PanelConfig): void {
    this.postMessageManager.registerPanel(config);
    this.logger.info(`Panel registered: ${config.id}`);
  }

  /**
   * Unregister a panel
   */
  unregisterPanel(panelId: string): void {
    this.postMessageManager.unregisterPanel(panelId);
    this.logger.info(`Panel unregistered: ${panelId}`);
  }

  /**
   * Send a message through the appropriate channel
   */
  async sendMessage(message: UnifiedMessage): Promise<void> {
    try {
      switch (message.channel) {
        case MessageChannel.POSTMESSAGE:
          if (message.target === 'broadcast') {
            await this.postMessageManager.broadcastMessage(message);
          } else {
            await this.postMessageManager.sendMessage(message.target, message);
          }
          break;

        case MessageChannel.WEBSOCKET:
          await this.webSocketManager.sendMessage(message);
          break;

        case MessageChannel.BROADCAST:
          // Send through both channels
          await Promise.allSettled([
            this.postMessageManager.broadcastMessage(message),
            this.webSocketManager.broadcastMessage(message)
          ]);
          break;

        default:
          throw new Error(`Unknown message channel: ${message.channel}`);
      }

      this.emitEvent('message', 'hub', message.target, {
        direction: 'outgoing',
        message
      });

    } catch (error) {
      this.logger.error('Failed to send message:', error);
      this.emitEvent('error', 'hub', message.target, {
        error: error instanceof Error ? error.message : 'Unknown error',
        message
      });
      throw error;
    }
  }

  /**
   * Send message with response expectation
   */
  async sendMessageWithResponse(message: UnifiedMessage, timeout = 5000): Promise<UnifiedMessage> {
    // Use postMessage for request-response pattern
    message.channel = MessageChannel.POSTMESSAGE;

    return this.postMessageManager.sendMessageWithResponse(message.target, message, timeout);
  }

  /**
   * Register a message handler
   */
  onMessage(type: MessageType, handler: (message: UnifiedMessage) => Promise<void>): void {
    this.postMessageManager.onMessage(type, handler);
    this.webSocketManager.onMessage(type, handler);
  }

  /**
   * Register an event listener
   */
  onEvent(eventType: string, listener: (event: CommunicationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove an event listener
   */
  offEvent(eventType: string, listener: (event: CommunicationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get panel configuration
   */
  getPanelConfig(panelId: string): PanelConfig | undefined {
    return this.postMessageManager.getPanelConfig(panelId);
  }

  /**
   * Get all registered panels
   */
  getRegisteredPanels(): PanelConfig[] {
    return this.postMessageManager.getRegisteredPanels();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CommunicationConfig>): void {
    this.config = { ...this.config, ...config };
    this.validator.updateConfig(config);
    this.logger.info('Configuration updated');
  }

  /**
   * Get communication metrics
   */
  getMetrics(): any {
    return {
      postMessage: this.postMessageManager.getMetrics?.() || {},
      webSocket: this.webSocketManager.getMetrics?.() || {},
      panels: this.getRegisteredPanels().length
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const postMessageHealth = await this.postMessageManager.healthCheck?.() || { status: 'unknown' };
      const webSocketHealth = await this.webSocketManager.healthCheck?.() || { status: 'unknown' };

      const allHealthy = postMessageHealth.status === 'healthy' && webSocketHealth.status === 'healthy';

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        details: {
          postMessage: postMessageHealth,
          webSocket: webSocketHealth,
          panels: this.getRegisteredPanels().length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Clean shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down CommunicationHub');

    try {
      await this.webSocketManager.shutdown?.();
      this.postMessageManager.destroy();
      this.eventListeners.clear();
      this.logger.info('CommunicationHub shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Set up message handlers for system messages
   */
  private setupMessageHandlers(): void {
    // Health check handler
    this.onMessage(MessageType.HEALTH_CHECK, async (message) => {
      const health = await this.healthCheck();
      await this.sendMessage({
        id: this.generateMessageId(),
        type: MessageType.HEALTH_STATUS,
        source: 'hub',
        target: message.source,
        channel: message.channel,
        payload: health,
        timestamp: Date.now(),
        correlationId: message.correlationId
      });
    });

    // Ping handler
    this.onMessage(MessageType.HEALTH_PING, async (message) => {
      await this.sendMessage({
        id: this.generateMessageId(),
        type: MessageType.HEALTH_PONG,
        source: 'hub',
        target: message.source,
        channel: message.channel,
        payload: { timestamp: Date.now() },
        timestamp: Date.now(),
        correlationId: message.correlationId
      });
    });

    // Error reporting handler
    this.onMessage(MessageType.ERROR_REPORT, async (message) => {
      this.logger.error('Error reported from panel:', message.payload);
      // Could forward to monitoring system here
    });
  }

  /**
   * Set up event forwarding between managers
   */
  private setupEventForwarding(): void {
    // Forward postMessage events
    this.postMessageManager.onEvent?.('message', (event) => {
      this.emitEvent('message', event.source, event.target, event.data);
    });

    this.postMessageManager.onEvent?.('error', (event) => {
      this.emitEvent('error', event.source, event.target, event.data);
    });

    // Forward WebSocket events
    this.webSocketManager.onEvent?.('message', (event) => {
      this.emitEvent('message', event.source, event.target, event.data);
    });

    this.webSocketManager.onEvent?.('connect', (event) => {
      this.emitEvent('connect', event.source, event.target, event.data);
    });

    this.webSocketManager.onEvent?.('disconnect', (event) => {
      this.emitEvent('disconnect', event.source, event.target, event.data);
    });
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(type: string, source: string, target: string, data: any): void {
    const event: CommunicationEvent = {
      type: type as any,
      source,
      target,
      data,
      timestamp: Date.now()
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          this.logger.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `hub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}