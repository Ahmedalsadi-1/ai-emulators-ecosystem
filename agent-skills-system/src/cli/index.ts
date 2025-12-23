#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  SystemConfiguration,
  AgentProfile,
  SkillDefinition,
  ProficiencyLevel
} from '../types';
import { AgentProfileManager } from '../core/AgentProfileManager';
import { SkillsRegistry } from '../core/SkillsRegistry';
import { AgentSkillsAssociationManager } from '../core/AgentSkillsAssociationManager';
import { ValidationEngine } from '../core/ValidationEngine';
import { FileParser } from '../core/FileParser';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// Global configuration
let config: SystemConfiguration = {
  basePath: process.cwd(),
  agentsPath: 'agents',
  skillsPath: 'skills',
  cacheEnabled: true,
  validationEnabled: true,
  autoSave: true,
  backupEnabled: true,
  maxConcurrentOperations: 10
};

// Initialize managers
let agentManager: AgentProfileManager;
let skillsRegistry: SkillsRegistry;
let associationManager: AgentSkillsAssociationManager;

/**
 * Initialize the system
 */
async function initializeSystem() {
  try {
    agentManager = new AgentProfileManager(config);
    await agentManager.initialize();

    skillsRegistry = new SkillsRegistry(config);
    await skillsRegistry.initialize();

    associationManager = new AgentSkillsAssociationManager(agentManager, skillsRegistry);
  } catch (error) {
    console.error(chalk.red('Failed to initialize system:'), error);
    process.exit(1);
  }
}

/**
 * Setup command - Initialize the agent skills system
 */
program
  .command('setup')
  .description('Initialize the Agent Skills System in the current directory')
  .option('-f, --force', 'Overwrite existing configuration')
  .option('-p, --path <path>', 'Base path for the system', process.cwd())
  .action(async (options) => {
    try {
      const basePath = options.path;
      const agentsPath = path.join(basePath, 'agents');
      const skillsPath = path.join(basePath, 'skills');

      // Check if directories already exist
      const agentsExists = fs.existsSync(agentsPath);
      const skillsExists = fs.existsSync(skillsPath);

      if ((agentsExists || skillsExists) && !options.force) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Directories already exist. Overwrite?',
          default: false
        }]);

        if (!confirm) {
          console.log(chalk.yellow('Setup cancelled.'));
          return;
        }
      }

      // Create directories
      fs.mkdirSync(agentsPath, { recursive: true });
      fs.mkdirSync(skillsPath, { recursive: true });

      // Create example agent
      const exampleAgent: AgentProfile = {
        id: 'example-agent',
        name: 'Example Agent',
        version: '1.0.0',
        personality: {
          communicationStyle: 'conversational',
          decisionMaking: 'analytical',
          adaptability: 7,
          creativity: 6,
          empathy: 8,
          humor: 3,
          traits: ['helpful', 'precise', 'adaptable']
        },
        capabilities: {
          domains: ['general', 'web-development'],
          expertise: { general: 5, 'web-development': 4 },
          limitations: ['Cannot access external APIs without proper authentication'],
          preferredTools: ['typescript', 'node'],
          languages: ['en']
        },
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
        },
        skills: [],
        skillProficiencies: {},
        metadata: {
          author: 'Agent Skills System',
          description: 'Example agent profile demonstrating the system capabilities',
          tags: ['example', 'assistant'],
          category: 'assistant',
          changelog: ['Initial example agent']
         },
         createdAt: new Date(),
         updatedAt: new Date()
       };

       // Create example skill
      const exampleSkill: SkillDefinition = {
        id: 'web-scraping',
        name: 'Web Scraping',
        version: '1.0.0',
        category: 'data-collection',
        description: 'Extract data from web pages using various techniques',
        dependencies: [],
        prerequisites: ['Basic programming knowledge'],
        compatibility: {
          platforms: ['node', 'python'],
          environments: ['development', 'production'],
          agentTypes: ['assistant', 'worker']
        },
        implementation: {
          type: 'function',
          language: 'typescript',
          entryPoint: 'index.ts',
          runtime: 'node'
        },
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'URL to scrape'
          },
          {
            name: 'selectors',
            type: 'object',
            required: false,
            description: 'CSS selectors for data extraction'
          }
        ],
        outputs: [
          {
            name: 'data',
            type: 'object',
            description: 'Extracted data',
            required: true
          }
        ],
        usage: {
          examples: [
            {
              title: 'Basic web scraping',
              description: 'Extract article content from a news website',
              parameters: { url: 'https://example.com/article' },
              expectedOutput: { title: 'Article Title', content: 'Article content...' },
              tags: ['basic', 'news']
            }
          ],
          tutorials: ['https://example.com/web-scraping-tutorial'],
          bestPractices: ['Respect robots.txt', 'Use reasonable request rates'],
          commonPatterns: ['Pagination handling', 'Error recovery'],
          performance: {
            averageExecutionTime: 2000,
            memoryUsage: 100,
            successRate: 95
          }
        },
        metadata: {
          author: 'Agent Skills System',
          maintainers: ['system@example.com'],
          license: 'MIT',
          repository: 'https://github.com/example/web-scraping-skill',
          documentation: 'https://docs.example.com/web-scraping',
          changelog: ['Initial web scraping skill'],
          tags: ['web', 'scraping', 'data'],
          category: 'data-collection',
          difficulty: 'intermediate',
          stability: 'stable'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

       // Save examples
       const agentPath = path.join(agentsPath, 'example-agent.md');
       const skillPath = path.join(skillsPath, 'web-scraping.md');

       await FileParser.writeDomainObject(agentPath, exampleAgent, '# Example Agent\n\nThis is an example agent profile.');
       await FileParser.writeDomainObject(skillPath, exampleSkill, '# Web Scraping Skill\n\nThis skill extracts data from web pages.');

      console.log(chalk.green('✓ Agent Skills System initialized successfully!'));
      console.log(chalk.blue('Created directories:'));
      console.log(`  - ${agentsPath}`);
      console.log(`  - ${skillsPath}`);
      console.log(chalk.blue('Created example files:'));
      console.log(`  - ${agentPath}`);
      console.log(`  - ${skillPath}`);

    } catch (error) {
      console.error(chalk.red('Setup failed:'), error);
      process.exit(1);
    }
  });

