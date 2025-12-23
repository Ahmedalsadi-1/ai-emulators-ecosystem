/**
 * Message Validator
 * Handles message validation, security checks, and payload sanitization
 */

import {
  UnifiedMessage,
  MessageValidationResult,
  CommunicationConfig,
  MessageEnvelope,
  CommunicationError
} from '../core/types';
import { OriginValidator } from './OriginValidator';

export class MessageValidator {
  private config: CommunicationConfig;
  private originValidator: OriginValidator;
  private messageSchemas: Map<string, any> = new Map();

  constructor(config: CommunicationConfig) {
    this.config = config;
    this.originValidator = new OriginValidator(config.allowedOrigins);
    this.initializeSchemas();
  }

  /**
   * Validate a complete message envelope
   */
  async validateMessageEnvelope(envelope: MessageEnvelope): Promise<MessageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate origin
      if (envelope.origin && !this.originValidator.validateOrigin(envelope.origin)) {
        errors.push(`Invalid origin: ${envelope.origin}`);
      }

      // Validate message structure
      const messageValidation = this.validateMessageStructure(envelope.message);
      errors.push(...messageValidation.errors);
      warnings.push(...messageValidation.warnings);

      // Validate payload size
      if (this.getMessageSize(envelope.message) > this.config.maxMessageSize) {
        errors.push(`Message size exceeds limit: ${this.getMessageSize(envelope.message)} > ${this.config.maxMessageSize}`);
      }

      // Validate schema if available
      if (this.messageSchemas.has(envelope.message.type)) {
        const schemaValidation = this.validateAgainstSchema(envelope.message);
        errors.push(...schemaValidation.errors);
        warnings.push(...schemaValidation.warnings);
      }

