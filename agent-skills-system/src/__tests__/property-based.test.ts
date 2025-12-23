import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  AgentProfile,
  SkillDefinition,
  ProficiencyLevel,
  ValidationResult,
  SystemConfiguration,
  AgentSkill,
  SkillDependency
} from '../src/types';
import { FileParser } from '../src/core/FileParser';
import { ValidationEngine } from '../src/core/ValidationEngine';
import { AgentProfileManager } from '../src/core/AgentProfileManager';
import { SkillsRegistry } from '../src/core/SkillsRegistry';
import { AgentSkillsAssociationManager } from '../src/core/AgentSkillsAssociationManager';

// Test utilities
class TestEnvironment {
  private tempDir: string;
  private config: SystemConfiguration;

  constructor() {
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-skills-test-'));
    this.config = {
      basePath: this.tempDir,
      agentsPath: 'agents',
      skillsPath: 'skills',
      cacheEnabled: false,
      validationEnabled: true,
      autoSave: true,
      backupEnabled: false,
      maxConcurrentOperations: 1
    };
  }

  getConfig(): SystemConfiguration {
    return this.config;
  }

  getTempDir(): string {
    return this.tempDir;
  }

  async cleanup(): Promise<void> {
    try {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async initialize(): Promise<{
    agentManager: AgentProfileManager;
    skillsRegistry: SkillsRegistry;
    associationManager: AgentSkillsAssociationManager;
  }> {
    const agentManager = new AgentProfileManager(this.config);
    await agentManager.initialize();

    const skillsRegistry = new SkillsRegistry(this.config);
    await skillsRegistry.initialize();

    const associationManager = new AgentSkillsAssociationManager(agentManager, skillsRegistry);

    return { agentManager, skillsRegistry, associationManager };
  }
}

// Arbitrary generators for test data
const proficiencyLevelArb = fc.integer({ min: 1, max: 6 }).map(n => n as ProficiencyLevel);

const skillDependencyArb = fc.record({
  skillId: fc.string({ minLength: 1, maxLength: 20 }),
  versionRange: fc.oneof(
    fc.constant('^1.0.0'),
    fc.constant('>=2.0.0'),
    fc.constant('~1.2.0'),
    fc.constant('1.0.0')
  ),
  required: fc.boolean(),
  description: fc.option(fc.string({ maxLength: 100 }))
});

const agentSkillArb = fc.record({
  skillId: fc.string({ minLength: 1, maxLength: 20 }),
  proficiency: proficiencyLevelArb,
  acquiredAt: fc.date(),
  usageCount: fc.integer({ min: 0, max: 1000 }),
  context: fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })
});

const agentProfileArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  version: fc.constant('1.0.0'),
  personality: fc.record({
    communicationStyle: fc.oneof(
      fc.constant('formal'),
      fc.constant('casual'),
      fc.constant('technical'),
      fc.constant('conversational')
    ),
    decisionMaking: fc.oneof(
      fc.constant('analytical'),
      fc.constant('intuitive'),
      fc.constant('collaborative'),
      fc.constant('authoritative')
    ),
    adaptability: fc.integer({ min: 1, max: 10 }),
    creativity: fc.integer({ min: 1, max: 10 }),
    empathy: fc.integer({ min: 1, max: 10 }),
    humor: fc.integer({ min: 1, max: 10 }),
    traits: fc.array(fc.string({ maxLength: 20 }), { maxLength: 5 })
  }),
  capabilities: fc.record({
    domains: fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 5 }),
    expertise: fc.dictionary(fc.string({ maxLength: 20 }), fc.integer({ min: 1, max: 10 })),
    limitations: fc.array(fc.string({ maxLength: 50 }), { maxLength: 3 }),
    preferredTools: fc.array(fc.string({ maxLength: 20 }), { maxLength: 5 }),
    languages: fc.array(fc.string({ maxLength: 5 }), { minLength: 1, maxLength: 5 })
  }),
  configuration: fc.record({
    maxConcurrentTasks: fc.integer({ min: 1, max: 20 }),
    timeoutSettings: fc.record({
      taskTimeout: fc.integer({ min: 10, max: 1000 }),
      skillTimeout: fc.integer({ min: 5, max: 500 }),
      responseTimeout: fc.integer({ min: 5, max: 300 })
    }),
    retryPolicy: fc.record({
      maxRetries: fc.integer({ min: 0, max: 5 }),
      backoffStrategy: fc.oneof(fc.constant('linear'), fc.constant('exponential')),
      backoffMultiplier: fc.integer({ min: 1, max: 5 })
    }),
    resourceLimits: fc.record({
      memoryLimit: fc.integer({ min: 64, max: 4096 }),
      cpuLimit: fc.integer({ min: 10, max: 100 }),
      networkLimit: fc.integer({ min: 100, max: 10000 })
    }),
    logging: fc.record({
      level: fc.oneof(fc.constant('debug'), fc.constant('info'), fc.constant('warn'), fc.constant('error')),
      includeSensitiveData: fc.boolean(),
      retentionDays: fc.integer({ min: 1, max: 365 })
    })
  }),
  skills: fc.array(agentSkillArb, { maxLength: 10 }),
  skillProficiencies: fc.dictionary(fc.string({ maxLength: 20 }), proficiencyLevelArb),
  metadata: fc.record({
    author: fc.string({ minLength: 1, maxLength: 30 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    tags: fc.array(fc.string({ maxLength: 20 }), { maxLength: 5 }),
    category: fc.string({ minLength: 1, maxLength: 20 }),
    changelog: fc.array(fc.string({ maxLength: 50 }), { minLength: 1, maxLength: 5 })
  }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

const skillDefinitionArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  version: fc.constant('1.0.0'),
  category: fc.string({ minLength: 1, maxLength: 20 }),
  subcategory: fc.option(fc.string({ maxLength: 20 })),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  dependencies: fc.array(skillDependencyArb, { maxLength: 5 }),
  prerequisites: fc.array(fc.string({ maxLength: 50 }), { maxLength: 3 }),
  compatibility: fc.record({
    platforms: fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 3 }),
    environments: fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 3 }),
    agentTypes: fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 3 }),
    restrictions: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 2 }))
  }),
  implementation: fc.record({
    type: fc.oneof(fc.constant('function'), fc.constant('module'), fc.constant('service'), fc.constant('api')),
    language: fc.string({ minLength: 1, maxLength: 20 }),
    entryPoint: fc.string({ minLength: 1, maxLength: 50 }),
    runtime: fc.string({ minLength: 1, maxLength: 20 }),
    packageManager: fc.option(fc.string({ maxLength: 20 })),
    buildCommands: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 3 })),
    testCommands: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 3 }))
  }),
  parameters: fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    type: fc.oneof(fc.constant('string'), fc.constant('number'), fc.constant('boolean'), fc.constant('object'), fc.constant('array')),
    required: fc.boolean(),
    defaultValue: fc.option(fc.anything()),
    description: fc.string({ minLength: 1, maxLength: 100 }),
    validation: fc.option(fc.record({
      pattern: fc.option(fc.string({ maxLength: 50 })),
      min: fc.option(fc.integer({ min: 0, max: 1000 })),
      max: fc.option(fc.integer({ min: 0, max: 1000 })),
      enum: fc.option(fc.array(fc.anything(), { maxLength: 5 }))
    })),
    examples: fc.option(fc.array(fc.anything(), { maxLength: 3 }))
  }), { maxLength: 5 }),
  outputs: fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    type: fc.oneof(fc.constant('string'), fc.constant('number'), fc.constant('boolean'), fc.constant('object'), fc.constant('array'), fc.constant('file'), fc.constant('stream')),
    description: fc.string({ minLength: 1, maxLength: 100 }),
    required: fc.boolean(),
    schema: fc.option(fc.anything())
  }), { maxLength: 5 }),
  usage: fc.record({
    examples: fc.array(fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 1, maxLength: 100 }),
      parameters: fc.dictionary(fc.string({ maxLength: 20 }), fc.anything()),
      expectedOutput: fc.anything(),
      tags: fc.array(fc.string({ maxLength: 20 }), { maxLength: 3 })
    }), { maxLength: 3 }),
    tutorials: fc.array(fc.string({ maxLength: 100 }), { maxLength: 3 }),
    bestPractices: fc.array(fc.string({ maxLength: 100 }), { maxLength: 3 }),
    commonPatterns: fc.array(fc.string({ maxLength: 100 }), { maxLength: 3 }),
    performance: fc.record({
      averageExecutionTime: fc.integer({ min: 1, max: 10000 }),
      memoryUsage: fc.integer({ min: 1, max: 1000 }),
      successRate: fc.integer({ min: 0, max: 100 })
    })
  }),
  metadata: fc.record({
    author: fc.string({ minLength: 1, maxLength: 30 }),
    maintainers: fc.array(fc.string({ maxLength: 30 }), { minLength: 1, maxLength: 3 }),
    license: fc.string({ minLength: 1, maxLength: 20 }),
    repository: fc.string({ minLength: 1, maxLength: 100 }),
    documentation: fc.string({ minLength: 1, maxLength: 100 }),
    changelog: fc.array(fc.string({ maxLength: 50 }), { minLength: 1, maxLength: 5 }),
    tags: fc.array(fc.string({ maxLength: 20 }), { maxLength: 5 }),
    category: fc.string({ minLength: 1, maxLength: 20 }),
    difficulty: fc.oneof(fc.constant('beginner'), fc.constant('intermediate'), fc.constant('advanced'), fc.constant('expert')),
    stability: fc.oneof(fc.constant('experimental'), fc.constant('stable'), fc.constant('deprecated'))
  }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

// Property-based tests
describe('Agent Skills System - Property-based Tests', () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('File Generation and Parsing', () => {
    it('should round-trip agent profiles through file serialization', async () => {
      await fc.assert(
        fc.asyncProperty(agentProfileArb, async (agent) => {
          // Generate file content
          const serialized = FileParser.serialize(agent);

          // Parse it back
          const parsed = FileParser.parseContent(serialized);

          // Should parse successfully
          expect(parsed.success).toBe(true);
          expect(parsed.data).toBeDefined();

          // Core fields should match
          expect(parsed.data!.id).toBe(agent.id);
          expect(parsed.data!.name).toBe(agent.name);
          expect(parsed.data!.version).toBe(agent.version);
        })
      );
    });

    it('should round-trip skill definitions through file serialization', async () => {
      await fc.assert(
        fc.asyncProperty(skillDefinitionArb, async (skill) => {
          // Generate file content
          const serialized = FileParser.serialize(skill);

          // Parse it back
          const parsed = FileParser.parseContent(serialized);

          // Should parse successfully
          expect(parsed.success).toBe(true);
          expect(parsed.data).toBeDefined();

          // Core fields should match
          expect(parsed.data!.id).toBe(skill.id);
          expect(parsed.data!.name).toBe(skill.name);
          expect(parsed.data!.version).toBe(skill.version);
        })
      );
    });

    it('should handle malformed YAML gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (malformedYaml) => {
            // Try to parse malformed content
            const result = FileParser.parseContent(`---\n${malformedYaml}\n---\nContent`);

            // Should either succeed or fail gracefully with errors
            if (!result.success) {
              expect(result.errors).toBeDefined();
              expect(result.errors.length).toBeGreaterThan(0);
            }
          }
        )
      );
    });
  });

  describe('Validation Engine', () => {
    it('should validate well-formed agent profiles', async () => {
      await fc.assert(
        fc.asyncProperty(agentProfileArb, async (agent) => {
          const result = ValidationEngine.validateAgent(agent);

          // Should not crash
          expect(result).toBeDefined();
          expect(typeof result.isValid).toBe('boolean');
          expect(Array.isArray(result.errors)).toBe(true);
          expect(Array.isArray(result.warnings)).toBe(true);
          expect(Array.isArray(result.infos)).toBe(true);
        })
      );
    });

    it('should validate well-formed skill definitions', async () => {
      await fc.assert(
        fc.asyncProperty(skillDefinitionArb, async (skill) => {
          const result = ValidationEngine.validateSkill(skill);

          // Should not crash
          expect(result).toBeDefined();
          expect(typeof result.isValid).toBe('boolean');
          expect(Array.isArray(result.errors)).toBeDefined();
          expect(Array.isArray(result.warnings)).toBeDefined();
          expect(Array.isArray(result.infos)).toBeDefined();
        })
      );
    });

    it('should detect circular dependencies in skill graphs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(skillDefinitionArb, { minLength: 2, maxLength: 5 }),
          async (skills) => {
            // Create a map for validation
            const skillMap = new Map(skills.map(skill => [skill.id, skill]));

            const result = ValidationEngine.validateSkillDependencyGraph(skillMap);

            // Should not crash
            expect(result).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
          }
        )
      );
    });
  });

  describe('Agent-Skills Association', () => {
    it('should handle skill assignments without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(
          agentProfileArb,
          fc.array(skillDefinitionArb, { minLength: 1, maxLength: 3 }),
          fc.array(proficiencyLevelArb, { minLength: 1, maxLength: 3 }),
          async (agent, skills, proficiencies) => {
            const env = await testEnv.initialize();

            // Create agent
            await env.agentManager.createAgent({
              name: agent.name,
              version: agent.version,
              personality: agent.personality,
              capabilities: agent.capabilities,
              configuration: agent.configuration,
              skills: [],
              skillProficiencies: {},
              metadata: agent.metadata
            });

            // Create skills
            for (const skill of skills) {
              await env.skillsRegistry.createSkill({
                name: skill.name,
                version: skill.version,
                category: skill.category,
                description: skill.description,
                dependencies: skill.dependencies,
                prerequisites: skill.prerequisites,
                compatibility: skill.compatibility,
                implementation: skill.implementation,
                parameters: skill.parameters,
                outputs: skill.outputs,
                usage: skill.usage,
                metadata: skill.metadata
              });
            }

            // Try assignments
            for (let i = 0; i < Math.min(skills.length, proficiencies.length); i++) {
              const result = await env.associationManager.assignSkillToAgent(
                agent.id,
                skills[i].id,
                { proficiency: proficiencies[i] }
              );

              // Should not crash
              expect(result).toBeDefined();
              expect(typeof result.success).toBe('boolean');
            }
          }
        )
      );
    });

    it('should maintain consistency between skills and proficiencies', async () => {
      await fc.assert(
        fc.asyncProperty(
          agentProfileArb,
          skillDefinitionArb,
          proficiencyLevelArb,
          async (agent, skill, proficiency) => {
            const env = await testEnv.initialize();

            // Create agent and skill
            await env.agentManager.createAgent({
              name: agent.name,
              version: agent.version,
              personality: agent.personality,
              capabilities: agent.capabilities,
              configuration: agent.configuration,
              skills: [],
              skillProficiencies: {},
              metadata: agent.metadata
            });

            await env.skillsRegistry.createSkill({
              name: skill.name,
              version: skill.version,
              category: skill.category,
              description: skill.description,
              dependencies: skill.dependencies,
              prerequisites: skill.prerequisites,
              compatibility: skill.compatibility,
              implementation: skill.implementation,
              parameters: skill.parameters,
              outputs: skill.outputs,
              usage: skill.usage,
              metadata: skill.metadata
            });

            // Assign skill
            await env.associationManager.assignSkillToAgent(agent.id, skill.id, { proficiency });

            // Load agent and verify consistency
            const loadedAgent = await env.agentManager.loadAgent(agent.id, true);

            // Check that skill is in both arrays
            const hasSkill = loadedAgent.skills.some(s => s.skillId === skill.id);
            const hasProficiency = skill.id in loadedAgent.skillProficiencies;

            expect(hasSkill).toBe(hasProficiency);
          }
        )
      );
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve skill dependencies without infinite loops', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(skillDefinitionArb, { minLength: 1, maxLength: 5 }),
          async (skills) => {
            const env = await testEnv.initialize();

            // Create skills
            for (const skill of skills) {
              await env.skillsRegistry.createSkill({
                name: skill.name,
                version: skill.version,
                category: skill.category,
                description: skill.description,
                dependencies: skill.dependencies,
                prerequisites: skill.prerequisites,
                compatibility: skill.compatibility,
                implementation: skill.implementation,
                parameters: skill.parameters,
                outputs: skill.outputs,
                usage: skill.usage,
                metadata: skill.metadata
              });
            }

            // Try to resolve dependencies for each skill
            for (const skill of skills) {
              const resolved = await env.skillsRegistry.resolveSkillDependencies(skill.id);

              // Should not crash and return an array
              expect(Array.isArray(resolved)).toBe(true);
            }
          }
        )
      );
    });

    it('should detect circular dependencies', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(skillDefinitionArb, { minLength: 3, maxLength: 5 }),
          async (skills) => {
            const env = await testEnv.initialize();

            // Create skills with potential circular dependencies
            for (let i = 0; i < skills.length; i++) {
              const skill = skills[i];
              const deps = skills
                .filter((_, idx) => idx !== i)
                .slice(0, 2)
                .map(s => ({
                  skillId: s.id,
                  versionRange: '^1.0.0',
                  required: Math.random() > 0.5
                }));

              await env.skillsRegistry.createSkill({
                name: skill.name,
                version: skill.version,
                category: skill.category,
                description: skill.description,
                dependencies: deps,
                prerequisites: skill.prerequisites,
                compatibility: skill.compatibility,
                implementation: skill.implementation,
                parameters: skill.parameters,
                outputs: skill.outputs,
                usage: skill.usage,
                metadata: skill.metadata
              });
            }

            // Check for circular dependencies
            const result = await env.skillsRegistry.detectCircularDependencies();

            // Should not crash
            expect(result).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
          }
        )
      );
    });
  });

  describe('Search and Filtering', () => {
    it('should handle search queries without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(skillDefinitionArb, { minLength: 1, maxLength: 10 }),
          fc.string({ maxLength: 50 }),
          async (skills, query) => {
            const env = await testEnv.initialize();

            // Create skills
            for (const skill of skills) {
              await env.skillsRegistry.createSkill({
                name: skill.name,
                version: skill.version,
                category: skill.category,
                description: skill.description,
                dependencies: skill.dependencies,
                prerequisites: skill.prerequisites,
                compatibility: skill.compatibility,
                implementation: skill.implementation,
                parameters: skill.parameters,
                outputs: skill.outputs,
                usage: skill.usage,
                metadata: skill.metadata
              });
            }

            // Search with various filters
            const results = await env.skillsRegistry.searchSkills({
              name: query,
              limit: 10
            });

            // Should return an array
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeLessThanOrEqual(10);
          }
        )
      );
    });

    it('should respect pagination limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(skillDefinitionArb, { minLength: 5, maxLength: 20 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          async (skills, limit, offset) => {
            const env = await testEnv.initialize();

            // Create skills
            for (const skill of skills) {
              await env.skillsRegistry.createSkill({
                name: skill.name,
                version: skill.version,
                category: skill.category,
                description: skill.description,
                dependencies: skill.dependencies,
                prerequisites: skill.prerequisites,
                compatibility: skill.compatibility,
                implementation: skill.implementation,
                parameters: skill.parameters,
                outputs: skill.outputs,
                usage: skill.usage,
                metadata: skill.metadata
              });
            }

            // Search with pagination
            const results = await env.skillsRegistry.searchSkills({
              limit,
              offset
            });

            // Should respect limits
            expect(results.length).toBeLessThanOrEqual(limit);
          }
        )
      );
    });
  });

  describe('System Integrity', () => {
    it('should maintain file system consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(agentProfileArb, { minLength: 1, maxLength: 3 }),
          fc.array(skillDefinitionArb, { minLength: 1, maxLength: 3 }),
          async (agents, skills) => {
            const env = await testEnv.initialize();

            // Create agents and skills
            for (const agent of agents) {
              await env.agentManager.createAgent({
                name: agent.name,
                version: agent.version,
                personality: agent.personality,
                capabilities: agent.capabilities,
                configuration: agent.configuration,
                skills: [],
                skillProficiencies: {},
                metadata: agent.metadata
              });
            }

            for (const skill of skills) {
              await env.skillsRegistry.createSkill({
                name: skill.name,
                version: skill.version,
                category: skill.category,
                description: skill.description,
                dependencies: skill.dependencies,
                prerequisites: skill.prerequisites,
                compatibility: skill.compatibility,
                implementation: skill.implementation,
                parameters: skill.parameters,
                outputs: skill.outputs,
                usage: skill.usage,
                metadata: skill.metadata
              });
            }

            // Verify files exist
            const agentFiles = await env.agentManager.listAgents();
            const skillFiles = await env.skillsRegistry.listSkills();

            expect(agentFiles.length).toBe(agents.length);
            expect(skillFiles.length).toBe(skills.length);

            // Verify each file can be loaded
            for (const agentFile of agentFiles) {
              const agent = await env.agentManager.loadAgent(agentFile.id);
              expect(agent).toBeDefined();
              expect(agent.id).toBe(agentFile.id);
            }

            for (const skillFile of skillFiles) {
              const skill = await env.skillsRegistry.loadSkill(skillFile.id);
              expect(skill).toBeDefined();
              expect(skill.id).toBe(skillFile.id);
            }
          }
        )
      );
    });

    it('should handle concurrent operations safely', async () => {
      await fc.assert(
        fc.asyncProperty(
          agentProfileArb,
          fc.array(skillDefinitionArb, { minLength: 2, maxLength: 4 }),
          async (agent, skills) => {
            const env = await testEnv.initialize();

            // Create agent
            await env.agentManager.createAgent({
              name: agent.name,
              version: agent.version,
              personality: agent.personality,
              capabilities: agent.capabilities,
              configuration: agent.configuration,
              skills: [],
              skillProficiencies: {},
              metadata: agent.metadata
            });

            // Create skills concurrently
            await Promise.all(skills.map(skill =>
              env.skillsRegistry.createSkill({
                name: skill.name,
                version: skill.version,
                category: skill.category,
                description: skill.description,
                dependencies: skill.dependencies,
                prerequisites: skill.prerequisites,
                compatibility: skill.compatibility,
                implementation: skill.implementation,
                parameters: skill.parameters,
                outputs: skill.outputs,
                usage: skill.usage,
                metadata: skill.metadata
              })
            ));

            // Assign skills concurrently
            await Promise.all(skills.map(skill =>
              env.associationManager.assignSkillToAgent(agent.id, skill.id, { proficiency: 3 })
            ));

            // Verify final state
            const loadedAgent = await env.agentManager.loadAgent(agent.id, true);
            expect(loadedAgent.skills.length).toBe(skills.length);
          }
        )
      );
    });
  });
});