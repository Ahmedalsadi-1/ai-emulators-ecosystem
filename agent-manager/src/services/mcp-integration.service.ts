/**
 * MCP Integration Service
 * Handles MCP protocol, tool discovery, execution, and server management
 */

import { Logger } from '../utils/logger';
import { z } from 'zod';
import { PlatformId } from '../interfaces';

// ============================================================================
// Schemas
// ============================================================================

const MCPServerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  version: z.string(),
  platforms: z.array(z.enum(['kilo', 'opencode', 'skills-system'])),
  endpoint: z.string().url(),
  status: z.enum(['active', 'inactive', 'error', 'degraded']),
  capabilities: z.array(z.string()),
  registeredAt: z.date(),
  lastHealthCheck: z.date().optional(),
  healthStatus: z.enum(['healthy', 'unhealthy', 'unknown']),
});

const MCPToolSchema = z.object({
  id: z.string().uuid(),
  serverId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any()),
  outputSchema: z.record(z.any()),
  platforms: z.array(z.enum(['kilo', 'opencode', 'skills-system'])),
  permissions: z.array(z.string()),
  discoveredAt: z.date(),
});

const MCPToolExecutionSchema = z.object({
  id: z.string().uuid(),
  toolId: z.string().uuid(),
  agentId: z.string(),
  platform: z.enum(['kilo', 'opencode', 'skills-system']),
  input: z.record(z.any()),
  output: z.record(z.any()).optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  error: z.string().optional(),
  executedAt: z.date(),
  completedAt: z.date().optional(),
});

export type MCPServer = z.infer<typeof MCPServerSchema>;
export type MCPTool = z.infer<typeof MCPToolSchema>;
export type MCPToolExecution = z.infer<typeof MCPToolExecutionSchema>;

// ============================================================================
// MCP Integration Service
// ============================================================================