/**
 * Agent commands
 */
const agentCmd = program.command('agent').description('Agent management commands');

agentCmd
  .command('list')
  .description('List all agents')
  .action(async () => {
    await initializeSystem();
    try {
      const agents = await agentManager.listAgents();
      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found.'));
        return;
      }

      console.log(chalk.blue('Available agents:'));
      agents.forEach(agent => {
        console.log(`  ${chalk.green(agent.id)} - ${agent.name} (${agent.version})`);
      });
    } catch (error) {
      console.error(chalk.red('Failed to list agents:'), error);
    }
  });

agentCmd
  .command('create')
  .description('Create a new agent')
  .option('-i, --interactive', 'Interactive mode')
  .action(async (options) => {
    await initializeSystem();
    try {
      let agentData;

      if (options.interactive) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Agent name:',
            validate: (input) => input.length > 0
          },
          {
            type: 'input',
            name: 'id',
            message: 'Agent ID (leave empty to generate from name):'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:'
          },
          {
            type: 'list',
            name: 'category',
            message: 'Category:',
            choices: ['assistant', 'worker', 'specialist', 'manager']
          }
        ]);

        agentData = {
           name: answers.name,
           version: '1.0.0',
           personality: {
             communicationStyle: 'conversational' as const,
             decisionMaking: 'analytical' as const,
             adaptability: 7,
             creativity: 6,
             empathy: 8,
             humor: 3,
             traits: ['helpful', 'adaptable']
           },
           capabilities: {
             domains: [answers.category],
             expertise: { [answers.category]: 5 },
             limitations: [],
             preferredTools: [],
             languages: ['en']
           },
           configuration: {
             maxConcurrentTasks: 5,
             timeoutSettings: {
               taskTimeout: 300,
               skillTimeout: 60,
               responseTimeout: 30
             },
             retryPolicy: {
               maxRetries: 3,
               backoffStrategy: 'exponential' as const,
               backoffMultiplier: 2
             },
             resourceLimits: {
               memoryLimit: 512,
               cpuLimit: 80,
               networkLimit: 1000
             },
             logging: {
               level: 'info' as const,
               includeSensitiveData: false,
               retentionDays: 30
             }
           },
           skills: [],
           skillProficiencies: {},
           metadata: {
             author: 'CLI User',
             description: answers.description,
             tags: [answers.category],
             category: answers.category,
             changelog: ['Created via CLI']
           }
         };
      } else {
        console.log(chalk.red('Use --interactive flag for now.'));
        return;
      }

      const agent = await agentManager.createAgent(agentData);
      console.log(chalk.green(`✓ Agent "${agent.name}" created successfully!`));
      console.log(`  ID: ${agent.id}`);
      console.log(`  File: ${path.join(config.agentsPath, `${agent.id}.md`)}`);

    } catch (error) {
      console.error(chalk.red('Failed to create agent:'), error);
    }
  });

