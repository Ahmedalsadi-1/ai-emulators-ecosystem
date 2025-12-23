# Unified Agent Manager

A comprehensive agent management system that integrates Kilo CLI and OpenCode with the existing agent-skills-system, providing advanced deployment, cloud sync, and 75+ AI provider support.

## Features

- **Multi-Platform Integration**: Seamlessly manage agents across Kilo CLI, OpenCode, and agent-skills-system
- **Advanced Deployment**: Cloud sync, parallel mode execution, and intelligent platform selection
- **75+ AI Providers**: Support for OpenAI, Anthropic, and 73+ other AI providers
- **Unified CLI Interface**: Single command interface for all agent operations
- **Cross-Platform Synchronization**: Tri-directional sync between all platforms
- **Comprehensive Monitoring**: Prometheus metrics and Grafana dashboards
- **Property-Based Testing**: 25 correctness properties with 100+ iterations each
- **Backward Compatible**: Full compatibility with existing agent-skills-system

## Project Structure

```
agent-manager/
├── src/
│   ├── interfaces/          # Core TypeScript interfaces
│   ├── config/              # Configuration and validation schemas
│   ├── utils/               # Utility functions (logging, etc.)
│   ├── services/            # Core service implementations
│   ├── cli/                 # CLI command implementations
│   ├── __tests__/           # Test files
│   └── index.ts             # Main entry point
├── dist/                    # Compiled JavaScript output
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest testing configuration
├── .eslintrc.json           # ESLint configuration
└── .prettierrc.json         # Prettier formatting configuration
```

## Installation

```bash
cd agent-manager
npm install
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## Architecture

### Core Components

1. **Agent Manager**: Central orchestration component managing agent lifecycle
2. **CLI Bridge**: Abstraction layer for platform-specific operations
3. **Provider Manager**: Manages AI model providers across platforms
4. **Session Manager**: Handles agent sessions and cross-platform migration
5. **Configuration Manager**: Unified configuration management
6. **Monitoring System**: Prometheus metrics and health checks

### Interfaces

- `IAgentManager`: Agent lifecycle and cross-platform operations
- `ICLIBridge`: Platform abstraction and format conversion
- `IProviderManager`: AI provider and model management
- `ISessionManager`: Session lifecycle and cross-platform management

## Configuration

Configuration is managed through environment variables and config files:

```yaml
platforms:
  kilo:
    enabled: true
    cli:
      path: /usr/local/bin/kilocode
      version: "^1.0.0"
  opencode:
    enabled: true
    cli:
      path: /usr/local/bin/opencode
      version: "^2.0.0"
```

## Usage

### Creating an Agent

```typescript
import { UnifiedAgentConfig } from '@ai-ecosystem/agent-manager';

const agentConfig: UnifiedAgentConfig = {
  id: 'web-developer-agent',
  name: 'Web Developer Agent',
  description: 'Specialized agent for web development',
  version: '1.0.0',
  capabilities: {
    domains: ['web-development', 'javascript', 'react'],
    expertise: { 'web-development': 9, 'javascript': 9, 'react': 8 },
    limitations: ['mobile-development', 'devops'],
    preferredTools: ['vscode', 'node', 'npm'],
    languages: ['en', 'js', 'ts'],
  },
  // ... additional configuration
};
```

### Deploying an Agent

```typescript
const result = await agentManager.deployAgent('web-developer-agent', 'kilo');
console.log(`Deployed to ${result.platform}: ${result.deploymentId}`);
```

### Synchronizing Profiles

```typescript
const syncResult = await agentManager.syncAgentProfiles();
console.log(`Synced ${syncResult.profilesSynced} profiles`);
```

## Testing

The project includes comprehensive testing:

- **Unit Tests**: Specific examples and edge cases
- **Property-Based Tests**: 25 correctness properties with fast-check
- **Integration Tests**: End-to-end workflows across platforms

### Running Property-Based Tests

```bash
npm test -- --testNamePattern="Property"
```

## Monitoring

Metrics are exposed via Prometheus on port 9090:

```
http://localhost:9090/metrics
```

Grafana dashboards are available at:

```
http://localhost:3000
```

## Contributing

1. Follow the TypeScript style guide
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Update documentation as needed

## License

MIT

## Support

For issues and questions, please refer to the main project documentation.
