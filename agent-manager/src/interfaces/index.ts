/**
 * Core interfaces for the unified Agent Manager
 * Defines contracts for all major components
 */

// ============================================================================
// Platform Types
// ============================================================================

export type PlatformId = 'kilo' | 'opencode' | 'skills-system';

export interface Platform {
  id: PlatformId;
  name: string;
  version: string;
  capabilities: PlatformCapability[];
  status: PlatformStatus;
}

export type PlatformCapability = 
  | 'agent-deployment'
  | 'cloud-sync'
  | 'parallel-mode'
  | 'mcp-integration'
  | 'provider-management'
  | 'session-management'
  | 'skill-execution'
  | 'monitoring';

export type PlatformStatus = 'available' | 'unavailable' | 'degraded' | 'error';

// ============================================================================
// Agent Configuration Types
// ============================================================================

export interface AgentCapabilities {
  domains: string[];
  expertise: Record<string, number>;
  limitations: string[];
  preferredTools: string[];
  languages: string[];
}

export interface AgentPersonality {
  communicationStyle: 'technical' | 'casual' | 'formal';
  decisionMaking: 'analytical' | 'intuitive' | 'collaborative';
  adaptability: number;
  creativity: number;
  empathy: number;
  humor: number;
  traits: string[];
}

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  timeoutSettings: {
    taskTimeout: number;
    skillTimeout: number;
    responseTimeout: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    backoffMultiplier: number;
  };
  resourceLimits: {
    memoryLimit: number;
    cpuLimit: number;
    networkLimit: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeSensitiveData: boolean;
    retentionDays: number;
  };
}

export interface SkillAssignment {
  skillId: string;
  proficiency: number;
  platforms: PlatformId[];
  acquiredAt: Date;
  usageCount: number;
}

export interface AgentMetadata {
  author: string;
  description: string;
  tags: string[];
  category: string;
  platforms: PlatformId[];
  changelog: string[];
}

export interface UnifiedAgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapabilities;
  personality: AgentPersonality;
  configuration: AgentConfiguration;
  skills: SkillAssignment[];
  metadata: AgentMetadata;
  kiloConfig?: Record<string, any>;
  opencodeConfig?: Record<string, any>;
  skillsConfig?: Record<string, any>;
}

export interface Agent extends UnifiedAgentConfig {
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Agent Manager Interface
// ============================================================================

export interface IAgentManager {
  // Agent lifecycle management
  createAgent(config: UnifiedAgentConfig): Promise<Agent>;
  deployAgent(agentId: string, platform: PlatformId): Promise<DeploymentResult>;
  updateAgent(agentId: string, updates: Partial<UnifiedAgentConfig>): Promise<Agent>;
  deleteAgent(agentId: string): Promise<void>;
  
  // Cross-platform operations
  syncAgentProfiles(): Promise<SyncResult>;
  migrateAgent(agentId: string, fromPlatform: PlatformId, toPlatform: PlatformId): Promise<MigrationResult>;
  
  // Status and monitoring
  getAgentStatus(agentId: string): Promise<AgentStatus>;
  listAgents(filters?: AgentFilters): Promise<Agent[]>;
}

export interface DeploymentResult {
  success: boolean;
  agentId: string;
  platform: PlatformId;
  deploymentId: string;
  timestamp: Date;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  profilesSynced: number;
  conflictsResolved: number;
  errors: SyncError[];
  timestamp: Date;
}

export interface SyncError {
  agentId: string;
  platform: PlatformId;
  error: string;
}

export interface MigrationResult {
  success: boolean;
  agentId: string;
  fromPlatform: PlatformId;
  toPlatform: PlatformId;
  dataPreserved: boolean;
  timestamp: Date;
  error?: string;
}

export interface AgentStatus {
  id: string;
  platform: PlatformId;
  state: 'idle' | 'running' | 'deployed' | 'error';
  sessions: SessionInfo[];
  metrics: AgentMetrics;
  health: HealthStatus;
}

export interface SessionInfo {
  sessionId: string;
  startTime: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksRunning: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
}

export interface HealthStatus {
  healthy: boolean;
  lastCheck: Date;
  issues: string[];
}

export interface AgentFilters {
  platform?: PlatformId;
  category?: string;
  tags?: string[];
  status?: 'idle' | 'running' | 'deployed' | 'error';
}

// ============================================================================
// CLI Bridge Interface
// ============================================================================

export interface ICLIBridge {
  // Platform abstraction
  executeCommand(platform: PlatformId, command: string, args: any[]): Promise<CommandResult>;
  convertAgentProfile(profile: Agent, targetFormat: ProfileFormat): Promise<ConvertedProfile>;
  
  // Synchronization
  syncProfiles(direction: SyncDirection): Promise<SyncResult>;
  resolveConflicts(conflicts: ProfileConflict[]): Promise<ConflictResolution>;
}

export type ProfileFormat = 'kilo' | 'opencode' | 'skills-system' | 'unified';
export type SyncDirection = 'bidirectional' | 'to-kilo' | 'to-opencode' | 'to-skills-system';

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
}

