import { Router } from 'express';
import { MCPService } from '../services/mcp';

const router = Router();
const mcpService = new MCPService();

// Get all MCP servers
router.get('/servers', async (req, res) => {
  try {
    const servers = await mcpService.getAllServers();
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MCP servers for a project
router.get('/servers/project/:project', async (req, res) => {
  try {
    const { project } = req.params;
    const servers = await mcpService.getServersByProject(project);
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register MCP server
router.post('/servers', async (req, res) => {
  try {
    const serverData = req.body;
    const server = await mcpService.registerServer(serverData);
    res.json(server);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MCP server status
router.get('/servers/:serverId/status', async (req, res) => {
  try {
    const { serverId } = req.params;
    const status = await mcpService.getServerStatus(serverId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as mcpRoutes };