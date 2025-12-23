import {
  AgentProfile,
  SkillDefinition,
  ValidationResult,
  ValidationError,
  ParseError
} from '../types';

/**
 * Schema Migration System
 * Handles backward compatibility and schema evolution for agent profiles and skill definitions
 */

export interface MigrationResult {
  success: boolean;
  data: any;
  warnings: string[];
  errors: string[];
  appliedMigrations: string[];
}

export interface Migration {
  version: string;
  description: string;
  appliesTo: (data: any) => boolean;
  migrate: (data: any) => any;
}

export class SchemaMigrationManager {
  private agentMigrations: Migration[] = [];
  private skillMigrations: Migration[] = [];

  constructor() {
    this.initializeMigrations();
  }

  /**
   * Migrate agent profile to latest schema version
   */
  migrateAgent(data: any, targetVersion?: string): MigrationResult {
    return this.migrate(data, this.agentMigrations, targetVersion || '2.0.0');
  }

  /**
   * Migrate skill definition to latest schema version
   */
  migrateSkill(data: any, targetVersion?: string): MigrationResult {
    return this.migrate(data, this.skillMigrations, targetVersion || '2.0.0');
  }

  /**
   * Check if data needs migration
   */
  needsMigration(data: any, type: 'agent' | 'skill'): boolean {
    const migrations = type === 'agent' ? this.agentMigrations : this.skillMigrations;
    return migrations.some(migration => migration.appliesTo(data));
  }

  /**
   * Get available migrations for a type
   */
  getAvailableMigrations(type: 'agent' | 'skill'): Migration[] {
    return type === 'agent' ? [...this.agentMigrations] : [...this.skillMigrations];
  }

  /**
   * Validate migrated data
   */
  validateMigration(originalData: any, migratedData: any, type: 'agent' | 'skill'): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Check that core identity is preserved
    if (originalData.id !== migratedData.id) {
      errors.push({
        field: 'id',
        rule: 'migration-integrity',
        message: 'Migration must preserve entity ID',
        severity: 'error'
      });
    }

    if (originalData.name !== migratedData.name) {
      warnings.push({
        field: 'name',
        rule: 'migration-integrity',
        message: 'Entity name changed during migration',
        severity: 'warning'
      });
    }

    // Type-specific validation
    if (type === 'agent') {
      this.validateAgentMigration(originalData, migratedData, errors, warnings);
    } else {
      this.validateSkillMigration(originalData, migratedData, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos: []
    };
  }

