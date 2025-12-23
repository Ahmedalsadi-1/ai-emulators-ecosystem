# Agent Skills System

A comprehensive system for managing AI agent profiles and skills through structured Markdown files with YAML frontmatter. The system provides progressive disclosure, dependency resolution, compatibility checking, and robust CLI tools.

## Build/Lint/Test Commands

```bash
# Installation
npm install

# Build system
npm run build

# Run tests
npm run test
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Development server
npm run dev

# CLI operations
npm run cli setup
npm run cli agent create --interactive
npm run cli skill create --interactive
npm run cli assign skill <agent-id> <skill-id>
npm run cli validate --agents --skills --dependencies
```

## Code Style Guidelines

### TypeScript/JavaScript
```typescript
// Use specific imports - no wildcards
import { 
  AgentProfileManager, 
  SkillsRegistry, 
  AgentSkillsAssociationManager 
} from './core';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

// Interfaces: PascalCase with descriptive names
export interface AgentProfile {
  id: string;
  name: string;
  personality: AgentPersonality;
  capabilities: AgentCapabilities;
  configuration: AgentConfiguration;
  skills: AssignedSkill[];
  skillProficiencies: Record<string, number>;
  metadata: AgentMetadata;
}

// Classes: PascalCase with dependency injection
@Injectable()
export class AgentProfileManager {
  private readonly logger = new Logger(AgentProfileManager.name);
  
  constructor(
    private readonly fileParser: FileParser,
    private readonly validationEngine: ValidationEngine,
  ) {}
  
  async createAgent(profile: CreateAgentProfileDto): Promise<AgentProfile> {
    const validated = await this.validationEngine.validateAgentProfile(profile);
    const agent = await this.fileParser.saveAgentProfile(validated);
    this.logger.log(`Created agent: ${agent.id}`);
    return agent;
  }
}

// Error handling: Custom exceptions
export class SkillNotFoundException extends NotFoundException {
  constructor(skillId: string) {
    super(`Skill with ID ${skillId} not found`);
  }
}

// Zod schemas for validation
export const AgentPersonalitySchema = z.object({
  communicationStyle: z.enum(['technical', 'casual', 'formal']),
  decisionMaking: z.enum(['analytical', 'intuitive', 'collaborative']),
  adaptability: z.number().min(1).max(10),
  creativity: z.number().min(1).max(10),
  empathy: z.number().min(1).max(10),
  humor: z.number().min(1).max(10),
  traits: z.array(z.string()),
});
```

### File Naming & Structure
```
agents/           # Agent profile files (*.md)
├── web-developer-agent.md
├── data-analyst-agent.md
└── automation-agent.md

skills/           # Skill definition files (*.md)
├── frontend/
│   ├── react-development.md
│   └── vue-development.md
├── backend/
│   ├── nodejs-api.md
│   └── python-django.md
└── automation/
    ├── browser-automation.md
    └── data-scraping.md
```

### Testing Guidelines
```typescript
// Unit tests with comprehensive coverage
describe('AgentProfileManager', () => {
  let manager: AgentProfileManager;
  let mockFileParser: jest.Mocked<FileParser>;
  let mockValidationEngine: jest.Mocked<ValidationEngine>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AgentProfileManager,
        { provide: FileParser, useValue: mockFileParser },
        { provide: ValidationEngine, useValue: mockValidationEngine },
      ],
    }).compile();

    manager = module.get<AgentProfileManager>(AgentProfileManager);
  });

  describe('createAgent', () => {
    it('should create agent with valid profile', async () => {
      // Arrange
      const profile = createValidAgentProfile();
      mockValidationEngine.validateAgentProfile.mockResolvedValue(profile);
      mockFileParser.saveAgentProfile.mockResolvedValue({ ...profile, id: 'agent-1' });

      // Act
      const result = await manager.createAgent(profile);

      // Assert
      expect(result.id).toBe('agent-1');
      expect(mockValidationEngine.validateAgentProfile).toHaveBeenCalledWith(profile);
      expect(mockFileParser.saveAgentProfile).toHaveBeenCalledWith(profile);
    });

    it('should throw error for invalid profile', async () => {
      // Arrange
      const invalidProfile = { ...createValidAgentProfile(), name: '' };
      mockValidationEngine.validateAgentProfile.mockRejectedValue(
        new ValidationException('Name is required')
      );

      // Act & Assert
      await expect(manager.createAgent(invalidProfile)).rejects.toThrow(ValidationException);
    });
  });
});
```

