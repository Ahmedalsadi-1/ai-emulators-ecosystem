# AI Emulators Ecosystem - MCP Integration Guide

## Table of Contents

1. [MCP Overview](#mcp-overview)
2. [MCP Server Setup](#mcp-server-setup)
3. [Tool Registration and Discovery](#tool-registration-and-discovery)
4. [Client Integration](#client-integration)
5. [Security and Authentication](#security-and-authentication)
6. [MCP Tool Development](#mcp-tool-development)
7. [Troubleshooting MCP](#troubleshooting-mcp)

## MCP Overview

The Model Context Protocol (MCP) enables seamless integration between AI models and external tools/services. In the AI Emulators Ecosystem, MCP provides a standardized interface for AI agents to interact with various automation and control systems.

### MCP Architecture in the Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Integration Layer                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                MCP Registry Service                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │Service     │  │Tool         │  │Authentication│     │ │
│  │  │Discovery   │  │Registration │  │& Authorization│     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   MCP Servers                           │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │ │
│  │  │Kali │  │Byte│  │Open │  │Factif│  │Social│         │ │
│  │  │Desk │  │bot │  │Intf │  │-AI  │  │Tools │         │ │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 MCP Clients                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │AIOS Agent  │  │Custom      │  │Web          │     │ │
│  │  │System      │  │Applications│  │Interfaces   │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### MCP Communication Flow

1. **Service Registration**: MCP servers register their available tools with the MCP Registry
2. **Tool Discovery**: MCP clients query the registry to discover available tools
3. **Authentication**: Clients authenticate with the registry and individual services
4. **Tool Execution**: Clients invoke tools through the MCP protocol
5. **Result Processing**: Tool results are returned to clients for processing

## MCP Server Setup

### Basic MCP Server Structure

Every MCP server in the ecosystem follows a standard structure:

```javascript
// Basic MCP Server Template
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class CustomMCPServer {
  constructor() {
    this.server = new Server(
      { name: 'custom-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'custom_tool',
          description: 'Description of what this tool does',
          inputSchema: {
            type: 'object',
            properties: {
              parameter1: { type: 'string', description: 'Parameter description' }
            },
            required: ['parameter1']
          }
        }
      ]
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'custom_tool':
            return await this.handleCustomTool(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  async handleCustomTool(args) {
    // Implement tool logic here
    return {
      content: [{ type: 'text', text: 'Tool executed successfully' }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Custom MCP server running');
  }
}
```

### Setting Up the Kali Desktop MCP Server

The Kali Desktop MCP server provides visual AI capabilities for penetration testing:

```bash
# 1. Install dependencies
npm install @modelcontextprotocol/sdk

# 2. Create the MCP server file (kali-mcp-server.js)
# ... (server code as shown in the ecosystem)

# 3. Configure OpenCode for MCP integration
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle",
  "mcp": {
    "kali-desktop": {
      "type": "local",
      "command": ["node", "/path/to/kali-mcp-server.js"],
      "enabled": true
    }
  }
}

# 4. Start the Kali desktop environment
docker run -d --name kali-desktop \
  -p 5901:5901 -p 6080:6080 \
  --privileged \
  kalilinux/kali-rolling bash -c "
    apt-get update &&
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
      kali-desktop-xfce tightvncserver novnc websockify \
      firefox-esr nmap sqlmap wireshark metasploit-framework \
      python3-opencv python3-pip &&
    pip3 install --break-system-packages vncdotool pynput &&
    mkdir -p /root/.vnc &&
    echo 'kali' | vncpasswd -f > /root/.vnc/passwd &&
    chmod 600 /root/.vnc/passwd &&
    vncserver :1 -geometry 1920x1080 -depth 24 &&
    /usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080 &
    tail -f /dev/null"

# 5. Copy and configure VNC control script
docker cp vnc_control.py kali-desktop:/usr/local/bin/vnc_control.py
docker exec kali-desktop chmod +x /usr/local/bin/vnc_control.py
```

### Docker-based MCP Server Setup

```yaml
# docker-compose.mcp.yml
version: '3.8'

services:
  kali-mcp:
    build:
      context: ./docker/kali-desktop
      dockerfile: Dockerfile
    ports:
      - "6080:6080"  # NoVNC web interface
      - "5901:5901"  # VNC port
    environment:
      - VNC_PASSWORD=kali
    volumes:
      - /tmp/.X11-unix:/tmp/.X11-unix:rw
    privileged: true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6080"]
      interval: 30s
      timeout: 10s
      retries: 3

  mcp-registry:
    build:
      context: ./mcp-registry
      dockerfile: Dockerfile
    ports:
      - "8002:8002"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Tool Registration and Discovery

### MCP Registry Service

The MCP Registry provides centralized tool discovery and registration:

```javascript
// MCP Registry Service
class MCPRegistry {
  constructor(redis) {
    this.redis = redis;
  }

  async registerService(serviceInfo) {
    const key = `mcp:service:${serviceInfo.name}`;
    await this.redis.setex(key, 300, JSON.stringify(serviceInfo)); // 5 minute TTL
    return { success: true, serviceId: serviceInfo.name };
  }

  async discoverTools(serviceName) {
    const key = `mcp:service:${serviceName}`;
    const serviceInfo = await this.redis.get(key);

    if (!serviceInfo) {
      throw new Error(`Service ${serviceName} not found`);
    }

    return JSON.parse(serviceInfo);
  }

  async listServices() {
    const keys = await this.redis.keys('mcp:service:*');
    const services = [];

    for (const key of keys) {
      const serviceInfo = await this.redis.get(key);
      services.push(JSON.parse(serviceInfo));
    }

    return services;
  }
}
```

### Tool Registration Process

```javascript
// Tool Registration Example
const mcpRegistry = new MCPRegistry(redis);

const kaliTools = {
  name: 'kali-desktop',
  version: '1.0.0',
  endpoint: 'http://kali-desktop:3001',
  description: 'Kali Linux desktop automation with visual AI',
  tools: [
    {
      name: 'kali_screenshot',
      description: 'Take a screenshot of the Kali desktop with optional UI analysis',
      parameters: {
        analyze: { type: 'boolean', description: 'Use OmniParser to analyze UI elements' }
      }
    },
    {
      name: 'kali_click',
      description: 'Click at specific coordinates on the desktop',
      parameters: {
        x: { type: 'number', description: 'X coordinate' },
        y: { type: 'number', description: 'Y coordinate' },
        button: { type: 'string', enum: ['left', 'right', 'middle'] }
      }
    },
    {
      name: 'kali_type',
      description: 'Type text on the desktop',
      parameters: {
        text: { type: 'string', description: 'Text to type' }
      }
    }
  ],
  authentication: {
    type: 'bearer',
    token_endpoint: 'http://mcp-registry:8002/auth/token'
  }
};

await mcpRegistry.registerService(kaliTools);
```

### Tool Discovery Workflow

```javascript
// Tool Discovery Example
async function discoverAndUseTool(toolName) {
  // 1. Discover available services
  const services = await mcpRegistry.listServices();

  // 2. Find service that provides the tool
  const targetService = services.find(service =>
    service.tools.some(tool => tool.name === toolName)
  );

  if (!targetService) {
    throw new Error(`Tool ${toolName} not found in any registered service`);
  }

  // 3. Get tool specification
  const toolSpec = targetService.tools.find(tool => tool.name === toolName);

  // 4. Authenticate if required
  const authToken = await authenticateWithService(targetService);

  // 5. Execute tool
  const result = await executeTool(targetService.endpoint, toolName, {
    authToken,
    parameters: toolSpec.parameters
  });

  return result;
}
```

## Client Integration

### MCP Client Implementation

```javascript
// MCP Client for Node.js
const { spawn } = require('child_process');

class MCPClient {
  constructor(serverCommand, serverArgs = []) {
    this.serverCommand = serverCommand;
    this.serverArgs = serverArgs;
    this.serverProcess = null;
    this.pendingRequests = new Map();
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn(this.serverCommand, this.serverArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.on('error', reject);

      // Set up message handling
      this.setupMessageHandling();

      // Wait for server to be ready
      setTimeout(resolve, 1000);
    });
  }

  setupMessageHandling() {
    let buffer = '';

    this.serverProcess.stdout.on('data', (data) => {
      buffer += data.toString();

      // Process complete JSON-RPC messages
      const messages = buffer.split('\n');
      buffer = messages.pop(); // Keep incomplete message in buffer

      for (const message of messages) {
        if (message.trim()) {
          try {
            const response = JSON.parse(message);
            this.handleResponse(response);
          } catch (error) {
            console.error('Failed to parse MCP response:', error);
          }
        }
      }
    });
  }

  handleResponse(response) {
    const requestId = response.id;
    const pendingRequest = this.pendingRequests.get(requestId);

    if (pendingRequest) {
      this.pendingRequests.delete(requestId);

      if (response.error) {
        pendingRequest.reject(response.error);
      } else {
        pendingRequest.resolve(response.result);
      }
    }
  }

  async sendRequest(method, params = {}) {
    const requestId = Math.random().toString(36).substring(7);
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  async listTools() {
    return await this.sendRequest('tools/list');
  }

  async callTool(name, args = {}) {
    return await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async stop() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }
}

// Usage Example
async function useKaliDesktop() {
  const client = new MCPClient('node', ['kali-mcp-server.js']);

  try {
    await client.start();

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools);

    // Take a screenshot
    const screenshot = await client.callTool('kali_screenshot', { analyze: true });
    console.log('Screenshot result:', screenshot);

    // Click at coordinates
    const clickResult = await client.callTool('kali_click', { x: 100, y: 100 });
    console.log('Click result:', clickResult);

  } finally {
    await client.stop();
  }
}
```

### Integration with AI Agents (AIOS)

```python
# AIOS MCP Integration
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class AIOSMCPIntegration:
    def __init__(self, server_command, server_args=None):
        self.server_command = server_command
        self.server_args = server_args or []

    async def connect_to_mcp_server(self):
        """Establish connection to MCP server"""
        server_params = StdioServerParameters(
            command=self.server_command,
            args=self.server_args,
            env=None
        )

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                return session

    async def discover_tools(self):
        """Discover available MCP tools"""
        async with self.connect_to_mcp_server() as session:
            tools = await session.list_tools()
            return tools

    async def execute_tool(self, tool_name, **kwargs):
        """Execute an MCP tool"""
        async with self.connect_to_mcp_server() as session:
            result = await session.call_tool(tool_name, arguments=kwargs)
            return result

    async def run_agent_with_mcp(self, task_description):
        """Run AI agent with MCP tool integration"""
        # Discover available tools
        tools = await self.discover_tools()

        # Plan task execution using available tools
        plan = self.plan_task_with_tools(task_description, tools)

        # Execute plan
        results = []
        for step in plan:
            if step['tool']:
                result = await self.execute_tool(step['tool'], **step['args'])
                results.append(result)

        return results

# Usage in AIOS
aios_mcp = AIOSMCPIntegration('node', ['kali-mcp-server.js'])

# Example task: "Take a screenshot and analyze the desktop"
result = await aios_mcp.run_agent_with_mcp(
    "Take a screenshot of the Kali desktop and analyze any visible UI elements"
)
```

### Web Application Integration

```javascript
// React Component with MCP Integration
import React, { useState, useEffect } from 'react';

function MCPToolInterface() {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolResult, setToolResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch('/api/mcp/tools');
      const toolList = await response.json();
      setTools(toolList);
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const executeTool = async (toolName, args) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: args
        })
      });

      const result = await response.json();
      setToolResult(result);
    } catch (error) {
      console.error('Tool execution failed:', error);
      setToolResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolExecution = (toolName) => {
    const tool = tools.find(t => t.name === toolName);
    if (tool) {
      setSelectedTool(tool);
      // For demo, execute with default args
      executeTool(toolName, {});
    }
  };

  return (
    <div className="mcp-interface">
      <h2>MCP Tools</h2>

      <div className="tools-list">
        {tools.map(tool => (
          <div key={tool.name} className="tool-item">
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
            <button
              onClick={() => handleToolExecution(tool.name)}
              disabled={isLoading}
            >
              Execute
            </button>
          </div>
        ))}
      </div>

      {selectedTool && (
        <div className="tool-details">
          <h3>Tool: {selectedTool.name}</h3>
          <pre>{JSON.stringify(selectedTool.inputSchema, null, 2)}</pre>
        </div>
      )}

      {toolResult && (
        <div className="tool-result">
          <h3>Result:</h3>
          <pre>{JSON.stringify(toolResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default MCPToolInterface;
```

## Security and Authentication

### MCP Authentication Framework

```javascript
// MCP Authentication Middleware
class MCPAuthMiddleware {
  constructor(jwtSecret, redis) {
    this.jwtSecret = jwtSecret;
    this.redis = redis;
  }

  async authenticate(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  }

  async authorize(user, service, tool) {
    // Check if user has permission for this tool
    const permissions = await this.redis.get(`user:${user.id}:permissions`);

    if (!permissions) {
      return false;
    }

    const userPerms = JSON.parse(permissions);
    return userPerms.services[service]?.tools.includes(tool) || false;
  }

  async generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      services: user.allowedServices,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, this.jwtSecret);
  }
}

// MCP Server with Authentication
class SecureMCPServer extends CustomMCPServer {
  constructor(authMiddleware) {
    super();
    this.auth = authMiddleware;
  }

  setupHandlers() {
    // Authenticate before tool operations
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authentication required');
      }

      const token = authHeader.substring(7);
      const user = await this.auth.authenticate(token);

      // Filter tools based on user permissions
      const allTools = await this.getAllTools();
      const allowedTools = allTools.filter(tool =>
        this.auth.authorize(user, 'kali-desktop', tool.name)
      );

      return { tools: allowedTools };
    });

    // Secure tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const authHeader = request.headers.authorization;

      const token = authHeader.substring(7);
      const user = await this.auth.authenticate(token);

      // Check authorization
      if (!(await this.auth.authorize(user, 'kali-desktop', name))) {
        throw new Error('Unauthorized access to tool');
      }

      // Execute tool with user context
      return await this.executeToolSecurely(name, args, user);
    });
  }
}
```

### Rate Limiting and Abuse Prevention

```javascript
// MCP Rate Limiting
class MCRateLimiter {
  constructor(redis) {
    this.redis = redis;
  }

  async checkLimit(userId, toolName, limit = 100, window = 3600) {
    const key = `rate:${userId}:${toolName}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, window);
    }

    return current <= limit;
  }

  async getRemainingTime(userId, toolName, window = 3600) {
    const key = `rate:${userId}:${toolName}`;
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : window;
  }
}

// Usage in MCP Server
const rateLimiter = new MCRateLimiter(redis);

this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const userId = request.user.id;

  // Check rate limit
  const allowed = await rateLimiter.checkLimit(userId, name);
  if (!allowed) {
    const remaining = await rateLimiter.getRemainingTime(userId, name);
    throw new Error(`Rate limit exceeded. Try again in ${remaining} seconds`);
  }

  // Proceed with tool execution
  return await this.handleToolExecution(request);
});
```

### Secure Tool Sandboxing

```javascript
// Tool Execution Sandbox
class SecureToolExecutor {
  constructor(docker) {
    this.docker = docker;
  }

  async executeInSandbox(toolName, args, userContext) {
    const containerConfig = {
      Image: 'kali-linux-tool-sandbox',
      Cmd: [toolName, JSON.stringify(args)],
      Env: [
        `USER_ID=${userContext.id}`,
        `USER_PERMISSIONS=${JSON.stringify(userContext.permissions)}`,
        `SANDBOX_MODE=true`
      ],
      HostConfig: {
        Memory: 512 * 1024 * 1024, // 512MB limit
        CpuQuota: 50000, // 50% CPU limit
        ReadonlyRootfs: true,
        Tmpfs: {
          '/tmp': 'rw,noexec,nosuid,size=100m'
        }
      },
      NetworkDisabled: toolName !== 'kali_screenshot' // Disable network for most tools
    };

    const container = await this.docker.createContainer(containerConfig);
    await container.start();

    // Monitor execution
    const stream = await container.logs({ follow: true, stdout: true, stderr: true });

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      stream.on('error', (chunk) => {
        errorOutput += chunk.toString();
      });

      container.wait().then((result) => {
        container.remove();

        if (result.StatusCode === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(`Tool execution failed: ${errorOutput}`));
        }
      });
    });
  }
}
```

## MCP Tool Development

### Tool Development Best Practices

```javascript
// Well-structured MCP Tool
class ExampleTool {
  static get definition() {
    return {
      name: 'example_tool',
      description: 'A well-documented example tool',
      inputSchema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Input parameter with clear description',
            minLength: 1,
            maxLength: 1000
          },
          options: {
            type: 'object',
            description: 'Optional configuration object',
            properties: {
              timeout: {
                type: 'number',
                description: 'Operation timeout in seconds',
                default: 30,
                minimum: 1,
                maximum: 300
              },
              retries: {
                type: 'number',
                description: 'Number of retry attempts',
                default: 3,
                minimum: 0,
                maximum: 10
              }
            }
          }
        },
        required: ['input']
      }
    };
  }

  static async validateInput(args) {
    // Input validation logic
    if (!args.input || typeof args.input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }

    if (args.options?.timeout && (args.options.timeout < 1 || args.options.timeout > 300)) {
      throw new Error('Timeout must be between 1 and 300 seconds');
    }

    return args;
  }

  static async execute(args, context = {}) {
    try {
      // Validate input
      const validatedArgs = await this.validateInput(args);

      // Log execution (for monitoring)
      console.log(`Executing ${this.definition.name} with args:`, validatedArgs);

      // Implement tool logic with error handling
      const result = await this.performOperation(validatedArgs, context);

      // Return structured response
      return {
        content: [
          {
            type: 'text',
            text: `Operation completed successfully: ${result.summary}`
          },
          {
            type: 'data',
            data: result.data
          }
        ],
        metadata: {
          executionTime: result.executionTime,
          resourceUsage: result.resourceUsage
        }
      };

    } catch (error) {
      // Structured error handling
      return {
        content: [
          {
            type: 'text',
            text: `Operation failed: ${error.message}`
          }
        ],
        isError: true,
        error: {
          code: error.code || 'TOOL_EXECUTION_ERROR',
          details: error.details || {}
        }
      };
    }
  }

  static async performOperation(args, context) {
    // Actual tool implementation
    const startTime = Date.now();

    // Simulate operation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const executionTime = Date.now() - startTime;

    return {
      summary: `Processed input: ${args.input}`,
      data: { processed: true, input: args.input },
      executionTime,
      resourceUsage: { cpu: 0.1, memory: '50MB' }
    };
  }
}
```

### Tool Testing Framework

```javascript
// MCP Tool Testing Framework
class ToolTester {
  constructor(toolClass) {
    this.toolClass = toolClass;
  }

  async runTests() {
    const tests = [
      this.testInputValidation(),
      this.testSuccessfulExecution(),
      this.testErrorHandling(),
      this.testPerformance(),
      this.testSecurity()
    ];

    const results = await Promise.all(tests);
    return this.generateReport(results);
  }

  async testInputValidation() {
    const testCases = [
      { input: 'valid input', expected: true },
      { input: '', expected: false },
      { input: null, expected: false },
      { input: 'a'.repeat(1001), expected: false }, // Too long
    ];

    const results = [];
    for (const testCase of testCases) {
      try {
        await this.toolClass.validateInput(testCase);
        results.push({ testCase, passed: testCase.expected });
      } catch (error) {
        results.push({ testCase, passed: !testCase.expected, error: error.message });
      }
    }

    return { testName: 'Input Validation', results };
  }

  async testSuccessfulExecution() {
    const args = { input: 'test input' };
    const startTime = Date.now();

    try {
      const result = await this.toolClass.execute(args);
      const executionTime = Date.now() - startTime;

      return {
        testName: 'Successful Execution',
        passed: !result.isError && result.content.length > 0,
        executionTime,
        result
      };
    } catch (error) {
      return {
        testName: 'Successful Execution',
        passed: false,
        error: error.message
      };
    }
  }

  async testErrorHandling() {
    const invalidArgs = { input: null };

    try {
      await this.toolClass.execute(invalidArgs);
      return {
        testName: 'Error Handling',
        passed: false,
        message: 'Expected error but none was thrown'
      };
    } catch (error) {
      return {
        testName: 'Error Handling',
        passed: true,
        message: 'Properly handled invalid input'
      };
    }
  }

  async testPerformance() {
    const args = { input: 'performance test' };
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await this.toolClass.execute(args);
      times.push(Date.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);

    return {
      testName: 'Performance',
      passed: avgTime < 5000 && maxTime < 10000, // 5s average, 10s max
      metrics: { avgTime, maxTime, iterations }
    };
  }

  async testSecurity() {
    // Test for common security issues
    const maliciousInputs = [
      { input: '<script>alert("xss")</script>' },
      { input: '../../../etc/passwd' },
      { input: 'a'.repeat(10000) }, // Potential DoS
    ];

    const results = [];
    for (const maliciousInput of maliciousInputs) {
      try {
        const result = await this.toolClass.execute(maliciousInput);
        results.push({
          input: maliciousInput,
          safe: !result.content.some(c => c.text.includes('alert') || c.text.includes('passwd'))
        });
      } catch (error) {
        results.push({ input: maliciousInput, safe: true, error: error.message });
      }
    }

    return {
      testName: 'Security',
      passed: results.every(r => r.safe),
      results
    };
  }

  generateReport(testResults) {
    const summary = {
      totalTests: testResults.length,
      passedTests: testResults.filter(t => t.passed).length,
      failedTests: testResults.filter(t => !t.passed).length,
      details: testResults
    };

    return summary;
  }
}

// Usage
const tester = new ToolTester(ExampleTool);
const report = await tester.runTests();
console.log('Test Report:', report);
```

## Troubleshooting MCP

### Common MCP Issues and Solutions

#### Connection Issues

**Problem**: MCP server fails to start
```bash
# Check server logs
docker logs mcp-server-container

# Verify port availability
netstat -tlnp | grep :3001

# Test server health
curl http://localhost:3001/health

# Check environment variables
docker exec mcp-server-container env | grep -E "(PORT|HOST|DEBUG)"
```

**Problem**: Client cannot connect to MCP server
```javascript
// Add connection debugging
const client = new MCPClient('node', ['server.js']);

client.on('connect', () => console.log('Connected to MCP server'));
client.on('error', (error) => console.error('Connection error:', error));
client.on('disconnect', () => console.log('Disconnected from MCP server'));
```

#### Tool Execution Issues

**Problem**: Tool returns unexpected results
```javascript
// Add detailed logging to tool execution
async callTool(name, args) {
  console.log(`Executing tool: ${name}`);
  console.log(`Arguments:`, JSON.stringify(args, null, 2));

  try {
    const result = await this.sendRequest('tools/call', { name, arguments: args });
    console.log(`Tool result:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Tool execution failed:`, error);
    throw error;
  }
}
```

**Problem**: Tool times out
```javascript
// Implement timeout handling
async callToolWithTimeout(name, args, timeout = 30000) {
  return Promise.race([
    this.callTool(name, args),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
    )
  ]);
}
```

#### Authentication Issues

**Problem**: Authentication token rejected
```javascript
// Debug token validation
async debugAuthentication(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);

    // Check token expiration
    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      console.error('Token has expired');
    }

    return decoded;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    return null;
  }
}
```

#### Performance Issues

**Problem**: MCP server is slow
```javascript
// Add performance monitoring
class MCPPerformanceMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      errorCount: 0
    };
  }

  recordRequest(startTime, endTime, success) {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += (endTime - startTime);

    if (!success) {
      this.metrics.errorCount++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime: this.metrics.totalResponseTime / this.metrics.requestCount,
      errorRate: this.metrics.errorCount / this.metrics.requestCount
    };
  }
}

// Usage in MCP server
const monitor = new MCPPerformanceMonitor();

this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();

  try {
    const result = await this.handleToolExecution(request);
    monitor.recordRequest(startTime, Date.now(), true);
    return result;
  } catch (error) {
    monitor.recordRequest(startTime, Date.now(), false);
    throw error;
  }
});
```

### MCP Debugging Tools

```bash
# MCP Debug Script
#!/bin/bash

echo "=== MCP Ecosystem Debug Report ==="
echo "Generated at: $(date)"
echo

echo "=== Docker Services Status ==="
docker-compose ps
echo

echo "=== MCP Registry Status ==="
curl -s http://localhost:8002/health | jq . || echo "Registry not responding"
echo

echo "=== Service Health Checks ==="
services=("kali-desktop:3001" "bytebot:4001" "open-interface:5001" "factif-ai:7001")

for service in "${services[@]}"; do
  name=$(echo $service | cut -d: -f1)
  port=$(echo $service | cut -d: -f2)

  echo "Checking $name ($service)..."
  if curl -s --max-time 5 http://localhost:$port/health > /dev/null; then
    echo "  ✓ Healthy"
  else
    echo "  ✗ Unhealthy or unreachable"
  fi
done
echo

echo "=== Network Connectivity ==="
echo "Testing MCP network connectivity..."
docker run --rm --network ai-ecosystem_mcp_network \
  curlimages/curl http://mcp-registry:8002/health || echo "Network issue detected"
echo

echo "=== Log Analysis ==="
echo "Recent errors in logs:"
docker-compose logs --tail=50 2>&1 | grep -i error | tail -10
echo

echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}"
echo

echo "=== Configuration Validation ==="
if [ -f .env ]; then
  echo "Environment file exists"
  echo "Required variables check:"
  grep -E "(OPENAI_API_KEY|JWT_SECRET|POSTGRES_PASSWORD)" .env > /dev/null && \
    echo "  ✓ Core secrets configured" || echo "  ✗ Missing core secrets"
else
  echo "  ✗ No .env file found"
fi

echo
echo "=== Recommendations ==="
echo "1. Check individual service logs: docker-compose logs [service-name]"
echo "2. Verify network connectivity: docker network inspect ai-ecosystem_mcp_network"
echo "3. Test tool registration: curl http://localhost:8002/services"
echo "4. Monitor resource usage: docker stats"
```

---

For architecture overview, see [ARCHITECTURE.md](./ARCHITECTURE.md)
For API documentation, see [API.md](./API.md)
For troubleshooting other components, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)