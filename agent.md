# Agent System

## Overview

The agent system is the core intelligence layer of the Future App platform, providing autonomous AI-driven capabilities across multiple domains including device management, workflow orchestration, and user interaction.

## Development Commands

```bash
# Install dependencies
cd ./agent-manager && npm install
cd ./agent-skills-system && npm install

# Build agent system
cd ./agent-manager && npm run build
cd ./agent-skills-system && npm run build

# Run tests
cd ./agent-manager && npm run test
cd ./agent-skills-system && npm run test

# Development servers
cd ./agent-manager && npm run start:dev
cd ./agent-skills-system && npm run dev

# CLI operations
npx agent-skills setup
npx agent-skills agent create --interactive
npx agent-skills skill create --interactive
npx agent-skills assign skill <agent-id> <skill-id>
npx agent-skills validate --agents --skills --dependencies
```

## Code Style

### TypeScript/JavaScript
```typescript
// Use specific imports - no wildcards
import { AgentProfileManager, SkillsRegistry } from 'agent-skills-system';
import { Logger } from '@nestjs/common';

// Classes: PascalCase with descriptive names
class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  
  constructor(private readonly skillsRegistry: SkillsRegistry) {}
}

// Functions: camelCase with async/await
async function executeAgentTask(agentId: string, task: AgentTask): Promise<TaskResult> {
  const agent = await this.agentManager.findById(agentId);
  return await this.skillsRegistry.executeTask(agent, task);
}

// Error handling: Custom exceptions
export class AgentNotFoundError extends NotFoundException {
  constructor(agentId: string) {
    super(`Agent with ID ${agentId} not found`);
  }
}

// Interfaces: PascalCase with 'I' prefix
interface IAgentExecutor {
  execute(task: AgentTask): Promise<TaskResult>;
  validate(task: AgentTask): ValidationResult;
}
```

### Agent Configuration
```yaml
# agent-profile.md format
---
id: web-automation-agent
name: Web Automation Agent
version: 1.0.0
personality:
  communicationStyle: technical
  decisionMaking: analytical
  adaptability: 8
  creativity: 6
  empathy: 5
  traits: [detail-oriented, efficient]
capabilities:
  domains: [web-automation, browser-control, data-extraction]
  expertise:
    web-automation: 9
    browser-control: 8
    data-extraction: 7
  limitations: [mobile-automation, native-apps]
  preferredTools: [playwright, puppeteer, selenium]
  languages: [en, javascript]
configuration:
  maxConcurrentTasks: 5
  timeoutSettings:
    taskTimeout: 300
    skillTimeout: 60
    responseTimeout: 30
  retryPolicy:
    maxRetries: 3
    backoffStrategy: exponential
    backoffMultiplier: 2
  resourceLimits:
    memoryLimit: 2048
    cpuLimit: 80
    networkLimit: 5000
skills:
  - skillId: browser-automation
    proficiency: 5
    acquiredAt: 2024-01-15T00:00:00Z
    usageCount: 250
---
```

### Skill Development
```typescript
// Skill implementation with proper types
export interface SkillExecution {
  execute(params: SkillParameters): Promise<SkillResult>;
  validate(params: SkillParameters): ValidationResult;
  getMetadata(): SkillMetadata;
}

@Injectable()
export class BrowserAutomationSkill implements SkillExecution {
  private readonly logger = new Logger(BrowserAutomationSkill.name);
  
  constructor(
    @Inject('BROWSER_SERVICE') private readonly browser: BrowserService,
  ) {}
  
  async execute(params: BrowserAutomationParams): Promise<SkillResult> {
    try {
      this.logger.log(`Executing browser automation: ${params.action}`);
      const result = await this.browser.executeAction(params.action, params.options);
      return { success: true, data: result, executionTime: Date.now() };
    } catch (error) {
      this.logger.error(`Browser automation failed:`, error);
      throw new SkillExecutionException('Browser automation failed', error);
    }
  }
}
```

## Architecture

### Core Components

- **Orchestrator Service**: Central coordination hub that manages agent lifecycle, task distribution, and service registry
- **Service Registry**: Dynamic discovery and registration of available services and capabilities
- **Agent Skills Manager**: Manages the acquisition, training, and deployment of agent skills
- **State Manager**: Maintains persistent state across agent sessions and operations

### Agent Types

1. **Execution Agents**: Handle direct command execution and system operations
2. **Analysis Agents**: Process data, generate insights, and provide recommendations
3. **Interaction Agents**: Manage user interfaces and communication channels
4. **Monitoring Agents**: Track system health, performance, and security

## Recent Bytebot Enhancements (December 2024)

### UI/UX Improvements
- **Typography Refinement**: Navigation font size optimized (text-xs with reduced padding) for better readability
- **Font Consistency**: BBH_Bartle font applied throughout navigation labels for professional appearance
- **Homepage Theme**: Redesigned with glass pill aesthetic matching app-wide visual language
- **Visual Hierarchy**: Improved gradient overlays and professional appearance

### Desktop Chat Functionality
- **Real Task Creation**: Desktop chat now properly creates executable tasks via startTask API
- **Error Handling**: Enhanced error handling for task creation failures
- **Task Routing**: Tasks successfully route and execute instead of displaying messages only

### Model Ecosystem Expansion
- **22 Comprehensive Models**: Full Ollama integration with local and cloud support
- **Local Models**: Llama 3.2, Qwen 2.5, CodeLlama, Gemma 2, LLaVA
- **Cloud Models**: GLM, MiniMax, Devstral, Qwen3, GPT-OSS, DeepSeek
- **Provider Support**: Updated BytebotAgentModel type to support 'opencode' and 'ollama' providers

### Technical Improvements
- **Async Patterns**: Proper async/await patterns for task creation
- **Type Safety**: Enhanced TypeScript types for model providers
- **Performance**: Maintained existing animations and effects
- **Verification**: All functionality tested and verified working

## Key Features

- **Autonomous Operation**: Agents can operate independently with minimal supervision
- **Skill-Based Architecture**: Modular skill system allowing dynamic capability expansion
- **Multi-Modal Communication**: Support for text, voice, and visual interactions
- **Distributed Processing**: Agents can coordinate across multiple services and devices
- **Learning and Adaptation**: Continuous improvement through experience and feedback

## Integration Points

- **Device Manager**: Physical and virtual device control
- **Workflow Engine**: Complex task orchestration and automation
- **Knowledge Base**: Access to domain-specific information and procedures
- **Security Framework**: Authentication, authorization, and audit capabilities

## Development

Agents are built using a modular architecture that supports:

- Plugin-based skill extension
- RESTful and WebSocket APIs
- Event-driven communication
- Containerized deployment
- Monitoring and logging integration

## Configuration

Agent behavior is controlled through:

- Environment-specific settings
- Skill configuration files
- Runtime parameters
- Policy and security rules
- Performance tuning options

## Notes for AI Agents

1. **Build shared packages first** before working on agent systems
2. **Use specific imports** - no wildcard imports
3. **Follow TypeScript strict mode** with explicit types
4. **Handle errors properly** with custom exception classes
5. **Write comprehensive tests** for agent logic and skill execution
6. **Use environment variables** - never hardcode secrets
7. **Follow naming conventions** consistently across agent code
8. **Monitor performance** of agent operations and skill execution
9. **Secure all agent communications** with proper authentication
10. **Log appropriately** with structured logging and correlation IDs