## Features

- **Structured Markdown Files**: Agent profiles and skills stored as human-readable Markdown with YAML metadata
- **Progressive Disclosure**: Load only the information you need, when you need it
- **Dependency Resolution**: Automatic resolution of skill dependencies with circular reference detection
- **Compatibility Checking**: Ensure skills are compatible with agent capabilities
- **CLI Tools**: Complete command-line interface for all operations
- **Schema Migrations**: Backward compatibility and automatic schema evolution
- **Property-based Testing**: Comprehensive testing with fast-check for reliability
- **Validation Engine**: Robust validation with actionable error messages

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd agent-skills-system

# Install dependencies
npm install

# Build the system
npm run build

# Initialize a new system
npx agent-skills setup

# Or use the CLI directly
npm run cli setup
```

### Basic Usage

```bash
# Create your first agent
npx agent-skills agent create --interactive

# Create a skill
npx agent-skills skill create --interactive

# Assign a skill to an agent
npx agent-skills assign skill <agent-id> <skill-id>

# Check agent status
npx agent-skills assign status <agent-id>

# Validate the system
npx agent-skills validate --agents --skills --dependencies
```

## Architecture

### Core Components

1. **FileParser**: Handles YAML frontmatter extraction and Markdown processing
2. **ValidationEngine**: Comprehensive validation with Zod schemas and business rules
3. **AgentProfileManager**: Manages agent profiles with progressive disclosure
4. **SkillsRegistry**: Catalog of skills with dependency resolution and search
5. **AgentSkillsAssociationManager**: Robust skill assignment logic with compatibility checking
6. **SchemaMigrationManager**: Backward compatibility and schema evolution

### File Structure

```
your-project/
├── agents/           # Agent profile files (*.md)
├── skills/           # Skill definition files (*.md)
└── config/           # System configuration (optional)
```

### Agent Profile Format

```yaml
---
id: web-developer-agent
name: Web Developer Agent
version: 1.0.0
personality:
  communicationStyle: technical
  decisionMaking: analytical
  adaptability: 8
  creativity: 7
  empathy: 6
  humor: 2
  traits: [detail-oriented, problem-solver]
capabilities:
  domains: [web-development, javascript, react]
  expertise:
    web-development: 8
    javascript: 9
    react: 7
  limitations: [mobile-development, devops]
  preferredTools: [vscode, node, npm]
  languages: [en, js]
configuration:
  maxConcurrentTasks: 3
  timeoutSettings:
    taskTimeout: 600
    skillTimeout: 120
    responseTimeout: 60
  retryPolicy:
    maxRetries: 3
    backoffStrategy: exponential
    backoffMultiplier: 2
  resourceLimits:
    memoryLimit: 1024
    cpuLimit: 85
    networkLimit: 2000
  logging:
    level: info
    includeSensitiveData: false
    retentionDays: 30
skills:
  - skillId: javascript-coding
    proficiency: 5
    acquiredAt: 2024-01-15T00:00:00Z
    usageCount: 150
  - skillId: react-development
    proficiency: 4
    acquiredAt: 2024-02-01T00:00:00Z
    usageCount: 89
skillProficiencies:
  javascript-coding: 5
  react-development: 4
metadata:
  author: AI Development Team
  description: Specialized agent for web development tasks
  tags: [web, javascript, react, frontend]
  category: specialist
  changelog:
    - Initial agent profile
---

# Web Developer Agent

This agent specializes in web development using modern JavaScript frameworks and tools.

## Capabilities

- React application development
- JavaScript/TypeScript coding
- Modern web development practices
- Code review and optimization

## Preferred Workflow

