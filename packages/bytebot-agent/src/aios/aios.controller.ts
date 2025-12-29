import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  HttpException,
} from '@nestjs/common';
import { AiosService, AIAgent, MCPIntegration, MultiAgentCoordination } from './aios.service';

@Controller('aios')
export class AiosController {
  constructor(private readonly aiosService: AiosService) {}

  @Get('agents')
  @HttpCode(HttpStatus.OK)
  async getAgents(): Promise<AIAgent[]> {
    try {
      return await this.aiosService.getAgents();
    } catch (error: any) {
      throw new HttpException(
        `Failed to get AI agents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('agents/:id')
  @HttpCode(HttpStatus.OK)
  async getAgent(@Param('id') id: string): Promise<AIAgent | null> {
    try {
      const agent = await this.aiosService.getAgent(id);
      if (!agent) {
        throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      }
      return agent;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to get agent: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('agents')
  @HttpCode(HttpStatus.CREATED)
  async createAgent(@Body() agentData: Partial<AIAgent>): Promise<AIAgent> {
    try {
      return await this.aiosService.createAgent(agentData);
    } catch (error: any) {
      throw new HttpException(
        `Failed to create agent: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('agents/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateAgentStatus(
    @Param('id') id: string,
    @Body() body: { status: AIAgent['status'] },
  ): Promise<AIAgent | null> {
    try {
      const agent = await this.aiosService.updateAgentStatus(id, body.status);
      if (!agent) {
        throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      }
      return agent;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to update agent status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('mcp-integrations')
  @HttpCode(HttpStatus.OK)
  async getMCPIntegrations(): Promise<MCPIntegration[]> {
    try {
      return await this.aiosService.getMCPIntegrations();
    } catch (error: any) {
      throw new HttpException(
        `Failed to get MCP integrations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('mcp-integrations')
  @HttpCode(HttpStatus.CREATED)
  async addMCPIntegration(@Body() integration: Omit<MCPIntegration, 'id'>): Promise<MCPIntegration> {
    try {
      return await this.aiosService.addMCPIntegration(integration);
    } catch (error: any) {
      throw new HttpException(
        `Failed to add MCP integration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('mcp-integrations/:id/test')
  @HttpCode(HttpStatus.OK)
  async testMCPIntegration(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      const success = await this.aiosService.testMCPIntegration(id);
      return { success };
    } catch (error: any) {
      throw new HttpException(
        `Failed to test MCP integration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('coordination')
  @HttpCode(HttpStatus.CREATED)
  async createCoordinationSession(
    @Body() body: {
      coordinator: string;
      agents: string[];
      tasks: string[];
    },
  ): Promise<MultiAgentCoordination> {
    try {
      return await this.aiosService.createCoordinationSession(
        body.coordinator,
        body.agents,
        body.tasks,
      );
    } catch (error: any) {
      throw new HttpException(
        `Failed to create coordination session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('coordination/:sessionId')
  @HttpCode(HttpStatus.OK)
  async getCoordinationSession(@Param('sessionId') sessionId: string): Promise<MultiAgentCoordination | null> {
    try {
      const session = await this.aiosService.getCoordinationSession(sessionId);
      if (!session) {
        throw new HttpException('Coordination session not found', HttpStatus.NOT_FOUND);
      }
      return session;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to get coordination session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('coordination/:sessionId/status')
  @HttpCode(HttpStatus.OK)
  async updateCoordinationStatus(
    @Param('sessionId') sessionId: string,
    @Body() body: { status: MultiAgentCoordination['status'] },
  ): Promise<{ success: boolean }> {
    try {
      const success = await this.aiosService.updateCoordinationStatus(sessionId, body.status);
      if (!success) {
        throw new HttpException('Coordination session not found', HttpStatus.NOT_FOUND);
      }
      return { success };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to update coordination status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getSystemStatus(): Promise<any> {
    try {
      return await this.aiosService.getSystemStatus();
    } catch (error: any) {
      throw new HttpException(
        `Failed to get system status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async executeCommand(@Body() body: { command: string; parameters?: any }): Promise<any> {
    try {
      return await this.aiosService.executeCommand(body.command, body.parameters || {});
    } catch (error: any) {
      throw new HttpException(
        `Failed to execute command: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}