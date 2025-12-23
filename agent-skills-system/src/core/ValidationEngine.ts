import { z } from 'zod';
import {
  ValidationRule,
  ValidationResult,
  ValidationError,
  AgentProfile,
  SkillDefinition,
  ProficiencyLevel
} from '../types';

/**
 * Comprehensive Validation Engine
 * Validates file structure, required fields, cross-references, and provides actionable error messages
 */
export class ValidationEngine {
  // Zod schemas for validation
  private static readonly agentSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required'),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (x.y.z)'),
    personality: z.object({
      communicationStyle: z.enum(['formal', 'casual', 'technical', 'conversational']),
      decisionMaking: z.enum(['analytical', 'intuitive', 'collaborative', 'authoritative']),
      adaptability: z.number().min(1).max(10),
      creativity: z.number().min(1).max(10),
      empathy: z.number().min(1).max(10),
      humor: z.number().min(1).max(10),
      traits: z.array(z.string())
    }),
    capabilities: z.object({
      domains: z.array(z.string()).min(1, 'At least one domain is required'),
      expertise: z.record(z.string(), z.number().min(1).max(10)),
      limitations: z.array(z.string()),
      preferredTools: z.array(z.string()),
      languages: z.array(z.string()).min(1, 'At least one language is required')
    }),
    configuration: z.object({
      maxConcurrentTasks: z.number().min(1).max(100),
      timeoutSettings: z.object({
        taskTimeout: z.number().min(1),
        skillTimeout: z.number().min(1),
        responseTimeout: z.number().min(1)
      }),
      retryPolicy: z.object({
        maxRetries: z.number().min(0).max(10),
        backoffStrategy: z.enum(['linear', 'exponential']),
        backoffMultiplier: z.number().min(1)
      }),
      resourceLimits: z.object({
        memoryLimit: z.number().min(1),
        cpuLimit: z.number().min(1).max(100),
        networkLimit: z.number().min(1)
      }),
      logging: z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']),
        includeSensitiveData: z.boolean(),
        retentionDays: z.number().min(1).max(3650)
      })
    }),
    skills: z.array(z.object({
      skillId: z.string().min(1),
      proficiency: z.number().min(1).max(6),
      acquiredAt: z.date(),
      usageCount: z.number().min(0)
    })),
    skillProficiencies: z.record(z.string(), z.number().min(1).max(6)),
    metadata: z.object({
      author: z.string().min(1),
      description: z.string().min(1),
      tags: z.array(z.string()),
      category: z.string().min(1),
      changelog: z.array(z.string()).min(1)
    }),
    createdAt: z.union([z.string(), z.date()]).refine((val) => {
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    }, 'Invalid date'),
    updatedAt: z.union([z.string(), z.date()]).refine((val) => {
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    }, 'Invalid date')
  });

  private static readonly skillSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required'),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (x.y.z)'),
    category: z.string().min(1),
    subcategory: z.string().optional(),
    description: z.string().min(1),
    dependencies: z.array(z.object({
      skillId: z.string().min(1),
      versionRange: z.string().min(1),
      required: z.boolean()
    })),
    prerequisites: z.array(z.string()),
    compatibility: z.object({
      platforms: z.array(z.string()).min(1),
      environments: z.array(z.string()).min(1),
      agentTypes: z.array(z.string()).min(1),
      restrictions: z.array(z.string()).optional()
    }),
    implementation: z.object({
      type: z.enum(['function', 'module', 'service', 'api']),
      language: z.string().min(1),
      entryPoint: z.string().min(1),
      runtime: z.string().min(1)
    }),
    parameters: z.array(z.object({
      name: z.string().min(1),
      type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
      required: z.boolean(),
      description: z.string().min(1)
    })),
    outputs: z.array(z.object({
      name: z.string().min(1),
      type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'file', 'stream']),
      description: z.string().min(1),
      required: z.boolean()
    })),
    usage: z.object({
      examples: z.array(z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        parameters: z.record(z.any()),
        expectedOutput: z.any(),
        tags: z.array(z.string())
      })),
      tutorials: z.array(z.string()),
      bestPractices: z.array(z.string()),
      commonPatterns: z.array(z.string()),
      performance: z.object({
        averageExecutionTime: z.number().min(0),
        memoryUsage: z.number().min(0),
        successRate: z.number().min(0).max(100)
      })
    }),
    metadata: z.object({
      author: z.string().min(1),
      maintainers: z.array(z.string()).min(1),
      license: z.string().min(1),
      repository: z.string().min(1),
      documentation: z.string().min(1),
      changelog: z.array(z.string()).min(1),
      tags: z.array(z.string()),
      category: z.string().min(1),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      stability: z.enum(['experimental', 'stable', 'deprecated'])
    }),
    createdAt: z.union([z.string(), z.date()]).refine((val) => {
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    }, 'Invalid date'),
    updatedAt: z.union([z.string(), z.date()]).refine((val) => {
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    }, 'Invalid date')
  });

  /**
   * Validate agent profile
   */
  static validateAgent(agent: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    try {
      // Schema validation
      this.agentSchema.parse(agent);

      // Cross-reference validation
      this.validateAgentSkills(agent, errors, warnings);
      this.validateAgentCapabilities(agent, errors, warnings, infos);
      this.validateAgentConfiguration(agent, errors, warnings);

    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const fieldPath = err.path.join('.');
          errors.push({
            field: fieldPath,
            rule: 'schema',
            message: err.message,
            severity: 'error',
            value: err.code
          });
        });
      } else {
        errors.push({
          field: 'unknown',
          rule: 'validation',
          message: 'Unexpected validation error',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos
    };
  }

  /**
   * Validate skill definition
   */
  static validateSkill(skill: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    try {
      // Schema validation
      this.skillSchema.parse(skill);

      // Cross-reference validation
      this.validateSkillDependencies(skill, errors, warnings);
      this.validateSkillCompatibility(skill, errors, warnings, infos);
      this.validateSkillImplementation(skill, errors, warnings, infos);

    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const fieldPath = err.path.join('.');
          errors.push({
            field: fieldPath,
            rule: 'schema',
            message: err.message,
            severity: 'error',
            value: err.code
          });
        });
      } else {
        errors.push({
          field: 'unknown',
          rule: 'validation',
          message: 'Unexpected validation error',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos
    };
  }

  /**
   * Validate agent-skill compatibility
   */
  static validateAgentSkillCompatibility(
    agent: AgentProfile,
    skill: SkillDefinition
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    // Check if agent has required domains
    const agentDomains = new Set(agent.capabilities.domains);
    const hasCompatibleDomain = skill.compatibility.agentTypes.some(type =>
      agent.capabilities.domains.includes(type) ||
      agent.metadata.category === type
    );

    if (!hasCompatibleDomain) {
      warnings.push({
        field: 'compatibility.agentTypes',
        rule: 'compatibility',
        message: `Agent may not be compatible with skill's required agent types: ${skill.compatibility.agentTypes.join(', ')}`,
        severity: 'warning'
      });
    }

    // Check platform compatibility
    const hasCompatiblePlatform = skill.compatibility.platforms.some(platform =>
      agent.capabilities.preferredTools.some(tool =>
        tool.toLowerCase().includes(platform.toLowerCase())
      )
    );

    if (!hasCompatiblePlatform && skill.compatibility.platforms.length > 0) {
      infos.push({
        field: 'compatibility.platforms',
        rule: 'compatibility',
        message: `Consider adding platform support for: ${skill.compatibility.platforms.join(', ')}`,
        severity: 'info'
      });
    }

    // Check environment compatibility
    if (!skill.compatibility.environments.includes('development') &&
        !skill.compatibility.environments.includes('production')) {
      warnings.push({
        field: 'compatibility.environments',
        rule: 'compatibility',
        message: 'Skill does not specify development or production environment compatibility',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos
    };
  }

  /**
   * Validate skill dependency graph
   */
  static validateSkillDependencyGraph(
    skills: Map<string, SkillDefinition>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Check for circular dependencies
    for (const skill of skills.values()) {
      if (!visited.has(skill.id)) {
        this.detectCircularDependencies(skill.id, skills, visited, recursionStack, errors);
      }
    }

    // Check for missing dependencies
    for (const skill of skills.values()) {
      for (const dep of skill.dependencies) {
        const skillId: string = dep.skillId;
        if (!skills.has(skillId)) {
          errors.push({
            field: `dependencies.${skillId}`,
            rule: 'dependency',
            message: `Required dependency '${skillId}' not found in skill registry`,
            severity: 'error'
          });
        }
      }
    }

    // Check for unused skills
    const usedSkills = new Set<string>();
    for (const skill of skills.values()) {
      skill.dependencies.forEach(dep => usedSkills.add(dep.skillId));
    }

    for (const skill of skills.values()) {
      if (!usedSkills.has(skill.id) && skill.dependencies.length === 0) {
        infos.push({
          field: 'usage',
          rule: 'optimization',
          message: `Skill '${skill.id}' is not used as a dependency and has no dependencies - consider if it's needed`,
          severity: 'info'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos
    };
  }

  // Private validation methods

  private static validateAgentSkills(agent: any, errors: ValidationError[], warnings: ValidationError[]) {
    // Check skill proficiency consistency
    const skillIds = new Set(agent.skills.map((s: any) => s.skillId as string));
    const proficiencyKeys: string[] = Object.keys(agent.skillProficiencies);

    for (const skillId of skillIds) {
      if (!proficiencyKeys.includes(skillId as string)) {
        warnings.push({
          field: `skillProficiencies.${skillId}`,
          rule: 'consistency',
          message: `Skill '${skillId}' is assigned but has no proficiency level`,
          severity: 'warning'
        });
      }
    }

    for (const skillId of proficiencyKeys) {
      if (!skillIds.has(skillId)) {
        errors.push({
          field: `skills.${skillId}`,
          rule: 'consistency',
          message: `Proficiency level set for skill '${skillId}' but skill is not assigned`,
          severity: 'error'
        });
      }
    }
  }

  private static validateAgentCapabilities(agent: any, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    // Check domain expertise consistency
    const domains = new Set(agent.capabilities.domains);
    const expertiseDomains = Object.keys(agent.capabilities.expertise);

    for (const domain of expertiseDomains) {
      if (!domains.has(domain)) {
        warnings.push({
          field: `capabilities.expertise.${domain}`,
          rule: 'consistency',
          message: `Expertise defined for domain '${domain}' but domain is not listed in capabilities.domains`,
          severity: 'warning'
        });
      }
    }

    // Check for reasonable limits
    if (agent.configuration.maxConcurrentTasks > 20) {
      warnings.push({
        field: 'configuration.maxConcurrentTasks',
        rule: 'performance',
        message: 'High concurrent task limit may impact performance',
        severity: 'warning'
      });
    }
  }

  private static validateAgentConfiguration(agent: any, errors: ValidationError[], warnings: ValidationError[]) {
    // Check timeout relationships
    const timeouts = agent.configuration.timeoutSettings;
    if (timeouts.skillTimeout > timeouts.taskTimeout) {
      warnings.push({
        field: 'configuration.timeoutSettings',
        rule: 'logic',
        message: 'Skill timeout should not exceed task timeout',
        severity: 'warning'
      });
    }

    // Check resource limits
    if (agent.configuration.resourceLimits.cpuLimit > 100) {
      errors.push({
        field: 'configuration.resourceLimits.cpuLimit',
        rule: 'range',
        message: 'CPU limit cannot exceed 100%',
        severity: 'error'
      });
    }
  }

  private static validateSkillDependencies(skill: any, errors: ValidationError[], warnings: ValidationError[]) {
    // Check for self-dependency
    const selfDep = skill.dependencies.find((dep: any) => dep.skillId === skill.id);
    if (selfDep) {
      errors.push({
        field: 'dependencies',
        rule: 'logic',
        message: 'Skill cannot depend on itself',
        severity: 'error'
      });
    }

    // Check version range format (basic validation)
    for (const dep of skill.dependencies) {
      if (!this.isValidVersionRange(dep.versionRange)) {
        warnings.push({
          field: `dependencies.${dep.skillId}.versionRange`,
          rule: 'format',
          message: `Version range '${dep.versionRange}' may not be valid`,
          severity: 'warning'
        });
      }
    }
  }

  private static validateSkillCompatibility(skill: any, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    // Check for empty compatibility arrays
    if (skill.compatibility.platforms.length === 0) {
      errors.push({
        field: 'compatibility.platforms',
        rule: 'required',
        message: 'At least one platform must be specified',
        severity: 'error'
      });
    }

    // Check for overly restrictive compatibility
    if (skill.compatibility.environments.length === 1 &&
        skill.compatibility.environments[0] === 'development') {
      infos.push({
        field: 'compatibility.environments',
        rule: 'usability',
        message: 'Consider adding production environment support for broader usage',
        severity: 'info'
      });
    }
  }

  private static validateSkillImplementation(skill: any, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    // Check implementation consistency
    const impl = skill.implementation;

    if (impl.type === 'api' && !impl.entryPoint.includes('http')) {
      warnings.push({
        field: 'implementation.entryPoint',
        rule: 'format',
        message: 'API entry point should be a valid URL or endpoint',
        severity: 'warning'
      });
    }

    // Check for missing build/test commands for complex implementations
    if (impl.type === 'module' && (!impl.buildCommands || impl.buildCommands.length === 0)) {
      infos.push({
        field: 'implementation.buildCommands',
        rule: 'completeness',
        message: 'Consider adding build commands for module-type skills',
        severity: 'info'
      });
    }
  }

  private static detectCircularDependencies(
    skillId: string,
    skills: Map<string, SkillDefinition>,
    visited: Set<string>,
    recursionStack: Set<string>,
    errors: ValidationError[]
  ) {
    visited.add(skillId);
    recursionStack.add(skillId);

    const skill = skills.get(skillId);
    if (skill) {
      for (const dep of skill.dependencies) {
        if (!visited.has(dep.skillId)) {
          this.detectCircularDependencies(dep.skillId, skills, visited, recursionStack, errors);
        } else if (recursionStack.has(dep.skillId)) {
          errors.push({
            field: `dependencies.${dep.skillId}`,
            rule: 'circular-dependency',
            message: `Circular dependency detected: ${skillId} -> ${dep.skillId}`,
            severity: 'error'
          });
        }
      }
    }

    recursionStack.delete(skillId);
  }

  private static isValidVersionRange(range: string): boolean {
    // Basic semver range validation
    const patterns = [
      /^\d+\.\d+\.\d+$/,           // Exact version
      /^\^\d+\.\d+\.\d+$/,         // Compatible with
      /^~\d+\.\d+\.\d+$/,          // Approximately equivalent to
      /^>=\d+\.\d+\.\d+$/,         // Greater than or equal
      /^>\d+\.\d+\.\d+$/,          // Greater than
      /^<=\d+\.\d+\.\d+$/,         // Less than or equal
      /^<\d+\.\d+\.\d+$/,          // Less than
      /^\d+\.\d+\.\d+ - \d+\.\d+\.\d+$/  // Range
    ];

    return patterns.some(pattern => pattern.test(range));
  }

  /**
   * Create validation rules for custom validation
   */
  static createValidationRules(): ValidationRule[] {
    return [
      {
        field: 'id',
        type: 'pattern',
        value: /^[a-z0-9-]+$/,
        message: 'ID must contain only lowercase letters, numbers, and hyphens',
        severity: 'error'
      },
      {
        field: 'version',
        type: 'pattern',
        value: /^\d+\.\d+\.\d+$/,
        message: 'Version must follow semantic versioning (x.y.z)',
        severity: 'error'
      },
      {
        field: 'name',
        type: 'pattern',
        value: /^.{1,100}$/,
        message: 'Name must be between 1 and 100 characters',
        severity: 'error'
      }
    ];
  }
}