1. Analyze requirements
2. Plan component architecture
3. Implement with TDD approach
4. Test and refactor
5. Document and deploy
```

### Skill Definition Format

```yaml
---
id: react-development
name: React Development
version: 1.0.0
category: frontend
subcategory: framework
description: Complete React application development with modern patterns
dependencies:
  - skillId: javascript-coding
    versionRange: ^1.0.0
    required: true
  - skillId: html-css
    versionRange: ^1.0.0
    required: false
prerequisites:
  - JavaScript fundamentals
  - Basic HTML/CSS knowledge
compatibility:
  platforms: [node, browser]
  environments: [development, production]
  agentTypes: [assistant, specialist]
  restrictions: [mobile-only-agents]
implementation:
  type: function
  language: typescript
  entryPoint: src/react-skill/index.ts
  runtime: node
  packageManager: npm
  buildCommands: [npm run build]
  testCommands: [npm test]
parameters:
  - name: componentSpec
    type: object
    required: true
    description: Component specification with props and behavior
  - name: styling
    type: string
    required: false
    defaultValue: css-modules
    description: Styling approach (css-modules, styled-components, tailwind)
outputs:
  - name: component
    type: file
    description: Generated React component
    required: true
  - name: tests
    type: file
    description: Component test file
    required: true
usage:
  examples:
    - title: Basic Component Creation
      description: Create a simple React component with TypeScript
      parameters:
        componentSpec:
          name: UserProfile
          props:
            - name: user
              type: User
              required: true
      expectedOutput:
        component: UserProfile.tsx
        tests: UserProfile.test.tsx
      tags: [basic, typescript, component]
  tutorials:
    - https://react.dev/learn
    - https://www.typescriptlang.org/docs/handbook/react.html
  bestPractices:
    - Use functional components with hooks
    - Implement proper TypeScript interfaces
    - Write comprehensive tests
    - Follow React performance best practices
  commonPatterns:
    - Component composition
    - Custom hooks for logic reuse
    - Context for state management
  performance:
    averageExecutionTime: 2500
    memoryUsage: 150
    successRate: 92
metadata:
  author: Frontend Team
  maintainers: [alice@example.com, bob@example.com]
  license: MIT
  repository: https://github.com/example/react-skill
  documentation: https://docs.example.com/react-skill
  changelog:
    - Initial React development skill
    - Added TypeScript support
    - Improved performance metrics
  tags: [react, typescript, frontend, component]
  category: frontend
  difficulty: intermediate
  stability: stable
---

# React Development Skill

This skill enables agents to develop React applications using modern patterns and best practices.

## Features

- Component generation with TypeScript
- Hook-based state management
- Testing integration
- Performance optimization
- Modern React patterns (hooks, context, etc.)

## Dependencies

- **javascript-coding**: Required for JavaScript/TypeScript implementation
- **html-css**: Optional but recommended for styling

## Usage Examples

### Basic Component

```typescript
// Input specification
{
  "componentSpec": {
    "name": "TodoItem",
    "props": [
      { "name": "todo", "type": "Todo", "required": true },
      { "name": "onToggle", "type": "() => void", "required": true }
    ]
  }
}
```

### Advanced Component with Custom Hooks

```typescript
// With custom hook integration
{
  "componentSpec": {
    "name": "DataFetcher",
    "hooks": ["useApi", "useLocalStorage"],
    "errorHandling": true
  }
}
```

## Implementation Details

The skill uses a modular architecture with:

1. **Parser**: AST-based component analysis
2. **Generator**: Template-driven code generation
3. **Validator**: TypeScript compilation checking
4. **Tester**: Automated test generation
5. **Optimizer**: Performance analysis and suggestions
```

## CLI Reference

### Setup Commands

```bash
# Initialize system in current directory
agent-skills setup

# Initialize with custom path
agent-skills setup --path ./my-agents

# Force overwrite existing files
agent-skills setup --force
```

### Agent Management

```bash
# List all agents
agent-skills agent list

# Create new agent interactively
agent-skills agent create --interactive

# Show agent details
agent-skills agent show <agent-id>

# Update agent (not implemented in basic CLI)
agent-skills agent update <agent-id>
```

### Skill Management

```bash
# List all skills
agent-skills skill list