      // Security checks
      const securityValidation = await this.performSecurityChecks(envelope);
      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);

      // Sanitize payload if validation passed
      let sanitizedMessage: UnifiedMessage | undefined;
      if (errors.length === 0) {
        sanitizedMessage = this.sanitizeMessage(envelope.message);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedMessage
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Validate message structure
   */
  private validateMessageStructure(message: UnifiedMessage): MessageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!message.id) errors.push('Message ID is required');
    if (!message.type) errors.push('Message type is required');
    if (!message.source) errors.push('Message source is required');
    if (!message.target) errors.push('Message target is required');
    if (!message.channel) errors.push('Message channel is required');
    if (typeof message.timestamp !== 'number') errors.push('Message timestamp must be a number');

    // Validate timestamp (not too far in future/past)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(message.timestamp - now) > fiveMinutes) {
      warnings.push('Message timestamp is significantly different from current time');
    }

    // Validate correlation ID format if present
    if (message.correlationId && !/^[a-zA-Z0-9\-_]{8,64}$/.test(message.correlationId)) {
      errors.push('Invalid correlation ID format');
    }

    // Validate TTL if present
    if (message.ttl && (message.ttl < 0 || message.ttl > 3600000)) { // Max 1 hour
      errors.push('Invalid TTL value');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate against JSON schema
   */
  private validateAgainstSchema(message: UnifiedMessage): MessageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const schema = this.messageSchemas.get(message.type);
    if (!schema) {
      return { isValid: true, errors, warnings };
    }

    // Basic schema validation (simplified)
    try {
      this.validateObjectAgainstSchema(message.payload, schema, 'payload');
    } catch (error) {
      errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Perform security checks
   */
  private async performSecurityChecks(envelope: MessageEnvelope): Promise<MessageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const message = envelope.message;

    // Check for suspicious patterns in payload
    if (this.containsSuspiciousPatterns(message.payload)) {
      errors.push('Message contains suspicious patterns');
    }

    // Validate signature if present
    if (message.signature) {
      const signatureValid = await this.validateSignature(message);
      if (!signatureValid) {
        errors.push('Invalid message signature');
      }
    } else if (this.requiresSignature(message.type)) {
      warnings.push('Message type requires signature but none provided');
    }

    // Check for replay attacks (simplified)
    if (this.isPotentialReplay(message)) {
      errors.push('Potential replay attack detected');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Sanitize message payload
   */
  private sanitizeMessage(message: UnifiedMessage): UnifiedMessage {
    const sanitized = { ...message };

    // Deep clone and sanitize payload
    sanitized.payload = this.sanitizePayload(message.payload);

    // Remove any sensitive metadata
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeMetadata(sanitized.metadata);
    }

    return sanitized;
  }

  /**
   * Sanitize payload recursively
   */
  private sanitizePayload(payload: any): any {
    if (typeof payload === 'string') {
      // Remove script tags and other dangerous content
      return payload.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitizePayload(item));
    }

    if (payload && typeof payload === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(payload)) {
        // Skip sensitive keys
        if (!this.isSensitiveKey(key)) {
          sanitized[key] = this.sanitizePayload(value);
        }
      }
      return sanitized;
    }

    return payload;
  }

  /**
   * Sanitize metadata
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const allowedKeys = ['userAgent', 'viewport', 'locale', 'timezone'];

    for (const [key, value] of Object.entries(metadata)) {
      if (allowedKeys.includes(key)) {
        sanitized[key] = this.sanitizePayload(value);
      }
    }

    return sanitized;
  }

  /**
   * Initialize message schemas
   */
  private initializeSchemas(): void {
    // Authentication messages
    this.messageSchemas.set('auth:request', {
      type: 'object',
      properties: {
        token: { type: 'string' },
        refreshToken: { type: 'boolean' }
      },
      required: ['token']
    });

    // State sync messages
    this.messageSchemas.set('state:sync', {
      type: 'object',
      properties: {
        stateKey: { type: 'string' },
        state: { type: 'object' },
        version: { type: 'number' }
      },
      required: ['stateKey', 'state', 'version']
    });

    // Workflow messages
    this.messageSchemas.set('workflow:start', {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              panelId: { type: 'string' },
              action: { type: 'string' },
              params: { type: 'object' }
            },
            required: ['id', 'panelId', 'action']
          }
        }
      },
      required: ['workflowId', 'steps']
    });
  }

  /**
   * Validate object against schema (simplified)
   */
  private validateObjectAgainstSchema(obj: any, schema: any, path: string): void {
    if (!schema || typeof schema !== 'object') return;

    if (schema.type === 'object' && schema.properties) {
      if (typeof obj !== 'object' || obj === null) {
        throw new Error(`${path} must be an object`);
      }

      if (schema.required) {
        for (const required of schema.required) {
          if (!(required in obj)) {
            throw new Error(`${path} missing required property: ${required}`);
          }
        }
      }

      for (const [key, value] of Object.entries(obj)) {
        const propSchema = schema.properties[key];
        if (propSchema) {
          this.validateObjectAgainstSchema(value, propSchema, `${path}.${key}`);
        }
      }
    } else if (schema.type === 'array' && schema.items) {
      if (!Array.isArray(obj)) {
        throw new Error(`${path} must be an array`);
      }
      obj.forEach((item, index) => {
        this.validateObjectAgainstSchema(item, schema.items, `${path}[${index}]`);
      });
    } else if (schema.type && typeof obj !== schema.type) {
      throw new Error(`${path} must be of type ${schema.type}`);
    }
  }

  /**
   * Check for suspicious patterns
   */
  private containsSuspiciousPatterns(payload: any): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ];

    const payloadStr = JSON.stringify(payload);
    return suspiciousPatterns.some(pattern => pattern.test(payloadStr));
  }

  /**
   * Validate message signature
   */
  private async validateSignature(message: UnifiedMessage): Promise<boolean> {
    // Simplified signature validation
    // In production, this would verify against a public key
    return message.signature ? message.signature.length > 10 : false;
  }

  /**
   * Check if message type requires signature
   */
  private requiresSignature(messageType: string): boolean {
    const signedTypes = ['auth:request', 'auth:refresh', 'workflow:start'];
    return signedTypes.includes(messageType);
  }

  /**
   * Check for potential replay attacks
   */
  private isPotentialReplay(message: UnifiedMessage): boolean {
    // Simplified replay detection
    // In production, this would check against a cache of recent message IDs
    return false;
  }

  /**
   * Check if key is sensitive
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'private'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }

  /**
   * Get message size in bytes
   */
  private getMessageSize(message: UnifiedMessage): number {
    return new Blob([JSON.stringify(message)]).size;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CommunicationConfig>): void {
    this.config = { ...this.config, ...config };
    this.originValidator.updateAllowedOrigins(this.config.allowedOrigins);
  }

  /**
   * Add custom message schema
   */
  addMessageSchema(messageType: string, schema: any): void {
    this.messageSchemas.set(messageType, schema);
  }

  /**
   * Remove message schema
   */
  removeMessageSchema(messageType: string): void {
    this.messageSchemas.delete(messageType);
  }
}