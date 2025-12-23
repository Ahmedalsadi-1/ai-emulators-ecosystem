import * as crypto from 'crypto';

export interface Credential {
  id: string;
  name: string;
  type: 'api-key' | 'oauth' | 'password' | 'token' | 'certificate';
  data: string; // Encrypted data stored as string
  ownerId: string;
  sharedWith: string[]; // App IDs that can access this credential
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface DecryptedCredential extends Omit<Credential, 'data'> {
  data: Record<string, any>; // Decrypted data
}

export interface CredentialSummary extends Omit<Credential, 'data'> {
  data: {}; // Empty for summaries
}

export interface CredentialAccessPolicy {
  credentialId: string;
  appId: string;
  permissions: ('read' | 'write' | 'share')[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface VaultConfig {
  encryptionKey: string;
  keyRotationInterval: number; // days
  maxCredentialsPerUser: number;
  auditLogRetention: number; // days
}

/**
 * Secure credential vault for storing and sharing sensitive data
 * between trusted embedded applications.
 */
export class CredentialVault {
  private config: VaultConfig;
  private credentials: Map<string, Credential> = new Map();
  private accessPolicies: Map<string, CredentialAccessPolicy[]> = new Map();
  private auditLog: Array<{
    timestamp: Date;
    action: string;
    credentialId: string;
    userId: string;
    appId?: string;
    ipAddress?: string;
    userAgent?: string;
  }> = [];

  constructor(config: VaultConfig) {
    this.config = config;

    // Start cleanup intervals
    setInterval(() => this.cleanupExpiredCredentials(), 24 * 60 * 60 * 1000); // Daily
    setInterval(() => this.rotateEncryptionKey(), this.config.keyRotationInterval * 24 * 60 * 60 * 1000);
  }

  /**
   * Store a new credential
   */
  async storeCredential(
    ownerId: string,
    name: string,
    type: Credential['type'],
    data: Record<string, any>,
    sharedWith: string[] = [],
    expiresAt?: Date
  ): Promise<Credential> {
    // Check user limit
    const userCredentials = Array.from(this.credentials.values())
      .filter(cred => cred.ownerId === ownerId);

    if (userCredentials.length >= this.config.maxCredentialsPerUser) {
      throw new Error('Maximum credentials per user exceeded');
    }

    const credential: Credential = {
      id: this.generateId(),
      name,
      type,
      data: await this.encryptData(data),
      ownerId,
      sharedWith: [...sharedWith],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt
    };

    this.credentials.set(credential.id, credential);
    this.auditLog.push({
      timestamp: new Date(),
      action: 'create',
      credentialId: credential.id,
      userId: ownerId
    });

    return credential;
  }

  /**
   * Retrieve a credential
   */
  async getCredential(credentialId: string, requestingAppId: string, userId: string): Promise<DecryptedCredential | null> {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      return null;
    }

    // Check if user owns the credential or it's shared with the app
    if (credential.ownerId !== userId && !credential.sharedWith.includes(requestingAppId)) {
      throw new Error('Access denied');
    }

    // Check if credential is expired
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      throw new Error('Credential expired');
    }

    // Decrypt data
    const decryptedData = await this.decryptData(credential.data);
    const decryptedCredential: DecryptedCredential = {
      ...credential,
      data: decryptedData
    };

    this.auditLog.push({
      timestamp: new Date(),
      action: 'read',
      credentialId,
      userId,
      appId: requestingAppId
    });

    return decryptedCredential;
  }

  /**
   * Update a credential
   */
  async updateCredential(
    credentialId: string,
    userId: string,
    updates: Partial<Pick<Credential, 'name' | 'data' | 'sharedWith' | 'expiresAt'>>
  ): Promise<Credential | null> {
    const credential = this.credentials.get(credentialId);
    if (!credential || credential.ownerId !== userId) {
      return null;
    }

    // If updates.data is provided, check if it's already encrypted or needs encryption
    let dataToStore = credential.data;
    if (updates.data) {
      // If it's an object, encrypt it; if it's a string, assume it's already encrypted
      dataToStore = typeof updates.data === 'object' ? await this.encryptData(updates.data) : updates.data;
    }

    const updatedCredential: Credential = {
      ...credential,
      ...updates,
      data: dataToStore,
      updatedAt: new Date()
    };

    this.credentials.set(credentialId, updatedCredential);
    this.auditLog.push({
      timestamp: new Date(),
      action: 'update',
      credentialId,
      userId
    });

    return updatedCredential;
  }

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId: string, userId: string): Promise<boolean> {
    const credential = this.credentials.get(credentialId);
    if (!credential || credential.ownerId !== userId) {
      return false;
    }

    this.credentials.delete(credentialId);
    this.accessPolicies.delete(credentialId);

    this.auditLog.push({
      timestamp: new Date(),
      action: 'delete',
      credentialId,
      userId
    });

    return true;
  }