# Filter skills by category
agent-skills skill list --category frontend

# Create new skill interactively
agent-skills skill create --interactive

# Search skills
agent-skills skill search --name "react" --difficulty intermediate
```

### Skill Assignment

```bash
# Assign skill to agent
agent-skills assign skill <agent-id> <skill-id> --proficiency 4

# Assign with force (ignore compatibility)
agent-skills assign skill <agent-id> <skill-id> --force

# Remove skill from agent
agent-skills assign remove <agent-id> <skill-id>

# Remove with cascade (remove dependent skills)
agent-skills assign remove <agent-id> <skill-id> --cascade

# Check agent skill status
agent-skills assign status <agent-id>
```

### Validation

```bash
# Validate all agents
agent-skills validate --agents

# Validate all skills
agent-skills validate --skills

# Check for circular dependencies
agent-skills validate --dependencies

# Validate everything
agent-skills validate --agents --skills --dependencies
```

### Reporting

```bash
# Generate system statistics
agent-skills report --stats
```

## API Usage

### Basic Usage

```typescript
import {
  AgentProfileManager,
  SkillsRegistry,
  AgentSkillsAssociationManager,
  SystemConfiguration
} from 'agent-skills-system';

// Configure system
const config: SystemConfiguration = {
  basePath: './my-project',
  agentsPath: 'agents',
  skillsPath: 'skills',
  cacheEnabled: true,
  validationEnabled: true
};

// Initialize managers
const agentManager = new AgentProfileManager(config);
await agentManager.initialize();

const skillsRegistry = new SkillsRegistry(config);
await skillsRegistry.initialize();

const associationManager = new AgentSkillsAssociationManager(
  agentManager,
  skillsRegistry
);
```

### Creating Agents and Skills

```typescript
// Create an agent
const agent = await agentManager.createAgent({
  name: 'Code Review Agent',
  personality: {
    communicationStyle: 'technical',
    decisionMaking: 'analytical',
    adaptability: 7,
    creativity: 5,
    empathy: 8,
    humor: 2,
    traits: ['thorough', 'patient', 'educational']
  },
  capabilities: {
    domains: ['code-review', 'javascript', 'typescript'],
    expertise: { 'code-review': 8, javascript: 7, typescript: 6 },
    limitations: ['design', 'ui-ux'],
    preferredTools: ['eslint', 'prettier', 'typescript'],
    languages: ['en']
  },
  configuration: {
    maxConcurrentTasks: 2,
    timeoutSettings: {
      taskTimeout: 900,
      skillTimeout: 180,
      responseTimeout: 90
    },
    retryPolicy: {
      maxRetries: 2,
      backoffStrategy: 'exponential',
      backoffMultiplier: 2
    },
    resourceLimits: {
      memoryLimit: 768,
      cpuLimit: 75,
      networkLimit: 1500
    },
    logging: {
      level: 'info',
      includeSensitiveData: false,
      retentionDays: 45
    }
  },
  skills: [],
  skillProficiencies: {},
  metadata: {
    author: 'Development Team',
    description: 'Specialized agent for code review and quality assurance',
    tags: ['code-review', 'quality', 'javascript', 'typescript'],
    category: 'specialist',
    changelog: ['Initial code review agent']
  }
});

