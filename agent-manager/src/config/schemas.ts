/**
 * Zod schemas for configuration validation
 */

import { z } from 'zod';

// ============================================================================
// Agent Configuration Schemas
// ============================================================================

export const AgentCapabilitiesSchema = z.object({
  domains: z.array(z.string()),
  expertise: z.record(z.number().min(0).max(10)),
  limitations: z.array(z.string()),
  preferredTools: z.array(z.string()),
  languages: z.array(z.string()),
});

export const AgentPersonalitySchema = z.object({
  communicationStyle: z.enum(['technical', 'casual', 'formal']),
  decisionMaking: z.enum(['analytical', 'intuitive', 'collaborative']),
  adaptability: z.number().min(0).max(10),
  creativity: z.number().min(0).max(10),
  empathy: z.number().min(0).max(10),
  humor: z.number().min(0).max(10),
  traits: z.array(z.string()),
});

export const AgentConfigurationSchema = z.object({
  maxConcurrentTasks: z.number().positive(),
  timeoutSettings: z.object({
    taskTimeout: z.number().positive(),
    skillTimeout: z.number().positive(),
    responseTimeout: z.number().positive(),
  }),
  retryPolicy: z.object({
    maxRetries: z.number().nonnegative(),
    backoffStrategy: z.enum(['linear', 'exponential']),
    backoffMultiplier: z.number().positive(),
  }),
  resourceLimits: z.object({
    memoryLimit: z.number().positive(),
    cpuLimit: z.number().min(0).max(100),
    networkLimit: z.number().positive(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    includeSensitiveData: z.boolean(),
    retentionDays: z.number().positive(),
  }),
});

export const SkillAssignmentSchema = z.object({
  skillId: z.string(),
  proficiency: z.number().min(0).max(10),
  platforms: z.array(z.enum(['kilo', 'opencode', 'skills-system'])),
  acquiredAt: z.date(),
  usageCount: z.number().nonnegative(),
});

export const AgentMetadataSchema = z.object({
  author: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  platforms: z.array(z.enum(['kilo', 'opencode', 'skills-system'])),
  changelog: z.array(z.string()),
});

export const UnifiedAgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  capabilities: AgentCapabilitiesSchema,
  personality: AgentPersonalitySchema,
  configuration: AgentConfigurationSchema,
  skills: z.array(SkillAssignmentSchema),
  metadata: AgentMetadataSchema,
  kiloConfig: z.record(z.any()).optional(),
  opencodeConfig: z.record(z.any()).optional(),
  skillsConfig: z.record(z.any()).optional(),
});

// ============================================================================
// Provider Configuration Schemas
// ============================================================================

export const ProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiEndpoint: z.string().url().optional(),
  region: z.string().optional(),
  customSettings: z.record(z.any()).optional(),
});

export const CredentialsSchema = z.object({
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  customAuth: z.record(z.any()).optional(),
});

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  providerId: z.string(),
  type: z.enum(['llm', 'embedding', 'image', 'audio']),
  capabilities: z.array(z.string()),
  costPer1kTokens: z.number().optional(),
  maxTokens: z.number().optional(),
});

// ============================================================================
// System Configuration Schemas
// ============================================================================

export const CLIConfigurationSchema = z.object({
  path: z.string(),
  version: z.string(),
  autoUpdate: z.boolean().default(true),
});

export const AuthenticationConfigurationSchema = z.object({
  method: z.enum(['api-key', 'oauth', 'provider-keys']),
  configPath: z.string().optional(),
  keyPath: z.string().optional(),
});

export const PlatformConfigurationSchema = z.object({
  id: z.enum(['kilo', 'opencode', 'skills-system']),
  enabled: z.boolean(),
  cli: CLIConfigurationSchema,
  authentication: AuthenticationConfigurationSchema,
  features: z.record(z.boolean()),
});

export const LogOutputSchema = z.object({
  type: z.enum(['file', 'console', 'elasticsearch']),
  path: z.string().optional(),
  endpoint: z.string().url().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

export const LoggingConfigurationSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  outputs: z.array(LogOutputSchema),
  correlation: z.object({
    enabled: z.boolean(),
    sessionTracking: z.boolean(),
    crossPlatformCorrelation: z.boolean(),
  }),
});

export const MonitoringConfigurationSchema = z.object({
  prometheus: z.object({
    enabled: z.boolean(),
    port: z.number().int().positive(),
    metrics: z.array(z.string()),
  }),
  grafana: z.object({
    enabled: z.boolean(),
    dashboards: z.array(z.string()),
  }),
});

export const SystemConfigurationSchema = z.object({
  basePath: z.string(),
  agentsPath: z.string(),
  skillsPath: z.string(),
  cacheEnabled: z.boolean(),
  validationEnabled: z.boolean(),
  platforms: z.array(PlatformConfigurationSchema),
  logging: LoggingConfigurationSchema,
  monitoring: MonitoringConfigurationSchema,
});

// ============================================================================
// Export types from schemas
// ============================================================================

export type AgentCapabilities = z.infer<typeof AgentCapabilitiesSchema>;
export type AgentPersonality = z.infer<typeof AgentPersonalitySchema>;
export type AgentConfiguration = z.infer<typeof AgentConfigurationSchema>;
export type SkillAssignment = z.infer<typeof SkillAssignmentSchema>;
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type UnifiedAgentConfig = z.infer<typeof UnifiedAgentConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type Credentials = z.infer<typeof CredentialsSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type SystemConfiguration = z.infer<typeof SystemConfigurationSchema>;
