import axios from 'axios';

export interface MCPServer {
  id: string;
  name: string;
  project: string;
  endpoint: string;
  status: 'online' | 'offline' | 'error';
  capabilities: string[];
  version: string;
  lastSeen: string;
}

export class MCPService {
  private registryUrl: string;

  constructor() {
    this.registryUrl = process.env.MCP_REGISTRY_URL || 'http://mcp-registry:8002';
  }

  async getAllServers(): Promise<MCPServer[]> {
    try {
      const response = await axios.get(`${this.registryUrl}/api/mcp/servers`);
      return response.data;
    } catch (error) {
      // Fallback to known MCP servers from compose
      return this.getKnownMCPServers();
    }
  }

  async getServersByProject(project: string): Promise<MCPServer[]> {
    const allServers = await this.getAllServers();
    return allServers.filter(server => server.project === project);
  }

  async registerServer(serverData: Partial<MCPServer>): Promise<MCPServer> {
    try {
      const response = await axios.post(`${this.registryUrl}/api/mcp/servers`, serverData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to register MCP server: ${error.message}`);
    }
  }

  async getServerStatus(serverId: string): Promise<'online' | 'offline' | 'error'> {
    try {
      const servers = await this.getAllServers();
      const server = servers.find(s => s.id === serverId);

      if (!server) {
        return 'error';
      }

      // Check if server is responding
      try {
        await axios.get(`${server.endpoint}/health`, { timeout: 5000 });
        return 'online';
      } catch {
        return 'offline';
      }
    } catch {
      return 'error';
    }
  }

  private getKnownMCPServers(): MCPServer[] {
    // Known MCP servers from docker-compose
    return [
      {
        id: 'aios-mcp',
        name: 'AIOS MCP Server',
        project: 'aios',
        endpoint: 'http://aios:8011',
        status: 'online',
        capabilities: ['llm', 'agent-orchestration'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'bytebot-mcp',
        name: 'ByteBot MCP Server',
        project: 'bytebot',
        endpoint: 'http://bytebot:4001',
        status: 'online',
        capabilities: ['computer-control', 'automation'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'open-interface-mcp',
        name: 'Open Interface MCP Server',
        project: 'open-interface',
        endpoint: 'http://open-interface:5001',
        status: 'online',
        capabilities: ['computer-control', 'automation'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'factif-ai-mcp',
        name: 'Factif AI MCP Server',
        project: 'factif-ai',
        endpoint: 'http://factif-ai:7001',
        status: 'online',
        capabilities: ['test-automation', 'ai-testing'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'postiz-mcp',
        name: 'Postiz MCP Server',
        project: 'postiz-app',
        endpoint: 'http://postiz-app:9001',
        status: 'online',
        capabilities: ['social-media', 'content-scheduling'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'onlysnarf-mcp',
        name: 'OnlySnarf MCP Server',
        project: 'onlysnarf',
        endpoint: 'http://onlysnarf:10001',
        status: 'online',
        capabilities: ['content-automation', 'social-media'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'reels-automator-mcp',
        name: 'Reels Automator MCP Server',
        project: 'reels-clips-automator',
        endpoint: 'http://reels-clips-automator:11001',
        status: 'online',
        capabilities: ['video-automation', 'content-creation'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'wan2gp-mcp',
        name: 'Wan2GP MCP Server',
        project: 'wan2gp',
        endpoint: 'http://wan2gp:12001',
        status: 'online',
        capabilities: ['video-generation', 'ai-content'],
        version: '1.0.0',
        lastSeen: new Date().toISOString()
      }
    ];
  }
}