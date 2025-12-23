# Agent Skills System - Examples

This directory contains example agent profiles and skill definitions to help you get started with the Agent Skills System.

## Directory Structure

```
examples/
├── agents/           # Example agent profiles
│   ├── assistant.md      # General purpose assistant
│   ├── specialist.md     # Domain specialist
│   └── manager.md        # Team manager agent
├── skills/           # Example skill definitions
│   ├── coding.md         # Programming skills
│   ├── analysis.md       # Data analysis skills
│   └── communication.md  # Communication skills
└── workflows/        # Example workflows
    ├── code-review.md    # Code review workflow
    └── project-setup.md  # Project setup workflow
```

## Quick Setup

To use these examples in your project:

```bash
# Copy example files to your system
cp examples/agents/* ./agents/
cp examples/skills/* ./skills/

# Validate the examples
agent-skills validate --agents --skills --dependencies

# Assign skills to agents
agent-skills assign skill assistant coding
agent-skills assign skill specialist analysis
```

## Example Agent Profiles

### General Assistant (`assistant.md`)

A versatile agent capable of handling various tasks across multiple domains.

**Key Features:**
- Broad domain knowledge
- High adaptability
- Balanced personality traits
- General-purpose tools

**Assigned Skills:**
- Basic coding
- Communication
- Task management

### Domain Specialist (`specialist.md`)

An expert agent focused on specific technical domains with deep expertise.

**Key Features:**
- Deep technical knowledge
- Specialized tools
- High proficiency in core skills
- Limited but focused capabilities

**Assigned Skills:**
- Advanced coding
- Data analysis
- Technical writing

### Team Manager (`manager.md`)

A leadership agent designed for coordinating teams and managing projects.

**Key Features:**
- Strong communication skills
- Project management expertise
- Team coordination abilities
- Strategic decision making

**Assigned Skills:**
- Team coordination
- Project planning
- Performance monitoring

## Example Skill Definitions

### Coding Skill (`coding.md`)

Comprehensive programming skill covering multiple languages and paradigms.

**Features:**
- Multi-language support
- Code generation
- Debugging capabilities
- Best practice enforcement

### Analysis Skill (`analysis.md`)

Data analysis and processing capabilities for various data types.

**Features:**
- Statistical analysis
- Data visualization
- Pattern recognition
- Report generation

### Communication Skill (`communication.md`)

Advanced communication capabilities for various contexts.

**Features:**
- Multi-language support
- Context awareness
- Tone adaptation
- Format conversion

## Example Workflows

### Code Review Workflow

A complete workflow for performing code reviews:

1. **Preparation**: Load project context and coding standards
2. **Analysis**: Examine code for bugs, style issues, and improvements
3. **Feedback**: Generate constructive feedback with specific recommendations
4. **Summary**: Provide overall assessment and approval decision

### Project Setup Workflow

Automated project initialization and setup:

1. **Requirements Analysis**: Understand project needs and constraints
2. **Structure Planning**: Design appropriate project architecture
3. **File Generation**: Create initial project files and configuration
4. **Tool Setup**: Configure development tools and CI/CD pipelines

## Customization Examples

### Creating a Custom Agent

```bash
# Create a new agent interactively
agent-skills agent create --interactive

# Or create programmatically
cat > ./agents/custom-agent.md << 'EOF'
---
id: custom-agent
name: Custom Agent
version: 1.0.0
personality:
  communicationStyle: conversational
  decisionMaking: collaborative
  adaptability: 9
  creativity: 8
  empathy: 9
  humor: 6
  traits: [innovative, collaborative, adaptive]
capabilities:
  domains: [innovation, collaboration, problem-solving]
  expertise:
    innovation: 9
    collaboration: 8
    'problem-solving': 9
  limitations: [highly-specialized-technical-work]
  preferredTools: [slack, miro, notion]
  languages: [en, es, fr]
configuration:
  maxConcurrentTasks: 5
  timeoutSettings:
    taskTimeout: 480
    skillTimeout: 120
    responseTimeout: 45
  retryPolicy:
    maxRetries: 3
    backoffStrategy: exponential
    backoffMultiplier: 2
  resourceLimits:
    memoryLimit: 2048
    cpuLimit: 90
    networkLimit: 5000
  logging:
    level: debug
    includeSensitiveData: false
    retentionDays: 60
skills: []
skillProficiencies: {}
metadata:
  author: Your Name
  description: Custom agent for innovative problem solving
  tags: [innovation, collaboration, creativity]
  category: specialist
  changelog: [Initial custom agent]
---

# Custom Agent

A specialized agent for innovative problem solving and collaboration.
EOF
```

