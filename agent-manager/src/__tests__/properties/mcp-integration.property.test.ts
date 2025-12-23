/**
 * Property-Based Tests for MCP Integration Service
 * Feature: kilo-cli-integration
 * Property 23: MCP Server Cross-Platform Registration
 * Property 24: Tool Discovery and Availability
 * Property 25: MCP Server Health Monitoring
 */

import * as fc from 'fast-check';
import { MCPIntegrationService } from '../../services/mcp-integration.service';

describe('MCPIntegrationService - Property-Based Tests', () => {
  let service: MCPIntegrationService;

  beforeEach(() => {
    service = new MCPIntegrationService();
  });

  afterEach(async () => {
    await service.stopHealthMonitoring();
  });

  // ============================================================================
  // Property 23: MCP Server Cross-Platform Registration
  // ============================================================================

  it('Property 23: For any valid server parameters, registration should make server available on all platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        async (name, version, endpoint, platforms, capabilities) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, capabilities);

          expect(server.id).toBeDefined();
          expect(server.name).toBe(name);
          expect(server.version).toBe(version);
          expect(server.platforms).toEqual(platforms);
          expect(server.capabilities).toEqual(capabilities);
          expect(server.status).toBe('active');

          // Verify server is available on all platforms
          for (const platform of platforms) {
            const servers = await service.listServers(platform as any);
            expect(servers.some((s) => s.id === server.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property 24: Tool Discovery and Availability
  // ============================================================================

  it('Property 24: For any registered server, discovered tools should be available on all platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        async (name, version, endpoint, platforms, capabilities) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, capabilities);
          const tools = await service.discoverTools(server.id);

          expect(tools.length).toBeGreaterThan(0);

          // Verify tools are available on all platforms
          for (const tool of tools) {
            expect(tool.serverId).toBe(server.id);
            expect(tool.platforms).toEqual(platforms);

            // Verify tool can be listed
            const listedTools = await service.listTools(server.id);
            expect(listedTools.some((t) => t.id === tool.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property 25: MCP Server Health Monitoring
  // ============================================================================

  it('Property 25: For any registered server, health monitoring should track status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        async (name, version, endpoint, platforms) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, []);

          // Check health
          const healthCheck = await service.checkServerHealth(server.id);
          expect(healthCheck.healthStatus).toMatch(/healthy|unhealthy|unknown/);
          expect(healthCheck.lastHealthCheck).toBeDefined();

          // Start monitoring
          await service.startHealthMonitoring(100);

          // Wait for monitoring
          await new Promise((resolve) => setTimeout(resolve, 150));

          // Verify monitoring updated status
          const monitored = await service.getServer(server.id);
          expect(monitored?.lastHealthCheck).toBeDefined();

          // Stop monitoring
          await service.stopHealthMonitoring();
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Tool execution should handle input/output and errors correctly
  // ============================================================================

  it('Property: For any valid tool, execution should process input and return output', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ maxLength: 50 })),
        async (name, version, endpoint, platforms, agentId, command, input) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, [command]);
          const tools = await service.discoverTools(server.id);

          if (tools.length > 0) {
            const tool = tools[0];
            const execution = await service.executeTool(tool.id, agentId, platforms[0] as any, input);

            expect(execution.id).toBeDefined();
            expect(execution.toolId).toBe(tool.id);
            expect(execution.agentId).toBe(agentId);
            expect(['pending', 'running', 'completed', 'failed']).toContain(execution.status);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Server retrieval should return current server state
  // ============================================================================

  it('Property: For any registered server, retrieval should return correct state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        async (name, version, endpoint, platforms) => {
          const registered = await service.registerServer(name, version, endpoint, platforms as any, []);
          const retrieved = await service.getServer(registered.id);

          expect(retrieved).toBeDefined();
          expect(retrieved?.id).toBe(registered.id);
          expect(retrieved?.name).toBe(name);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Server listing should return all registered servers
  // ============================================================================

  it('Property: For any registered servers, listing should return all servers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            version: fc.string({ minLength: 1, maxLength: 20 }),
            endpoint: fc.webUrl(),
            platforms: fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (serverDefs) => {
          // Register servers
          for (const def of serverDefs) {
            await service.registerServer(def.name, def.version, def.endpoint, def.platforms as any, []);
          }

          // List all servers
          const allServers = await service.listServers();
          expect(allServers.length).toBeGreaterThanOrEqual(serverDefs.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Tool listing should return all tools for server
  // ============================================================================

  it('Property: For any server with tools, listing should return all tools', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        async (name, version, endpoint, platforms, capabilities) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, capabilities);
          const tools = await service.discoverTools(server.id);

          const listed = await service.listTools(server.id);
          expect(listed.length).toBe(tools.length);
          expect(listed.every((t) => t.serverId === server.id)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Permission sync should apply consistently across platforms
  // ============================================================================

  it('Property: For any tool, permission sync should update permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        async (name, version, endpoint, platforms, capabilities) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, capabilities);
          const tools = await service.discoverTools(server.id);

          if (tools.length > 0) {
            const tool = tools[0];
            const newPermissions = ['read', 'write', 'execute'];

            await service.syncToolPermissions(tool.id, newPermissions);

            const updated = await service.listTools(server.id);
            const updatedTool = updated.find((t) => t.id === tool.id);
            expect(updatedTool?.permissions).toEqual(newPermissions);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Execution history should be retrievable and accurate
  // ============================================================================

  it('Property: For any executed tool, history should be retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (name, version, endpoint, platforms, agentId) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, ['test']);
          const tools = await service.discoverTools(server.id);

          if (tools.length > 0) {
            const tool = tools[0];
            await service.executeTool(tool.id, agentId, platforms[0] as any, {});

            const history = await service.getExecutionHistory(tool.id, agentId);
            expect(history.length).toBeGreaterThan(0);
            expect(history.every((h) => h.toolId === tool.id && h.agentId === agentId)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Server unregistration should remove server and its tools
  // ============================================================================

  it('Property: For any registered server, unregistration should remove it', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.array(fc.constantFrom('kilo', 'opencode', 'skills-system'), { minLength: 1, maxLength: 3 }),
        async (name, version, endpoint, platforms) => {
          const server = await service.registerServer(name, version, endpoint, platforms as any, []);
          const serverId = server.id;

          await service.unregisterServer(serverId);

          const retrieved = await service.getServer(serverId);
          expect(retrieved).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Tool execution on unsupported platform should fail
  // ============================================================================

  it('Property: For any tool, execution on unsupported platform should fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.constantFrom('kilo', 'opencode'),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (name, version, endpoint, platform, agentId) => {
          const server = await service.registerServer(name, version, endpoint, [platform as any], ['test']);
          const tools = await service.discoverTools(server.id);

          if (tools.length > 0) {
            const tool = tools[0];
            const unsupportedPlatform = platform === 'kilo' ? 'opencode' : 'kilo';

            await expect(
              service.executeTool(tool.id, agentId, unsupportedPlatform as any, {})
            ).rejects.toThrow();
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