export class MCPIntegrationService {
  private logger: Logger;
  private servers: Map<string, MCPServer> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private executions: Map<string, MCPToolExecution> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logger = new Logger('MCPIntegrationService');
  }

  /**
   * Register an MCP server
   * Property: MCP server registration should make server available on all platforms
   */
  async registerServer(
    name: string,
    version: string,
    endpoint: string,
    platforms: PlatformId[],
    capabilities: string[]
  ): Promise<MCPServer> {
    try {
      this.logger.info(`Registering MCP server: ${name}`);

      const server: MCPServer = {
        id: this.generateUUID(),
        name,
        version,
        platforms,
        endpoint,
        status: 'active',
        capabilities,
        registeredAt: new Date(),
        healthStatus: 'unknown',
      };

      // Validate server schema
      MCPServerSchema.parse(server);

      // Store server
      this.servers.set(server.id, server);

      // Perform initial health check
      await this.checkServerHealth(server.id);

      this.logger.info(`MCP server registered: ${server.id}`);
      return server;
    } catch (error) {
      this.logger.error(`Failed to register MCP server: ${error}`);
      throw error;
    }
  }

  /**
   * Discover tools from MCP server
   * Property: Tool discovery should find all available tools on server
   */
  async discoverTools(serverId: string): Promise<MCPTool[]> {
    try {
      this.logger.info(`Discovering tools from server ${serverId}`);

      const server = this.servers.get(serverId);
      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }

      // Simulate tool discovery
      const discoveredTools: MCPTool[] = [];

      // Create sample tools based on server capabilities
      for (const capability of server.capabilities) {
        const tool: MCPTool = {
          id: this.generateUUID(),
          serverId,
          name: `${capability}-tool`,
          description: `Tool for ${capability}`,
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object', properties: {} },
          platforms: server.platforms,
          permissions: ['read', 'execute'],
          discoveredAt: new Date(),
        };

        MCPToolSchema.parse(tool);
        this.tools.set(tool.id, tool);
        discoveredTools.push(tool);
      }

      this.logger.info(`Discovered ${discoveredTools.length} tools from server ${serverId}`);
      return discoveredTools;
    } catch (error) {
      this.logger.error(`Failed to discover tools: ${error}`);
      throw error;
    }
  }

  /**
   * Execute an MCP tool
   * Property: Tool execution should handle input/output and errors correctly
   */
  async executeTool(
    toolId: string,
    agentId: string,
    platform: PlatformId,
    input: Record<string, any>
  ): Promise<MCPToolExecution> {
    try {
      this.logger.info(`Executing tool ${toolId} for agent ${agentId}`);

      const tool = this.tools.get(toolId);
      if (!tool) {
        throw new Error(`Tool not found: ${toolId}`);
      }

      // Validate platform support
      if (!tool.platforms.includes(platform)) {
        throw new Error(`Tool not available on platform ${platform}`);
      }

      const execution: MCPToolExecution = {
        id: this.generateUUID(),
        toolId,
        agentId,
        platform,
        input,
        status: 'running',
        executedAt: new Date(),
      };

      MCPToolExecutionSchema.parse(execution);
      this.executions.set(execution.id, execution);

      // Simulate tool execution
      const result = await this.simulateToolExecution(tool, input);

      execution.status = result.success ? 'completed' : 'failed';
      execution.output = result.output;
      execution.error = result.error;
      execution.completedAt = new Date();

      this.logger.info(`Tool execution completed: ${execution.id}`);
      return execution;
    } catch (error) {
      this.logger.error(`Failed to execute tool: ${error}`);
      throw error;
    }
  }

  /**
   * Get MCP server
   * Property: Server retrieval should return current server state
   */
  async getServer(serverId: string): Promise<MCPServer | undefined> {
    return this.servers.get(serverId);
  }

  /**
   * List all MCP servers
   * Property: Server listing should return all registered servers
   */
  async listServers(platform?: PlatformId): Promise<MCPServer[]> {
    const allServers = Array.from(this.servers.values());
    if (platform) {
      return allServers.filter((s) => s.platforms.includes(platform));
    }
    return allServers;
  }

  /**
   * List tools for a server
   * Property: Tool listing should return all tools for server
   */
  async listTools(serverId?: string, platform?: PlatformId): Promise<MCPTool[]> {
    const allTools = Array.from(this.tools.values());

    return allTools.filter((tool) => {
      if (serverId && tool.serverId !== serverId) return false;
      if (platform && !tool.platforms.includes(platform)) return false;
      return true;
    });
  }

  /**
   * Check server health
   * Property: Health check should verify server availability
   */
  async checkServerHealth(serverId: string): Promise<MCPServer> {
    try {
      this.logger.info(`Checking health of server ${serverId}`);

      const server = this.servers.get(serverId);
      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }

      // Simulate health check
      const isHealthy = Math.random() > 0.1;

      server.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      server.status = isHealthy ? 'active' : 'error';
      server.lastHealthCheck = new Date();

      this.logger.info(`Server health check completed: ${server.id} - ${server.healthStatus}`);
      return server;
    } catch (error) {
      this.logger.error(`Failed to check server health: ${error}`);
      throw error;
    }
  }

  /**
   * Start health monitoring for all servers
   * Property: Health monitoring should periodically check all servers
   */
  async startHealthMonitoring(intervalMs: number = 60000): Promise<void> {
    try {
      this.logger.info(`Starting health monitoring with interval ${intervalMs}ms`);

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      this.healthCheckInterval = setInterval(async () => {
        const servers = Array.from(this.servers.values());
        for (const server of servers) {
          try {
            await this.checkServerHealth(server.id);
          } catch (error) {
            this.logger.error(`Health check failed for server ${server.id}: ${error}`);
          }
        }
      }, intervalMs);

      this.logger.info('Health monitoring started');
    } catch (error) {
      this.logger.error(`Failed to start health monitoring: ${error}`);
      throw error;
    }
  }

  /**
   * Stop health monitoring
   * Property: Health monitoring stop should clean up resources
   */
  async stopHealthMonitoring(): Promise<void> {
    try {
      this.logger.info('Stopping health monitoring');

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      this.logger.info('Health monitoring stopped');
    } catch (error) {
      this.logger.error(`Failed to stop health monitoring: ${error}`);
      throw error;
    }
  }

  /**
   * Synchronize tool permissions across platforms
   * Property: Permission sync should apply consistently across platforms
   */
  async syncToolPermissions(toolId: string, permissions: string[]): Promise<void> {
    try {
      this.logger.info(`Syncing permissions for tool ${toolId}`);

      const tool = this.tools.get(toolId);
      if (tool) {
        tool.permissions = permissions;
        this.logger.info(`Tool permissions synced: ${toolId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync tool permissions: ${error}`);
      throw error;
    }
  }

  /**
   * Get tool execution history
   * Property: Execution history should be retrievable and accurate
   */
  async getExecutionHistory(
    toolId?: string,
    agentId?: string,
    platform?: PlatformId
  ): Promise<MCPToolExecution[]> {
    const allExecutions = Array.from(this.executions.values());

    return allExecutions.filter((exec) => {
      if (toolId && exec.toolId !== toolId) return false;
      if (agentId && exec.agentId !== agentId) return false;
      if (platform && exec.platform !== platform) return false;
      return true;
    });
  }

  /**
   * Unregister an MCP server
   * Property: Server unregistration should remove server and its tools
   */
  async unregisterServer(serverId: string): Promise<void> {
    try {
      this.logger.info(`Unregistering server ${serverId}`);

      // Remove server
      this.servers.delete(serverId);

      // Remove associated tools
      const toolsToRemove = Array.from(this.tools.entries())
        .filter(([_, tool]) => tool.serverId === serverId)
        .map(([id, _]) => id);

      for (const toolId of toolsToRemove) {
        this.tools.delete(toolId);
      }

      this.logger.info(`Server unregistered: ${serverId}`);
    } catch (error) {
      this.logger.error(`Failed to unregister server: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async simulateToolExecution(
    tool: MCPTool,
    input: Record<string, any>
  ): Promise<{ success: boolean; output?: Record<string, any>; error?: string }> {
    // Simulate tool execution
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        output: {
          result: `Tool ${tool.name} executed successfully`,
          input,
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        error: `Tool ${tool.name} execution failed`,
      };
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export default new MCPIntegrationService();
