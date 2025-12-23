// orchestrator/src/services/MessageHandler.ts
import * as crypto from 'crypto';
import {
  EmbeddedMessage,
  AuthMessage,
  DataMessage,
  UIMessage,
  EventMessage,
  HealthMessage
} from '../types/iframe';

export class MessageHandler {
  private messageHandlers = new Map<string, MessageHandlerFunction>();
  private allowedOrigins: Set<string>;

  constructor(allowedOrigins: string[] = []) {
    this.allowedOrigins = new Set(allowedOrigins);
    this.registerDefaultHandlers();
  }

  /**
   * Register a message handler for a specific message type
   */
  registerHandler(messageType: string, handler: MessageHandlerFunction): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Handle incoming postMessage
   */
  async handleMessage(
    event: MessageEvent,
    expectedOrigin?: string
  ): Promise<EmbeddedMessage | null> {
    try {
      // Origin validation
      if (!this.isValidOrigin(event.origin, expectedOrigin)) {
        throw new Error(`Invalid origin: ${event.origin}`);
      }

      // Parse and validate message
      const message = this.parseMessage(event.data);
      this.validateMessage(message);

      // Route to appropriate handler
      const handler = this.messageHandlers.get(message.type);
      if (!handler) {
        throw new Error(`No handler registered for message type: ${message.type}`);
      }

      return await handler(message, event.origin);
    } catch (error) {
      console.error('Message handling error:', error);
      return this.createErrorResponse(event.data?.id || 'unknown', error);
    }
  }

  /**
   * Send message to iframe
   */
  sendMessage(iframeWindow: any, message: EmbeddedMessage, targetOrigin: string = '*'): void {
    // Add security signature if needed
    const secureMessage = this.signMessage(message);

    // Ensure targetOrigin is secure (not '*') for production
    iframeWindow.postMessage(secureMessage, targetOrigin);
  }

  /**
   * Create standardized message
   */
  createMessage(
    type: string,
    source: 'parent' | 'iframe',
    targetAppId: string,
    payload: any,
    sourceMessageId?: string
  ): EmbeddedMessage {
    return {
      type,
      id: sourceMessageId || this.generateMessageId(),
      source,
      targetAppId,
      payload,
      timestamp: Date.now(),
    };
  }

  private registerDefaultHandlers(): void {
    // Authentication messages
    this.registerHandler('auth:request', this.handleAuthRequest.bind(this));
    this.registerHandler('auth:refresh', this.handleAuthRefresh.bind(this));
    this.registerHandler('auth:validate', this.handleAuthValidate.bind(this));

    // Data exchange messages
    this.registerHandler('data:request', this.handleDataRequest.bind(this));
    this.registerHandler('data:response', this.handleDataResponse.bind(this));

    // UI synchronization messages
    this.registerHandler('ui:state-change', this.handleUIStateChange.bind(this));
    this.registerHandler('ui:action', this.handleUIAction.bind(this));

    // Event forwarding messages
    this.registerHandler('event:user-action', this.handleUserAction.bind(this));
    this.registerHandler('event:app-state', this.handleAppStateEvent.bind(this));

    // Health check messages
    this.registerHandler('health:ping', this.handleHealthPing.bind(this));
    this.registerHandler('health:status', this.handleHealthStatus.bind(this));
  }

  private isValidOrigin(origin: string, expectedOrigin?: string): boolean {
    if (expectedOrigin) {
      return origin === expectedOrigin;
    }
    return this.allowedOrigins.has(origin);
  }

  private parseMessage(data: any): EmbeddedMessage {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid message format');
    }

    // Ensure required fields are present
    const requiredFields = ['type', 'id', 'source', 'targetAppId', 'timestamp'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return data as EmbeddedMessage;
  }