agentCmd
  .command('show <id>')
  .description('Show agent details')
  .action(async (id) => {
    await initializeSystem();
    try {
      const agent = await agentManager.loadAgent(id, true);
      console.log(chalk.blue(`Agent: ${agent.name} (${agent.id})`));
      console.log(`Version: ${agent.version}`);
      console.log(`Category: ${agent.metadata.category}`);
      console.log(`Skills: ${agent.skills.length}`);
      console.log(`Description: ${agent.metadata.description}`);
    } catch (error) {
      console.error(chalk.red(`Failed to load agent ${id}:`), error);
    }
  });

/**
 * Skill commands
 */
const skillCmd = program.command('skill').description('Skill management commands');

skillCmd
  .command('list')
  .description('List all skills')
  .option('-c, --category <category>', 'Filter by category')
  .option('-d, --difficulty <level>', 'Filter by difficulty')
  .action(async (options) => {
    await initializeSystem();
    try {
      const skills = await skillsRegistry.listSkills();
      let filteredSkills = skills;

      if (options.category) {
        filteredSkills = filteredSkills.filter(s => s.category === options.category);
      }

      if (options.difficulty) {
        // This would require loading full skill details
        console.log(chalk.yellow('Difficulty filtering requires full skill loading - use search command instead.'));
      }

      if (filteredSkills.length === 0) {
        console.log(chalk.yellow('No skills found.'));
        return;
      }

      console.log(chalk.blue('Available skills:'));
      filteredSkills.forEach(skill => {
        console.log(`  ${chalk.green(skill.id)} - ${skill.name} (${skill.version}) [${skill.category}]`);
      });
    } catch (error) {
      console.error(chalk.red('Failed to list skills:'), error);
    }
  });

skillCmd
  .command('create')
  .description('Create a new skill')
  .option('-i, --interactive', 'Interactive mode')
  .action(async (options) => {
    await initializeSystem();
    try {
      if (!options.interactive) {
        console.log(chalk.red('Use --interactive flag for now.'));
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Skill name:',
          validate: (input) => input.length > 0
        },
        {
          type: 'input',
          name: 'id',
          message: 'Skill ID (leave empty to generate from name):'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:'
        },
        {
          type: 'list',
          name: 'category',
          message: 'Category:',
          choices: ['utility', 'data-collection', 'analysis', 'automation', 'communication']
        },
        {
          type: 'list',
          name: 'difficulty',
          message: 'Difficulty:',
          choices: ['beginner', 'intermediate', 'advanced', 'expert']
        }
      ]);

       const skillData = {
         name: answers.name,
         version: '1.0.0',
        category: answers.category,
        description: answers.description,
        dependencies: [],
        prerequisites: [],
        compatibility: {
          platforms: ['node'],
          environments: ['development', 'production'],
          agentTypes: ['assistant']
        },
        implementation: {
          type: 'function' as const,
          language: 'typescript',
          entryPoint: 'index.ts',
          runtime: 'node'
        },
        parameters: [],
        outputs: [],
        usage: {
          examples: [],
          tutorials: [],
          bestPractices: [],
          commonPatterns: [],
          performance: {
            averageExecutionTime: 100,
            memoryUsage: 50,
            successRate: 95
          }
        },
        metadata: {
          author: 'CLI User',
          maintainers: ['CLI User'],
          license: 'MIT',
          repository: '',
          documentation: '',
          changelog: ['Created via CLI'],
          tags: [answers.category],
          category: answers.category,
          difficulty: answers.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert',
          stability: 'experimental' as const
        }
      };



      const skill = await skillsRegistry.createSkill(skillData);
      console.log(chalk.green(`✓ Skill "${skill.name}" created successfully!`));
      console.log(`  ID: ${skill.id}`);
      console.log(`  File: ${path.join(config.skillsPath, `${skill.id}.md`)}`);

    } catch (error) {
      console.error(chalk.red('Failed to create skill:'), error);
    }
  });