export interface ConvertedProfile {
  format: ProfileFormat;
  content: string;
  metadata: Record<string, any>;
}

export interface ProfileConflict {
  agentId: string;
  field: string;
  values: Record<PlatformId, any>;
  timestamp: Date;
}

export interface ConflictResolution {
  resolved: boolean;
  conflicts: ProfileConflict[];
  resolutions: Record<string, any>;
}

// ============================================================================
// Provider Manager Interface
// ============================================================================

export interface IProviderManager {
  // Provider management
  listProviders(platform?: PlatformId): Promise<Provider[]>;
  configureProvider(providerId: string, config: ProviderConfig): Promise<void>;
  authenticateProvider(providerId: string, credentials: Credentials): Promise<AuthResult>;
  
  // Model management
  listModels(providerId?: string): Promise<Model[]>;
  selectModel(agentId: string, modelId: string): Promise<void>;
}

export interface Provider {
  id: string;
  name: string;
  type: 'llm' | 'embedding' | 'image' | 'audio';
  platforms: PlatformId[];
  status: 'active' | 'inactive' | 'error';
  config: ProviderConfig;
}

export interface ProviderConfig {
  apiKey?: string;
  apiEndpoint?: string;
  region?: string;
  customSettings?: Record<string, any>;
}

export interface Credentials {
  apiKey?: string;
  username?: string;
  password?: string;
  token?: string;
  customAuth?: Record<string, any>;
}

export interface AuthResult {
  success: boolean;
  providerId: string;
  expiresAt?: Date;
  error?: string;
}

export interface Model {
  id: string;
  name: string;
  providerId: string;
  type: 'llm' | 'embedding' | 'image' | 'audio';
  capabilities: string[];
  costPer1kTokens?: number;
  maxTokens?: number;
}

// ============================================================================
// Session Manager Interface
// ============================================================================

export interface ISessionManager {
  // Session lifecycle
  createSession(agentId: string, platform: PlatformId): Promise<Session>;
  continueSession(sessionId: string): Promise<Session>;
  shareSession(sessionId: string): Promise<ShareResult>;
  
  // Cross-platform session management
  migrateSession(sessionId: string, toPlatform: PlatformId): Promise<Session>;
  correlateSession(sessionId: string, correlationId: string): Promise<void>;
}

export interface Session {
  id: string;
  agentId: string;
  platform: PlatformId;
  startTime: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
  context: SessionContext;
  metadata: Record<string, any>;
}

export interface SessionContext {
  conversationHistory: Message[];
  variables: Record<string, any>;
  state: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ShareResult {
  success: boolean;
  sessionId: string;
  shareUrl?: string;
  shareToken?: string;
  expiresAt?: Date;
  error?: string;
}

// ============================================================================
// Skill Types
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  dependencies: SkillDependency[];
  platforms: PlatformId[];
  implementation: SkillImplementation;
  metadata: SkillMetadata;
}

export interface SkillDependency {
  skillId: string;
  versionRange: string;
  required: boolean;
}

export interface SkillImplementation {
  type: 'function' | 'service' | 'plugin';
  language: string;
  entryPoint: string;
  runtime: string;
}

export interface SkillMetadata {
  author: string;
  maintainers: string[];
  license: string;
  repository: string;
  documentation: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  stability: 'stable' | 'beta' | 'experimental';
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface SystemConfiguration {
  basePath: string;
  agentsPath: string;
  skillsPath: string;
  cacheEnabled: boolean;
  validationEnabled: boolean;
  platforms: PlatformConfiguration[];
  logging: LoggingConfiguration;
  monitoring: MonitoringConfiguration;
}

export interface PlatformConfiguration {
  id: PlatformId;
  enabled: boolean;
  cli: CLIConfiguration;
  authentication: AuthenticationConfiguration;
  features: Record<string, boolean>;
}

export interface CLIConfiguration {
  path: string;
  version: string;
  autoUpdate: boolean;
}

export interface AuthenticationConfiguration {
  method: 'api-key' | 'oauth' | 'provider-keys';
  configPath?: string;
  keyPath?: string;
}

export interface LoggingConfiguration {
  level: 'debug' | 'info' | 'warn' | 'error';
  outputs: LogOutput[];
  correlation: {
    enabled: boolean;
    sessionTracking: boolean;
    crossPlatformCorrelation: boolean;
  };
}

export interface LogOutput {
  type: 'file' | 'console' | 'elasticsearch';
  path?: string;
  endpoint?: string;
  level?: string;
}

export interface MonitoringConfiguration {
  prometheus: {
    enabled: boolean;
    port: number;
    metrics: string[];
  };
  grafana: {
    enabled: boolean;
    dashboards: string[];
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class AgentManagerError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgentManagerError';
  }
}

export class PlatformError extends AgentManagerError {
  constructor(
    public platform: PlatformId,
    message: string,
    details?: Record<string, any>
  ) {
    super('PLATFORM_ERROR', message, details);
    this.name = 'PlatformError';
  }
}

export class SyncError extends AgentManagerError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super('SYNC_ERROR', message, details);
    this.name = 'SyncError';
  }
}

export class ValidationError extends AgentManagerError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}