  private migrate(data: any, migrations: Migration[], targetVersion: string): MigrationResult {
    const result: MigrationResult = {
      success: true,
      data: { ...data },
      warnings: [],
      errors: [],
      appliedMigrations: []
    };

    // Sort migrations by version
    const sortedMigrations = migrations
      .filter(migration => this.compareVersions(migration.version, targetVersion) <= 0)
      .sort((a, b) => this.compareVersions(a.version, b.version));

    for (const migration of sortedMigrations) {
      if (migration.appliesTo(result.data)) {
        try {
          result.data = migration.migrate(result.data);

          // Update version if not present
          if (!result.data.version) {
            result.data.version = migration.version;
          }

          result.appliedMigrations.push(migration.version);
        } catch (error) {
          result.success = false;
          result.errors.push(`Migration ${migration.version} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          break;
        }
      }
    }

    return result;
  }

  private initializeMigrations(): void {
    // Agent migrations
    this.agentMigrations = [
      {
        version: '1.1.0',
        description: 'Add createdAt and updatedAt timestamps',
        appliesTo: (data) => !data.createdAt || !data.updatedAt,
        migrate: (data) => ({
          ...data,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        })
      },
      {
        version: '1.2.0',
        description: 'Normalize personality traits to array format',
        appliesTo: (data) => data.personality && typeof data.personality.traits === 'string',
        migrate: (data) => ({
          ...data,
          personality: {
            ...data.personality,
            traits: data.personality.traits ? [data.personality.traits] : []
          }
        })
      },
      {
        version: '1.3.0',
        description: 'Add skillProficiencies mapping',
        appliesTo: (data) => !data.skillProficiencies,
        migrate: (data) => ({
          ...data,
          skillProficiencies: data.skills?.reduce((acc: any, skill: any) => {
            acc[skill.skillId] = skill.proficiency;
            return acc;
          }, {}) || {}
        })
      },
      {
        version: '1.4.0',
        description: 'Add configuration defaults',
        appliesTo: (data) => !data.configuration,
        migrate: (data) => ({
          ...data,
          configuration: {
            maxConcurrentTasks: 5,
            timeoutSettings: {
              taskTimeout: 300,
              skillTimeout: 60,
              responseTimeout: 30
            },
            retryPolicy: {
              maxRetries: 3,
              backoffStrategy: 'exponential',
              backoffMultiplier: 2
            },
            resourceLimits: {
              memoryLimit: 512,
              cpuLimit: 80,
              networkLimit: 1000
            },
            logging: {
              level: 'info',
              includeSensitiveData: false,
              retentionDays: 30
            }
          }
        })
      },
      {
        version: '1.5.0',
        description: 'Migrate legacy capability domains to expertise mapping',
        appliesTo: (data) => data.capabilities && !data.capabilities.expertise,
        migrate: (data) => ({
          ...data,
          capabilities: {
            ...data.capabilities,
            expertise: data.capabilities.domains?.reduce((acc: any, domain: string) => {
              acc[domain] = 5; // Default expertise level
              return acc;
            }, {}) || {}
          }
        })
      }
    ];

    // Skill migrations
    this.skillMigrations = [
      {
        version: '1.1.0',
        description: 'Add createdAt and updatedAt timestamps',
        appliesTo: (data) => !data.createdAt || !data.updatedAt,
        migrate: (data) => ({
          ...data,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        })
      },
      {
        version: '1.2.0',
        description: 'Normalize parameters and outputs to array format',
        appliesTo: (data) => !Array.isArray(data.parameters) || !Array.isArray(data.outputs),
        migrate: (data) => ({
          ...data,
          parameters: Array.isArray(data.parameters) ? data.parameters : [],
          outputs: Array.isArray(data.outputs) ? data.outputs : []
        })
      },
      {
        version: '1.3.0',
        description: 'Add implementation defaults',
        appliesTo: (data) => !data.implementation,
        migrate: (data) => ({
          ...data,
          implementation: {
            type: 'function',
            language: 'typescript',
            entryPoint: 'index.ts',
            runtime: 'node'
          }
        })
      },
      {
        version: '1.4.0',
        description: 'Add usage examples structure',
        appliesTo: (data) => !data.usage || !data.usage.examples,
        migrate: (data) => ({
          ...data,
          usage: {
            examples: data.usage?.examples || [],
            tutorials: data.usage?.tutorials || [],
            bestPractices: data.usage?.bestPractices || [],
            commonPatterns: data.usage?.commonPatterns || [],
            performance: data.usage?.performance || {
              averageExecutionTime: 100,
              memoryUsage: 50,
              successRate: 95
            }
          }
        })
      },
      {
        version: '1.5.0',
        description: 'Add compatibility restrictions field',
        appliesTo: (data) => data.compatibility && !data.compatibility.restrictions,
        migrate: (data) => ({
          ...data,
          compatibility: {
            ...data.compatibility,
            restrictions: data.compatibility.restrictions || []
          }
        })
      },
      {
        version: '1.6.0',
        description: 'Migrate legacy metadata fields',
        appliesTo: (data) => data.metadata && !data.metadata.maintainers,
        migrate: (data) => ({
          ...data,
          metadata: {
            ...data.metadata,
            maintainers: data.metadata.maintainers || [data.metadata.author].filter(Boolean),
            stability: data.metadata.stability || 'stable'
          }
        })
      }
    ];
  }

  private validateAgentMigration(original: any, migrated: any, errors: any[], warnings: any[]): void {
    // Check that skills structure is preserved
    if (original.skills && migrated.skills) {
      const originalSkillIds = new Set(original.skills.map((s: any) => s.skillId));
      const migratedSkillIds = new Set(migrated.skills.map((s: any) => s.skillId));

      if (originalSkillIds.size !== migratedSkillIds.size) {
        warnings.push({
          field: 'skills',
          rule: 'migration-integrity',
          message: 'Number of skills changed during migration',
          severity: 'warning'
        });
      }

      for (const skillId of originalSkillIds) {
        if (!migratedSkillIds.has(skillId)) {
          errors.push({
            field: 'skills',
            rule: 'migration-integrity',
            message: `Skill ${skillId} was lost during migration`,
            severity: 'error'
          });
        }
      }
    }

    // Check personality structure
    if (original.personality && migrated.personality) {
      const requiredFields = ['communicationStyle', 'decisionMaking', 'adaptability', 'creativity', 'empathy', 'humor'];
      for (const field of requiredFields) {
        if (!(field in migrated.personality)) {
          errors.push({
            field: `personality.${field}`,
            rule: 'migration-completeness',
            message: `Required personality field ${field} missing after migration`,
            severity: 'error'
          });
        }
      }
    }
  }

  private validateSkillMigration(original: any, migrated: any, errors: any[], warnings: any[]): void {
    // Check that dependencies are preserved
    if (original.dependencies && migrated.dependencies) {
      const originalDepIds = new Set(original.dependencies.map((d: any) => d.skillId));
      const migratedDepIds = new Set(migrated.dependencies.map((d: any) => d.skillId));

      if (originalDepIds.size !== migratedDepIds.size) {
        warnings.push({
          field: 'dependencies',
          rule: 'migration-integrity',
          message: 'Number of dependencies changed during migration',
          severity: 'warning'
        });
      }
    }

    // Check metadata structure
    if (original.metadata && migrated.metadata) {
      const requiredFields = ['author', 'license', 'repository', 'documentation', 'tags', 'category'];
      for (const field of requiredFields) {
        if (!(field in migrated.metadata)) {
          errors.push({
            field: `metadata.${field}`,
            rule: 'migration-completeness',
            message: `Required metadata field ${field} missing after migration`,
            severity: 'error'
          });
        }
      }
    }

    // Check implementation structure
    if (migrated.implementation) {
      const requiredFields = ['type', 'language', 'entryPoint', 'runtime'];
      for (const field of requiredFields) {
        if (!(field in migrated.implementation)) {
          errors.push({
            field: `implementation.${field}`,
            rule: 'migration-completeness',
            message: `Required implementation field ${field} missing after migration`,
            severity: 'error'
          });
        }
      }
    }
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }

    return 0;
  }
}

/**
 * Migration-aware file parser that automatically migrates data during parsing
 */
export class MigrationAwareFileParser {
  private migrationManager: SchemaMigrationManager;

  constructor() {
    this.migrationManager = new SchemaMigrationManager();
  }

  /**
   * Parse and migrate agent profile
   */
  async parseAgentFile(filePath: string): Promise<{ data: AgentProfile; migrationResult: MigrationResult }> {
    const parseResult = await import('./FileParser').then(m => m.FileParser.parseFile(filePath));

    if (!parseResult.success) {
      throw new Error(`Failed to parse file: ${parseResult.errors.map(e => e.message).join(', ')}`);
    }

    let data = parseResult.data!;
    let migrationResult: MigrationResult = {
      success: true,
      data,
      warnings: [],
      errors: [],
      appliedMigrations: []
    };

    // Apply migrations if needed
    if (this.migrationManager.needsMigration(data, 'agent')) {
      migrationResult = this.migrationManager.migrateAgent(data);

      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
      }

      data = migrationResult.data;

      // Validate migration
      const validation = this.migrationManager.validateMigration(parseResult.data!, data, 'agent');
      if (!validation.isValid) {
        throw new Error(`Migration validation failed: ${validation.errors.map((e: ValidationError) => e.message).join(', ')}`);
      }
    }

    return { data: data as AgentProfile, migrationResult };
  }

  /**
   * Parse and migrate skill definition
   */
  async parseSkillFile(filePath: string): Promise<{ data: SkillDefinition; migrationResult: MigrationResult }> {
    const parseResult = await import('./FileParser').then(m => m.FileParser.parseFile(filePath));

    if (!parseResult.success) {
      throw new Error(`Failed to parse file: ${parseResult.errors.map(e => e.message).join(', ')}`);
    }

    let data = parseResult.data!;
    let migrationResult: MigrationResult = {
      success: true,
      data,
      warnings: [],
      errors: [],
      appliedMigrations: []
    };

    // Apply migrations if needed
    if (this.migrationManager.needsMigration(data, 'skill')) {
      migrationResult = this.migrationManager.migrateSkill(data);

      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
      }

      data = migrationResult.data;

      // Validate migration
      const validation = this.migrationManager.validateMigration(parseResult.data!, data, 'skill');
      if (!validation.isValid) {
        throw new Error(`Migration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    return { data: data as SkillDefinition, migrationResult };
  }

  /**
   * Get migration manager for advanced operations
   */
  getMigrationManager(): SchemaMigrationManager {
    return this.migrationManager;
  }
}

/**
 * Migration utilities for batch operations
 */
export class MigrationUtils {
  /**
   * Migrate all files in a directory
   */
  static async migrateDirectory(
    directoryPath: string,
    type: 'agents' | 'skills',
    options: {
      dryRun?: boolean;
      backup?: boolean;
      verbose?: boolean;
    } = {}
  ): Promise<{
    migrated: number;
    skipped: number;
    errors: number;
    results: Array<{ file: string; success: boolean; migrations: string[]; error?: string }>;
  }> {
    const fs = await import('fs');
    const path = await import('path');

    const results: Array<{ file: string; success: boolean; migrations: string[]; error?: string }> = [];
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(directoryPath, file);

        try {
          const parser = new MigrationAwareFileParser();
          let migrationResult: MigrationResult;

          if (type === 'agents') {
            const result = await parser.parseAgentFile(filePath);
            migrationResult = result.migrationResult;
          } else {
            const result = await parser.parseSkillFile(filePath);
            migrationResult = result.migrationResult;
          }

          if (migrationResult.appliedMigrations.length > 0) {
            if (!options.dryRun) {
              // Write migrated data back to file
              const FileParser = await import('./FileParser');
              await FileParser.FileParser.writeFile(filePath, migrationResult.data);
            }

            migrated++;
            results.push({
              file,
              success: true,
              migrations: migrationResult.appliedMigrations
            });

            if (options.verbose) {
              console.log(`✓ Migrated ${file}: ${migrationResult.appliedMigrations.join(', ')}`);
            }
          } else {
            skipped++;
            results.push({
              file,
              success: true,
              migrations: []
            });
          }
        } catch (error) {
          errors++;
          results.push({
            file,
            success: false,
            migrations: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          if (options.verbose) {
            console.error(`✗ Failed to migrate ${file}: ${error}`);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to migrate directory: ${error}`);
    }

    return { migrated, skipped, errors, results };
  }

  /**
   * Create migration report
   */
  static generateMigrationReport(results: Array<{ file: string; success: boolean; migrations: string[]; error?: string }>): string {
    const report = [
      '# Migration Report',
      '',
      `Total files processed: ${results.length}`,
      `Successfully migrated: ${results.filter(r => r.success && r.migrations.length > 0).length}`,
      `Skipped (no migration needed): ${results.filter(r => r.success && r.migrations.length === 0).length}`,
      `Errors: ${results.filter(r => !r.success).length}`,
      '',
      '## Details',
      ''
    ];

    for (const result of results) {
      if (result.success) {
        if (result.migrations.length > 0) {
          report.push(`✓ ${result.file}: ${result.migrations.join(', ')}`);
        } else {
          report.push(`- ${result.file}: No migration needed`);
        }
      } else {
        report.push(`✗ ${result.file}: ${result.error}`);
      }
    }

    return report.join('\n');
  }
}