/**
 * Association commands
 */
const assignCmd = program.command('assign').description('Skill assignment commands');

assignCmd
  .command('skill <agentId> <skillId>')
  .description('Assign a skill to an agent')
  .option('-p, --proficiency <level>', 'Proficiency level (1-6)', '3')
  .option('-f, --force', 'Force assignment ignoring compatibility')
  .action(async (agentId, skillId, options) => {
    await initializeSystem();
    try {
      const proficiency = parseInt(options.proficiency) as ProficiencyLevel;
      const result = await associationManager.assignSkillToAgent(agentId, skillId, {
        proficiency,
        force: options.force
      });

      if (result.success) {
        console.log(chalk.green(`✓ Skill "${skillId}" assigned to agent "${agentId}"`));
        if (result.dependenciesAssigned && result.dependenciesAssigned > 0) {
          console.log(`  Also assigned ${result.dependenciesAssigned} dependencies`);
        }
      } else {
        console.error(chalk.red(`✗ Failed to assign skill: ${result.error}`));
        if (!result.compatibility.compatible) {
          console.log('  Compatibility issues:');
          result.compatibility.reasons.forEach(reason => {
            console.log(`    - ${reason}`);
          });
        }
      }
    } catch (error) {
      console.error(chalk.red('Failed to assign skill:'), error);
    }
  });

assignCmd
  .command('remove <agentId> <skillId>')
  .description('Remove a skill from an agent')
  .option('-c, --cascade', 'Remove dependent skills as well')
  .option('-f, --force', 'Force removal')
  .action(async (agentId, skillId, options) => {
    await initializeSystem();
    try {
      const result = await associationManager.removeSkillFromAgent(agentId, skillId, {
        cascade: options.cascade,
        force: options.force
      });

      if (result.success) {
        console.log(chalk.green(`✓ Skill "${skillId}" removed from agent "${agentId}"`));
        if (result.dependentSkillsRemoved && result.dependentSkillsRemoved > 0) {
          console.log(`  Also removed ${result.dependentSkillsRemoved} dependent skills`);
        }
      } else {
        console.error(chalk.red(`✗ Failed to remove skill: ${result.error}`));
      }
    } catch (error) {
      console.error(chalk.red('Failed to remove skill:'), error);
    }
  });

assignCmd
  .command('status <agentId>')
  .description('Show agent skill assignment status')
  .action(async (agentId) => {
    await initializeSystem();
    try {
      const status = await associationManager.getAgentSkillStatus(agentId);

      console.log(chalk.blue(`Agent: ${status.agentName} (${status.agentId})`));
      console.log(`Total skills: ${status.totalSkills}`);

      if (status.skills.length === 0) {
        console.log(chalk.yellow('No skills assigned.'));
        return;
      }

      console.log('\nSkill Status:');
      status.skills.forEach(skill => {
        const proficiencyIcon = skill.proficiency.isAdequate ? '✓' : '⚠';
        const compatibilityIcon = skill.compatibility.compatible ? '✓' : '✗';
        const depsIcon = skill.dependenciesResolved ? '✓' : '✗';

        console.log(`  ${chalk.green(skill.skillId)} (${skill.name})`);
        console.log(`    Proficiency: ${skill.proficiency.current}/6 ${proficiencyIcon}`);
        console.log(`    Compatible: ${compatibilityIcon}`);
        console.log(`    Dependencies: ${depsIcon}`);
        if (skill.error) {
          console.log(`    ${chalk.red('Error:')} ${skill.error}`);
        }
      });

      console.log(`\nSummary:`);
      console.log(`  Adequate proficiency: ${status.summary.adequateProficiency}/${status.totalSkills}`);
      console.log(`  Compatible: ${status.summary.compatible}/${status.totalSkills}`);
      console.log(`  Dependencies resolved: ${status.summary.dependenciesResolved}/${status.totalSkills}`);

    } catch (error) {
      console.error(chalk.red(`Failed to get status for agent ${agentId}:`), error);
    }
  });

/**
 * Validation commands
 */
