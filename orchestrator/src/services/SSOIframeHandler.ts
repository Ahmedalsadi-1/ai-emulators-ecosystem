import { AuthenticationProxy } from './AuthenticationProxy';

export interface IframeMessage {
  type: string;
  id: string;
  source: 'parent' | 'iframe';
  targetAppId: string;
  timestamp: number;
  payload?: any;
}

/**
 * Handles secure cross-origin communication between parent window and embedded iframes
 * for SSO authentication and data sharing.
 */
export class SSOIframeHandler {
  private authProxy: AuthenticationProxy;
  private allowedOrigins: string[];

  constructor(authProxy: AuthenticationProxy, allowedOrigins: string[] = ['*']) {
    this.authProxy = authProxy;
    this.allowedOrigins = allowedOrigins;
    this.setupMessageListener();
  }

  /**
   * Send authentication message to iframe
   */
  sendAuthMessage(iframe: any, appId: string, sessionId: string, origin: string): void {
    const message: IframeMessage = {
      type: 'auth:request',
      id: this.generateId(),
      source: 'parent',
      targetAppId: appId,
      timestamp: Date.now(),
      payload: { sessionId, appId }
    };

    this.postMessage(iframe.contentWindow, message, origin);
  }

  /**
   * Send SSO login message to iframe
   */
  sendSSOLogin(iframe: any, appId: string, sessionId: string, origin: string): void {
    const message: IframeMessage = {
      type: 'sso:login',
      id: this.generateId(),
      source: 'parent',
      targetAppId: appId,
      timestamp: Date.now(),
      payload: { sessionId, appId }
    };

    this.postMessage(iframe.contentWindow, message, origin);
  }

  /**
   * Send token sharing message to iframe
   */
  sendTokenShare(iframe: any, appId: string, sourceSessionId: string, targetAppId: string, origin: string): void {
    const message: IframeMessage = {
      type: 'sso:token-share',
      id: this.generateId(),
      source: 'parent',
      targetAppId: appId,
      timestamp: Date.now(),
      payload: { sourceSessionId, targetAppId }
    };

    this.postMessage(iframe.contentWindow, message, origin);
  }

  /**
   * Handle incoming messages from iframes
   */
  private async handleMessage(event: any): Promise<void> {
    // Validate origin
    if (!this.isOriginAllowed(event.origin)) {
      console.warn(`Rejected message from unauthorized origin: ${event.origin}`);
      return;
    }

    const message: IframeMessage = event.data;

    // Basic validation
    if (!message || !message.type || !message.id) {
      return;
    }

    try {
      let response: any = null;

      // Handle different message types
      switch (message.type) {
        case 'auth:request':
          response = await this.authProxy.handleAuthMessage({
            type: 'auth:request',
            appId: message.targetAppId,
            userId: message.payload?.userId,
            parentToken: message.payload?.parentToken
          }, event.origin);
          break;

        case 'sso:login':
          response = await this.authProxy.handleAuthMessage({
            type: 'sso:login',
            appId: message.targetAppId,
            sessionId: message.payload?.sessionId
          }, event.origin);
          break;

        case 'sso:request-token':
          response = await this.authProxy.handleAuthMessage({
            type: 'sso:request-token',
            sourceSessionId: message.payload?.sourceSessionId,
            appId: message.targetAppId,
            permissions: message.payload?.permissions
          }, event.origin);
          break;

        case 'health:ping':
          response = { status: 'healthy', timestamp: Date.now() };
          break;

        default:
          console.log(`Unhandled message type: ${message.type}`);
          return;
      }

      // Send response back
      if (response && event.source) {
        const responseMessage: IframeMessage = {
          type: message.type.replace('request', 'response'),
          id: message.id,
          source: 'parent',
          targetAppId: message.targetAppId,
          timestamp: Date.now(),
          payload: response
        };

        this.postMessage(event.source, responseMessage, event.origin);
      }

    } catch (error) {
      console.error('Error handling iframe message:', error);

      // Send error response
      if (event.source) {
        const errorMessage: IframeMessage = {
          type: 'error',
          id: message.id,
          source: 'parent',
          targetAppId: message.targetAppId,
          timestamp: Date.now(),
          payload: { error: error instanceof Error ? error.message : 'Unknown error' }
        };

        this.postMessage(event.source, errorMessage, event.origin);
      }
    }
  }

