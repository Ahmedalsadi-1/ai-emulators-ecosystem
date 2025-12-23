# AIOS API Wrapper

A standardized REST API wrapper for the AIOS (AI Operating System) service that provides clean endpoints for LLM operations, memory management, and MCP tool discovery.

## Overview

The AIOS API Wrapper integrates with the running AIOS container and provides a clean interface for the TuriX app. It handles communication with the AIOS service endpoints and provides high-level methods for common operations.

## Features

- **LLM Operations**: Query LLMs with custom messages and tool support
- **Memory Management**: Store and retrieve data from AIOS memory system
- **MCP Tool Discovery**: Discover available MCP (Model Context Protocol) tools
- **Agent Execution**: Submit and monitor AI agent execution
- **Service Health**: Monitor AIOS service status and health

## Installation

The wrapper is included in the unified-app package. Ensure axios is installed:

```bash
pnpm add axios
```

## Usage

### Basic Setup

```typescript
import AIOSService from './services/AIOSService';

// Initialize with default AIOS service URL (http://localhost:8000)
const aiosService = new AIOSService();

// Or specify custom URL
const aiosService = new AIOSService('http://your-aios-host:8000');
```

### Service Registration

Register the service with TuriX:

```typescript
import { TuriX } from 'turix-core';

TuriX.registerService(AIOSService.getServiceRegistration());
```

### LLM Operations

```typescript
// Run a simple LLM query
const messages = [
  { role: 'user', content: 'Hello, how can you help me?' }
];
const response = await aiosService.runLLMQuery(messages);

// Query with specific LLMs
const llms = [{ name: 'qwen3:1.7b', backend: 'ollama' }];
const response = await aiosService.runLLMQuery(messages, llms);

// Include tools
const tools = [{ name: 'calculator', description: 'Basic calculator' }];
const response = await aiosService.runLLMQuery(messages, llms, tools);
```

### Memory Management

```typescript
// Store data in memory
await aiosService.storeMemory('user-preferences', {
  theme: 'dark',
  language: 'en'
});

// Retrieve data from memory
const preferences = await aiosService.retrieveMemory('user-preferences');
```

### MCP Tool Discovery

```typescript
// Discover available MCP tools
const tools = await aiosService.discoverMCPTools();
console.log('Available tools:', tools);
```

### Agent Execution

```typescript
// Execute an agent
const result = await aiosService.executeAgent(
  'data-analyzer',
  'Analyze the sales data from last month'
);
console.log('Execution ID:', result.execution_id);

// Check agent status
const status = await aiosService.checkAgentStatus(result.execution_id);
console.log('Status:', status.status);
```

### Service Health Monitoring

```typescript
// Check service status
const status = await aiosService.getServiceStatus();
console.log('Service status:', status);

// Check health
const health = await aiosService.getHealthStatus();
console.log('Health:', health);
```

## Natural Language Commands

The service supports natural language command processing:

```typescript
// LLM queries
await aiosService.processCommand('run llm query What is the capital of France?');

// Memory operations
await aiosService.processCommand('store memory user-settings {"theme": "dark"}');
await aiosService.processCommand('retrieve memory user-settings');

// MCP tools
await aiosService.processCommand('discover mcp tools');

// Agent execution
await aiosService.processCommand('execute agent Analyze the quarterly sales report');
await aiosService.processCommand('check agent status 123');
```

## API Reference

### Constructor

```typescript
new AIOSService(baseUrl?: string)
```

- `baseUrl`: Base URL for the AIOS service (default: 'http://localhost:8000')

### Methods

#### LLM Operations

- `runLLMQuery(messages, llms?, tools?)`: Execute LLM query
- `listAvailableLLMs()`: List configured LLMs
- `selectLLMs(llms)`: Select LLMs for subsequent operations

#### Memory Management

- `storeMemory(key, data, metadata?)`: Store data in memory
- `retrieveMemory(key, options?)`: Retrieve data from memory

#### MCP Tools

- `discoverMCPTools()`: Discover available MCP tools

#### Agent Management

- `executeAgent(agentId, task, config?)`: Submit agent for execution
- `checkAgentStatus(executionId)`: Check agent execution status

#### Service Monitoring

- `getServiceStatus()`: Get overall service status
- `getHealthStatus()`: Get service health information

#### Command Processing

- `processCommand(command)`: Process natural language commands

### Static Methods

- `AIOSService.getServiceRegistration()`: Get TuriX service registration object

## Error Handling

The service throws `AIOSServiceError` for API-related errors:

```typescript
try {
  const result = await aiosService.runLLMQuery(messages);
} catch (error) {
  if (error instanceof AIOSServiceError) {
    console.error('AIOS Service Error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration

The wrapper automatically handles:
- Request/response serialization
- Error handling and retry logic
- CORS and authentication headers
- Timeout management (30 seconds default)

## Integration with TuriX

The service integrates seamlessly with the TuriX ecosystem:

1. Register the service during app initialization
2. Use the provided UI components for service cards
3. Leverage natural language command processing
4. Monitor service status through the unified dashboard

## Dependencies

- `axios`: HTTP client for API communication
- `typescript`: Type definitions and compilation

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Architecture

The wrapper follows these design principles:

1. **Clean Interface**: High-level methods abstract away API complexity
2. **Error Resilience**: Comprehensive error handling and recovery
3. **Type Safety**: Full TypeScript support with proper type definitions
4. **Extensibility**: Easy to add new AIOS API endpoints
5. **Performance**: Efficient request batching and caching where appropriate

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure AIOS service is running on the specified port
2. **LLM Not Selected**: Select LLMs before running queries
3. **Agent Not Found**: Verify agent ID and ensure agent factory is initialized

### Debug Mode

Enable debug logging:

```typescript
// Debug information is logged to console by default
// Check browser/network console for detailed request/response information
```

## Contributing

When extending the wrapper:

1. Maintain backward compatibility
2. Add comprehensive error handling
3. Update type definitions
4. Add unit tests for new functionality
5. Update this documentation