program
  .command('validate')
  .description('Validate agents and skills')
  .option('-a, --agents', 'Validate all agents')
  .option('-s, --skills', 'Validate all skills')
  .option('-d, --dependencies', 'Check for circular dependencies')
  .action(async (options) => {
    await initializeSystem();
    try {
      let hasErrors = false;

      if (options.agents) {
        console.log(chalk.blue('Validating agents...'));
        const agents = await agentManager.listAgents();

        for (const agent of agents) {
          try {
            const fullAgent = await agentManager.loadAgent(agent.id, true);
            const validation = await agentManager.validateAgent(fullAgent);

            if (!validation.isValid) {
              hasErrors = true;
              console.log(chalk.red(`✗ Agent ${agent.id}:`));
              validation.errors.forEach(error => {
                console.log(`    ${error.message}`);
              });
            } else {
              console.log(chalk.green(`✓ Agent ${agent.id} is valid`));
            }
          } catch (error) {
            hasErrors = true;
            console.log(chalk.red(`✗ Failed to validate agent ${agent.id}: ${error}`));
          }
        }
      }

      if (options.skills) {
        console.log(chalk.blue('Validating skills...'));
        const skills = await skillsRegistry.listSkills();

        for (const skill of skills) {
          try {
            const fullSkill = await skillsRegistry.loadSkill(skill.id, true);
            const validation = await skillsRegistry.validateSkill(fullSkill);

            if (!validation.isValid) {
              hasErrors = true;
              console.log(chalk.red(`✗ Skill ${skill.id}:`));
              validation.errors.forEach(error => {
                console.log(`    ${error.message}`);
              });
            } else {
              console.log(chalk.green(`✓ Skill ${skill.id} is valid`));
            }
          } catch (error) {
            hasErrors = true;
            console.log(chalk.red(`✗ Failed to validate skill ${skill.id}: ${error}`));
          }
        }
      }

      if (options.dependencies) {
        console.log(chalk.blue('Checking for circular dependencies...'));
        const depValidation = await skillsRegistry.detectCircularDependencies();

        if (!depValidation.isValid) {
          hasErrors = true;
          console.log(chalk.red('✗ Circular dependencies found:'));
          depValidation.errors.forEach(error => {
            console.log(`    ${error.message}`);
          });
        } else {
          console.log(chalk.green('✓ No circular dependencies detected'));
        }
      }

      if (!hasErrors) {
        console.log(chalk.green('\n✓ All validations passed!'));
      } else {
        console.log(chalk.red('\n✗ Some validations failed.'));
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('Validation failed:'), error);
      process.exit(1);
    }
  });

/**
 * Report commands
 */
program
  .command('report')
  .description('Generate reports')
  .option('-s, --stats', 'Show system statistics')
  .action(async (options) => {
    await initializeSystem();
    try {
      if (options.stats) {
        console.log(chalk.blue('System Statistics\n'));

        // Agent stats
        const agents = await agentManager.listAgents();
        console.log(`Agents: ${agents.length}`);

        // Skill stats
        const skills = await skillsRegistry.listSkills();
        const skillStats = skillsRegistry.getSkillStats();
        console.log(`Skills: ${skills.length}`);
        console.log(`  By category: ${JSON.stringify(skillStats.byCategory, null, 2)}`);
        console.log(`  By difficulty: ${JSON.stringify(skillStats.byDifficulty, null, 2)}`);
        console.log(`  By stability: ${JSON.stringify(skillStats.byStability, null, 2)}`);

        // Assignment stats (simplified)
        let totalAssignments = 0;
        for (const agent of agents.slice(0, 5)) { // Sample first 5 agents
          try {
            const skills = await agentManager.getAgentSkills(agent.id);
            totalAssignments += skills.length;
          } catch (error) {
            // Skip
          }
        }
        console.log(`Skill assignments (sampled): ${totalAssignments}`);
      }
    } catch (error) {
      console.error(chalk.red('Failed to generate report:'), error);
    }
  });

// Error handling
program.on('command:*', (unknownCommand) => {
  console.error(chalk.red(`Unknown command: ${unknownCommand[0]}`));
  console.log('Run with --help to see available commands.');
  process.exit(1);
});

// Default action
program.action(() => {
  program.help();
});

// Parse command line
program.parse(process.argv);