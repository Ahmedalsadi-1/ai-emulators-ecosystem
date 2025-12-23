/**
 * AI Ecosystem Communication Module
 *
 * Provides unified communication between main interface and embedded UIs
 * through postMessage API and WebSocket connections with security validation.
 */

// Core components
export { CommunicationHub } from './core/CommunicationHub';
export * from './core/types';

// Channel managers
export { PostMessageManager } from './channels/PostMessageManager';
export { WebSocketManager } from './channels/WebSocketManager';

// Security components
export { MessageValidator } from './security/MessageValidator';
export { OriginValidator } from './security/OriginValidator';

// Utilities
export { Logger } from './utils/Logger';

// Default export for convenience
import { CommunicationHub } from './core/CommunicationHub';
import { CommunicationConfig } from './core/types';

export default {
  CommunicationHub,
  createHub: (config: CommunicationConfig) => new CommunicationHub(config)
};