// Agent Skills System Types and Interfaces

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: ParseError[];
}

export interface ParseError {
  type: 'yaml' | 'markdown' | 'validation' | 'structure';
  message: string;
  line?: number;
  column?: number;
  path?: string;
  context?: string;
}

export interface FileMetadata {
  path: string;
  lastModified: Date;
  size: number;
  checksum: string;
}

// ========================================
// AGENT TYPES
// ========================================

export interface AgentProfile {
  // Core identification
  id: string;
  name: string;
  version: string;

  // Personality and behavior
  personality: PersonalityTraits;
  capabilities: AgentCapabilities;
  configuration: AgentConfiguration;

  // Skills and associations
  skills: AgentSkill[];
  skillProficiencies: Record<string, ProficiencyLevel>;

  // Metadata
  metadata: AgentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalityTraits {
  communicationStyle: 'formal' | 'casual' | 'technical' | 'conversational';
  decisionMaking: 'analytical' | 'intuitive' | 'collaborative' | 'authoritative';
  adaptability: number; // 1-10 scale
  creativity: number; // 1-10 scale
  empathy: number; // 1-10 scale
  humor: number; // 1-10 scale
  traits: string[]; // Custom personality traits
}

export interface AgentCapabilities {
  domains: string[]; // e.g., ['web-development', 'data-analysis', 'automation']
  expertise: Record<string, number>; // domain -> expertise level (1-10)
  limitations: string[];
  preferredTools: string[];
  languages: string[];
}

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  timeoutSettings: {
    taskTimeout: number; // seconds
    skillTimeout: number; // seconds
    responseTimeout: number; // seconds
  };
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    backoffMultiplier: number;
  };
  resourceLimits: {
    memoryLimit: number; // MB
    cpuLimit: number; // percentage
    networkLimit: number; // KB/s
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeSensitiveData: boolean;
    retentionDays: number;
  };
}

export interface AgentSkill {
  skillId: string;
  proficiency: ProficiencyLevel;
  acquiredAt: Date;
  lastUsed?: Date;
  usageCount: number;
  context: string[]; // domains/contexts where this skill is used
}

export enum ProficiencyLevel {
  NOVICE = 1,
  BEGINNER = 2,
  INTERMEDIATE = 3,
  ADVANCED = 4,
  EXPERT = 5,
  MASTER = 6
}

export interface AgentMetadata {
  author: string;
  description: string;
  tags: string[];
  category: string;
  license?: string;
  repository?: string;
  documentation?: string;
  changelog: string[];
}

// ========================================
// SKILL TYPES
// ========================================

export interface SkillDefinition {
  // Core identification
  id: string;
  name: string;
  version: string;

  // Skill definition
  category: string;
  subcategory?: string;
  description: string;

  // Dependencies and requirements
  dependencies: SkillDependency[];
  prerequisites: string[];
  compatibility: SkillCompatibility;

  // Implementation details
  implementation: SkillImplementation;
  parameters: SkillParameter[];
  outputs: SkillOutput[];

  // Usage and metadata
  usage: SkillUsage;
  metadata: SkillMetadata;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillDependency {
  skillId: string;
  versionRange: string; // e.g., "^1.0.0", ">=2.0.0"
  required: boolean;
  description?: string;
}

export interface SkillCompatibility {
  platforms: string[]; // e.g., ['node', 'browser', 'desktop']
  environments: string[]; // e.g., ['development', 'production']
  agentTypes: string[]; // e.g., ['assistant', 'worker', 'specialist']
  restrictions?: string[];
}

export interface SkillImplementation {
  type: 'function' | 'module' | 'service' | 'api';
  language: string;
  entryPoint: string;
  runtime: string; // e.g., 'node', 'python', 'go'
  packageManager?: string;
  buildCommands?: string[];
  testCommands?: string[];
}

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
  examples?: any[];
}

export interface SkillOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file' | 'stream';
  description: string;
  required: boolean;
  schema?: any; // JSON schema for complex outputs
}

export interface SkillUsage {
  examples: SkillExample[];
  tutorials: string[];
  bestPractices: string[];
  commonPatterns: string[];
  performance: {
    averageExecutionTime: number; // milliseconds
    memoryUsage: number; // MB
    successRate: number; // percentage
  };
}

export interface SkillExample {
  title: string;
  description: string;
  parameters: Record<string, any>;
  expectedOutput: any;
  tags: string[];
}

export interface SkillMetadata {
  author: string;
  maintainers: string[];
  license: string;
  repository: string;
  documentation: string;
  changelog: string[];
  tags: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  stability: 'experimental' | 'stable' | 'deprecated';
}

// ========================================
// VALIDATION TYPES
// ========================================

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'pattern' | 'range' | 'enum' | 'custom';
  value?: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
  expected?: any;
  line?: number;
  column?: number;
}

// ========================================
// SYSTEM TYPES
// ========================================

export interface AgentSkillsSystem {
  agents: Map<string, AgentProfile>;
  skills: Map<string, SkillDefinition>;
  agentSkillAssociations: Map<string, AgentSkill[]>;

  // Core operations
  loadAgent(id: string): Promise<AgentProfile>;
  saveAgent(agent: AgentProfile): Promise<void>;
  loadSkill(id: string): Promise<SkillDefinition>;
  saveSkill(skill: SkillDefinition): Promise<void>;

  // Association operations
  assignSkillToAgent(agentId: string, skillId: string, proficiency: ProficiencyLevel): Promise<void>;
  removeSkillFromAgent(agentId: string, skillId: string): Promise<void>;
  getAgentSkills(agentId: string): Promise<AgentSkill[]>;

  // Validation and dependency resolution
  validateAgent(agent: AgentProfile): Promise<ValidationResult>;
  validateSkill(skill: SkillDefinition): Promise<ValidationResult>;
  resolveSkillDependencies(skillId: string): Promise<SkillDefinition[]>;
  checkSkillCompatibility(agent: AgentProfile, skill: SkillDefinition): Promise<boolean>;
}

export interface SystemConfiguration {
  basePath: string;
  agentsPath: string;
  skillsPath: string;
  cacheEnabled: boolean;
  validationEnabled: boolean;
  autoSave: boolean;
  backupEnabled: boolean;
  maxConcurrentOperations: number;
}

// ========================================
// CLI TYPES
// ========================================

export interface CLIOptions {
  verbose: boolean;
  dryRun: boolean;
  force: boolean;
  interactive: boolean;
  config: string;
}

export interface CLICommand {
  name: string;
  description: string;
  action: (args: any, options: CLIOptions) => Promise<void>;
  options: CLICommandOption[];
}

export interface CLICommandOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: any;
}

// ========================================
// UTILITY TYPES
// ========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Merge<T, U> = Omit<T, keyof U> & U;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;