  /**
   * Post message to target window
   */
  private postMessage(targetWindow: any, message: IframeMessage, origin: string): void {
    if (targetWindow && typeof targetWindow.postMessage === 'function') {
      targetWindow.postMessage(message, origin);
    }
  }

  /**
   * Set up message event listener
   */
  private setupMessageListener(): void {
    // Message listener setup would be handled by the client-side code
    // This service provides the server-side message processing logic
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string): boolean {
    if (this.allowedOrigins.includes('*')) {
      return true;
    }

    return this.allowedOrigins.some(allowed => {
      if (allowed === origin) return true;
      try {
        const allowedUrl = new URL(allowed);
        const originUrl = new URL(origin);
        return allowedUrl.origin === originUrl.origin;
      } catch {
        return false;
      }
    });
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Client-side helper for embedded applications
 */
export class IframeClient {
  private parentOrigin: string;
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

  constructor(parentOrigin: string) {
    this.parentOrigin = parentOrigin;
    this.setupMessageListener();
  }

  /**
   * Request authentication from parent
   */
  requestAuth(appId: string, userId: string, parentToken?: string): Promise<any> {
    return this.sendMessage({
      type: 'auth:request',
      id: this.generateId(),
      source: 'iframe',
      targetAppId: appId,
      timestamp: Date.now(),
      payload: { userId, parentToken }
    });
  }

  /**
   * Request SSO login
   */
  requestSSOLogin(appId: string, sessionId: string): Promise<any> {
    return this.sendMessage({
      type: 'sso:login',
      id: this.generateId(),
      source: 'iframe',
      targetAppId: appId,
      timestamp: Date.now(),
      payload: { sessionId }
    });
  }

  /**
   * Request cross-app token
   */
  requestToken(appId: string, sourceSessionId: string, permissions?: string[]): Promise<any> {
    return this.sendMessage({
      type: 'sso:request-token',
      id: this.generateId(),
      source: 'iframe',
      targetAppId: appId,
      timestamp: Date.now(),
      payload: { sourceSessionId, permissions }
    });
  }

  /**
   * Send health ping
   */
  ping(appId: string): Promise<any> {
    return this.sendMessage({
      type: 'health:ping',
      id: this.generateId(),
      source: 'iframe',
      targetAppId: appId,
      timestamp: Date.now()
    });
  }

  /**
   * Send message to parent
   */
  private sendMessage(message: IframeMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(message.id, { resolve, reject });

      // Set timeout
      setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error('Request timeout'));
      }, 30000);

      // Send message
      if (typeof globalThis !== 'undefined' && (globalThis as any).parent) {
        (globalThis as any).parent.postMessage(message, this.parentOrigin);
      } else {
        reject(new Error('No parent window available'));
      }
    });
  }

  /**
   * Handle responses from parent
   */
  private handleMessage(event: any): void {
    if (event.origin !== this.parentOrigin) {
      return;
    }

    const message: IframeMessage = event.data;
    if (!message || !message.id) {
      return;
    }

    const pending = this.pendingRequests.get(message.id);
    if (pending) {
      this.pendingRequests.delete(message.id);

      if (message.type === 'error') {
        pending.reject(new Error(message.payload?.error || 'Unknown error'));
      } else {
        pending.resolve(message.payload);
      }
    }
  }

  /**
   * Set up message listener
   */
  private setupMessageListener(): void {
    // Client-side message listener setup
    if (typeof globalThis !== 'undefined' && (globalThis as any).addEventListener) {
      (globalThis as any).addEventListener('message', this.handleMessage.bind(this));
    }
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `iframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}