  private validateMessage(message: EmbeddedMessage): void {
    // Validate message structure
    if (typeof message.type !== 'string' || !message.type.includes(':')) {
      throw new Error('Invalid message type format');
    }

    if (typeof message.id !== 'string') {
      throw new Error('Invalid message ID');
    }

    if (!['parent', 'iframe'].includes(message.source)) {
      throw new Error('Invalid message source');
    }

    if (typeof message.targetAppId !== 'string') {
      throw new Error('Invalid target app ID');
    }

    // Validate timestamp (within reasonable range)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(message.timestamp - now) > fiveMinutes) {
      throw new Error('Message timestamp outside valid range');
    }

    // Validate signature if present
    if (message.signature) {
      this.validateSignature(message);
    }
  }

  private validateSignature(message: EmbeddedMessage): void {
    const signature = message.signature;
    if (!signature) {
      throw new Error('Missing signature');
    }

    // Remove signature from message for verification
    const { signature: _, ...messageWithoutSig } = message;

    // Create expected signature
    const expectedSignature = this.createSignature(messageWithoutSig);

    // Use constant-time comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )) {
      throw new Error('Invalid message signature');
    }
  }

  private signMessage(message: EmbeddedMessage): EmbeddedMessage {
    const signature = this.createSignature(message);
    return { ...message, signature };
  }

  private createSignature(message: Omit<EmbeddedMessage, 'signature'>): string {
    const messageString = JSON.stringify(message);
    const secret = process.env.MESSAGE_SIGNING_SECRET || 'default-secret';
    return crypto.createHmac('sha256', secret).update(messageString).digest('hex');
  }

  private generateMessageId(): string {
    return crypto.randomUUID();
  }

  private createErrorResponse(originalMessageId: string, error: any): EmbeddedMessage {
    return {
      type: 'error:response',
      id: this.generateMessageId(),
      source: 'parent',
      targetAppId: 'unknown',
      payload: {
        originalMessageId,
        error: error.message || 'Unknown error',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };
  }

  // Message handlers
  private async handleAuthRequest(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    // Implementation would integrate with AuthenticationProxy
    return this.createMessage(
      'auth:response',
      'parent',
      message.targetAppId,
      { success: true, sessionId: 'mock-session-id' },
      message.id
    );
  }

  private async handleAuthRefresh(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    return this.createMessage(
      'auth:refresh-response',
      'parent',
      message.targetAppId,
      { success: true, newToken: 'mock-new-token' },
      message.id
    );
  }

  private async handleAuthValidate(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    return this.createMessage(
      'auth:validate-response',
      'parent',
      message.targetAppId,
      { valid: true },
      message.id
    );
  }

  private async handleDataRequest(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    // Route to appropriate data service
    return this.createMessage(
      'data:response',
      'parent',
      message.targetAppId,
      { data: 'mock-data' },
      message.id
    );
  }

  private async handleDataResponse(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    // Forward response to appropriate destination
    return message; // Echo for now
  }

  private async handleUIStateChange(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    // Handle UI state synchronization
    return this.createMessage(
      'ui:state-updated',
      'parent',
      message.targetAppId,
      { acknowledged: true },
      message.id
    );
  }

  private async handleUIAction(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    // Handle UI actions
    return this.createMessage(
      'ui:action-response',
      'parent',
      message.targetAppId,
      { success: true },
      message.id
    );
  }

  private async handleUserAction(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    // Forward user actions to other apps or parent
    return this.createMessage(
      'event:acknowledged',
      'parent',
      message.targetAppId,
      { received: true },
      message.id
    );
  }

  private async handleAppStateEvent(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    // Handle application state events
    return this.createMessage(
      'event:state-updated',
      'parent',
      message.targetAppId,
      { processed: true },
      message.id
    );
  }

  private async handleHealthPing(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    return this.createMessage(
      'health:pong',
      'parent',
      message.targetAppId,
      { status: 'healthy', timestamp: Date.now() },
      message.id
    );
  }

  private async handleHealthStatus(message: EmbeddedMessage, origin: string): Promise<EmbeddedMessage> {
    return this.createMessage(
      'health:status-response',
      'parent',
      message.targetAppId,
      { status: 'ok', details: {} },
      message.id
    );
  }
}

type MessageHandlerFunction = (message: EmbeddedMessage, origin: string) => Promise<EmbeddedMessage>;