### Creating a Custom Skill

```bash
# Create a new skill interactively
agent-skills skill create --interactive

# Or create from template
agent-skills skill create --template
```

### Advanced Skill Assignment

```bash
# Assign with specific proficiency
agent-skills assign skill custom-agent innovation-skill --proficiency 5

# Bulk assign multiple skills
# (Note: This would require extending the CLI)
echo "Bulk assignment not yet implemented in CLI"
echo "Use the API for bulk operations"

# Check compatibility before assignment
agent-skills validate
```

## Testing Examples

### Validation Testing

```bash
# Validate all components
agent-skills validate --agents --skills --dependencies

# Expected output:
# ✓ Agent assistant is valid
# ✓ Agent specialist is valid
# ✓ Agent manager is valid
# ✓ Skill coding is valid
# ✓ Skill analysis is valid
# ✓ Skill communication is valid
# ✓ No circular dependencies detected
```

### Status Checking

```bash
# Check agent skill status
agent-skills assign status assistant

# Expected output:
# Agent: General Assistant (assistant)
# Total skills: 3
#
# Skill Status:
#   ✓ coding (Basic Coding)
#     Proficiency: 4/6 ✓
#     Compatible: ✓
#     Dependencies: ✓
#
# Summary:
#   Adequate proficiency: 3/3
#   Compatible: 3/3
#   Dependencies resolved: 3/3
```

## Integration Examples

### CI/CD Integration

```yaml
# .github/workflows/validate-agents.yml
name: Validate Agent Skills
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run cli validate --agents --skills --dependencies
```

### API Integration

```typescript
// integration.ts
import {
  AgentProfileManager,
  SkillsRegistry,
  AgentSkillsAssociationManager
} from 'agent-skills-system';

export class AgentSkillsIntegration {
  private agentManager: AgentProfileManager;
  private skillsRegistry: SkillsRegistry;
  private associationManager: AgentSkillsAssociationManager;

  constructor(basePath: string) {
    // Initialize managers
    // ... implementation
  }

  async assignTaskToBestAgent(task: Task): Promise<AssignmentResult> {
    // Find agents with required skills
    const compatibleAgents = await this.findCompatibleAgents(task.requirements);

    // Select best agent based on proficiency and availability
    const bestAgent = this.selectBestAgent(compatibleAgents, task);

    // Assign task
    return await this.assignTask(bestAgent, task);
  }

  private async findCompatibleAgents(requirements: SkillRequirement[]): Promise<AgentProfile[]> {
    // Implementation
    return [];
  }

  private selectBestAgent(agents: AgentProfile[], task: Task): AgentProfile {
    // Implementation
    return agents[0];
  }

  private async assignTask(agent: AgentProfile, task: Task): Promise<AssignmentResult> {
    // Implementation
    return { success: true };
  }
}
```

## Troubleshooting

### Common Issues

1. **Validation Errors**
   ```bash
   # Check specific validation errors
   agent-skills validate --verbose
   ```

2. **Dependency Issues**
   ```bash
   # Check dependency graph
   agent-skills validate --dependencies
   ```

3. **Skill Assignment Problems**
   ```bash
   # Check compatibility
   agent-skills assign status <agent-id>
   ```

### Performance Tips

1. **Enable Caching**: Keep `cacheEnabled: true` for better performance
2. **Progressive Loading**: Only load what you need
3. **Batch Operations**: Use bulk assignment for multiple skills
4. **Regular Validation**: Run validation checks regularly

### Migration Examples

If you have old agent/skill files:

```bash
# The system automatically migrates during loading
# Check migration results in logs
agent-skills validate --verbose
```

## Contributing Examples

When adding new examples:

1. Follow the established naming conventions
2. Include comprehensive metadata
3. Add usage examples and documentation
4. Test with the validation system
5. Update this README

## Support

For issues or questions:

1. Check the main README.md
2. Run validation: `agent-skills validate`
3. Check logs for detailed error messages
4. Review the examples in this directory