  /**
   * Share credential with another app
   */
  async shareCredential(
    credentialId: string,
    ownerId: string,
    targetAppId: string,
    permissions: CredentialAccessPolicy['permissions'] = ['read']
  ): Promise<void> {
    const credential = this.credentials.get(credentialId);
    if (!credential || credential.ownerId !== ownerId) {
      throw new Error('Credential not found or access denied');
    }

    // Add to shared list if not already there
    if (!credential.sharedWith.includes(targetAppId)) {
      credential.sharedWith.push(targetAppId);
      this.credentials.set(credentialId, credential);
    }

    // Create or update access policy
    const policies = this.accessPolicies.get(credentialId) || [];
    const existingPolicy = policies.find(p => p.appId === targetAppId);

    if (existingPolicy) {
      existingPolicy.permissions = permissions;
    } else {
      policies.push({
        credentialId,
        appId: targetAppId,
        permissions,
        grantedAt: new Date(),
        grantedBy: ownerId
      });
    }

    this.accessPolicies.set(credentialId, policies);

    this.auditLog.push({
      timestamp: new Date(),
      action: 'share',
      credentialId,
      userId: ownerId,
      appId: targetAppId
    });
  }

  /**
   * Revoke credential sharing
   */
  async revokeCredentialSharing(credentialId: string, ownerId: string, targetAppId: string): Promise<void> {
    const credential = this.credentials.get(credentialId);
    if (!credential || credential.ownerId !== ownerId) {
      throw new Error('Credential not found or access denied');
    }

    // Remove from shared list
    credential.sharedWith = credential.sharedWith.filter(appId => appId !== targetAppId);
    this.credentials.set(credentialId, credential);

    // Remove access policies
    const policies = this.accessPolicies.get(credentialId) || [];
    const filteredPolicies = policies.filter(p => p.appId !== targetAppId);
    this.accessPolicies.set(credentialId, filteredPolicies);

    this.auditLog.push({
      timestamp: new Date(),
      action: 'revoke',
      credentialId,
      userId: ownerId,
      appId: targetAppId
    });
  }

  /**
   * Get all credentials for a user
   */
  async getUserCredentials(userId: string): Promise<CredentialSummary[]> {
    return Array.from(this.credentials.values())
      .filter(cred => cred.ownerId === userId)
      .map(cred => ({
        ...cred,
        data: {} // Don't return encrypted data in list
      }));
  }

  /**
   * Get credentials shared with an app
   */
  async getSharedCredentials(appId: string, userId: string): Promise<CredentialSummary[]> {
    return Array.from(this.credentials.values())
      .filter(cred => cred.sharedWith.includes(appId) && cred.ownerId === userId)
      .map(cred => ({
        ...cred,
        data: {} // Don't return encrypted data in list
      }));
  }

  /**
   * Check if app has access to credential
   */
  hasAccess(credentialId: string, appId: string, userId: string, requiredPermission: string = 'read'): boolean {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      return false;
    }

    // Owner has full access
    if (credential.ownerId === userId) {
      return true;
    }

    // Check if shared with app
    if (!credential.sharedWith.includes(appId)) {
      return false;
    }

    // Check permissions
    const policies = this.accessPolicies.get(credentialId) || [];
    const policy = policies.find(p => p.appId === appId);

    return policy ? policy.permissions.includes(requiredPermission as any) : false;
  }

  /**
   * Get audit log for a credential
   */
  getAuditLog(credentialId: string, userId: string): any[] {
    const credential = this.credentials.get(credentialId);
    if (!credential || credential.ownerId !== userId) {
      return [];
    }

    return this.auditLog
      .filter(entry => entry.credentialId === credentialId)
      .slice(-100); // Last 100 entries
  }

  /**
   * Clean up audit log (remove old entries)
   */
  cleanupAuditLog(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.auditLogRetention);

    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffDate);
  }

  /**
   * Encrypt sensitive data
   */
  private async encryptData(data: Record<string, any>): Promise<string> {
    const jsonString = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private async decryptData(encryptedData: string): Promise<Record<string, any>> {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `cred_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Clean up expired credentials
   */
  private cleanupExpiredCredentials(): void {
    const now = new Date();
    for (const [id, credential] of this.credentials.entries()) {
      if (credential.expiresAt && credential.expiresAt < now) {
        this.credentials.delete(id);
        this.accessPolicies.delete(id);
      }
    }
  }

  /**
   * Rotate encryption key (placeholder - would need key management system)
   */
  private rotateEncryptionKey(): void {
    // In a real implementation, this would:
    // 1. Generate new encryption key
    // 2. Re-encrypt all existing credentials
    // 3. Update key references
    console.log('Encryption key rotation triggered (placeholder implementation)');
  }
}