// Create a skill
const skill = await skillsRegistry.createSkill({
  name: 'ESLint Integration',
  category: 'code-quality',
  description: 'Integrate ESLint for JavaScript/TypeScript code analysis',
  dependencies: [{
    skillId: 'javascript-coding',
    versionRange: '^1.0.0',
    required: true
  }],
  prerequisites: ['JavaScript development experience'],
  compatibility: {
    platforms: ['node'],
    environments: ['development'],
    agentTypes: ['assistant', 'specialist']
  },
  implementation: {
    type: 'function',
    language: 'typescript',
    entryPoint: 'src/eslint-skill/index.ts',
    runtime: 'node'
  },
  parameters: [{
    name: 'config',
    type: 'object',
    required: false,
    description: 'ESLint configuration options'
  }],
  outputs: [{
    name: 'results',
    type: 'object',
    description: 'Linting results with errors and warnings',
    required: true
  }],
  usage: {
    examples: [{
      title: 'Basic linting',
      description: 'Run ESLint on a JavaScript file',
      parameters: { config: { extends: ['eslint:recommended'] } },
      expectedOutput: { errors: [], warnings: [] },
      tags: ['basic', 'linting']
    }],
    tutorials: ['https://eslint.org/docs/user-guide/getting-started'],
    bestPractices: ['Use consistent rules', 'Configure for your project'],
    commonPatterns: ['Pre-commit hooks', 'CI/CD integration'],
    performance: {
      averageExecutionTime: 1500,
      memoryUsage: 80,
      successRate: 98
    }
  },
  metadata: {
    author: 'Quality Team',
    maintainers: ['quality@example.com'],
    license: 'MIT',
    repository: 'https://github.com/example/eslint-skill',
    documentation: 'https://docs.example.com/eslint-skill',
    changelog: ['Initial ESLint integration skill'],
    tags: ['eslint', 'linting', 'code-quality', 'javascript'],
    category: 'code-quality',
    difficulty: 'beginner',
    stability: 'stable'
  }
});
```

### Skill Assignment with Compatibility

```typescript
// Assign skill with compatibility checking
const assignmentResult = await associationManager.assignSkillToAgent(
  agent.id,
  skill.id,
  { proficiency: 4 }
);

if (assignmentResult.success) {
  console.log(`✓ Skill assigned successfully`);
  if (assignmentResult.dependenciesAssigned) {
    console.log(`  Also assigned ${assignmentResult.dependenciesAssigned} dependencies`);
  }
} else {
  console.error(`✗ Assignment failed: ${assignmentResult.error}`);
  if (!assignmentResult.compatibility.compatible) {
    console.log('Compatibility issues:');
    assignmentResult.compatibility.reasons.forEach(reason => {
      console.log(`  - ${reason}`);
    });
  }
}

// Check agent skill status
const status = await associationManager.getAgentSkillStatus(agent.id);
console.log(`Agent has ${status.totalSkills} skills assigned`);
console.log(`Skills with adequate proficiency: ${status.summary.adequateProficiency}`);
console.log(`Compatible skills: ${status.summary.compatible}`);
```

### Advanced Search and Filtering

```typescript
// Search skills with filters
const searchResults = await skillsRegistry.searchSkills({
  category: 'frontend',
  difficulty: 'intermediate',
  tags: ['react', 'typescript'],
  sortBy: 'name',
  sortOrder: 'asc',
  limit: 10
});

console.log(`Found ${searchResults.length} skills matching criteria`);

// Resolve dependencies
const dependencies = await skillsRegistry.resolveSkillDependencies(skill.id);
console.log(`Skill has ${dependencies.length} dependencies`);

// Check for circular dependencies
const circularDeps = await skillsRegistry.detectCircularDependencies();
if (!circularDeps.isValid) {
  console.error('Circular dependencies detected!');
  circularDeps.errors.forEach(error => {
    console.error(`  ${error.message}`);
  });
}
```

## Schema Migrations

The system supports automatic schema migrations for backward compatibility:

```typescript
import { MigrationAwareFileParser } from 'agent-skills-system';

// Parse file with automatic migration
const parser = new MigrationAwareFileParser();
const { data: agent, migrationResult } = await parser.parseAgentFile('./agents/old-agent.md');

if (migrationResult.appliedMigrations.length > 0) {
  console.log(`Applied migrations: ${migrationResult.appliedMigrations.join(', ')}`);
}
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run property-based tests only
npx jest property-based
```

## Contributing

1. Follow the established code style
2. Add comprehensive tests for new features
3. Update documentation
4. Ensure backward compatibility
5. Run the full test suite before submitting

## License

MIT License - see LICENSE file for details

## Changelog

### Version 1.0.0
- Initial release with core functionality
- Agent profile management
- Skills registry with dependency resolution
- CLI tools for all operations
- Comprehensive validation engine
- Property-based testing
- Schema migration support
- Markdown file format with YAML frontmatter