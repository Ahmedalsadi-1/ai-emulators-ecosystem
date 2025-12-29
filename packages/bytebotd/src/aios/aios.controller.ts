import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AIOSService, AIOSStatus } from './aios.service';

@Controller('aios')
export class AIOSController {
  private readonly logger = new Logger(AIOSController.name);

  constructor(private readonly aiosService: AIOSService) {}

  @Get('status')
  async getStatus(): Promise<AIOSStatus> {
    try {
      return await this.aiosService.getStatus();
    } catch (error) {
      this.logger.error(`Error getting AIOS status: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get AIOS status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('core/status')
  async getCoreStatus(): Promise<any> {
    try {
      return await this.aiosService.getCoreStatus();
    } catch (error) {
      this.logger.error(`Error getting AIOS core status: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get AIOS core status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('llms')
  async listLLMs(): Promise<any> {
    try {
      const llms = await this.aiosService.listLLMs();
      return { llms, status: 'success' };
    } catch (error) {
      this.logger.error(`Error listing AIOS LLMs: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to list AIOS LLMs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('llms/select')
  async selectLLMs(@Body() body: { llms: any[] }): Promise<any> {
    try {
      const result = await this.aiosService.selectLLMs(body.llms);
      return result;
    } catch (error) {
      this.logger.error(`Error selecting AIOS LLMs: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to select AIOS LLMs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('llms/selected')
  async getSelectedLLMs(): Promise<any> {
    try {
      const llms = await this.aiosService.getSelectedLLMs();
      return { llms, status: 'success' };
    } catch (error) {
      this.logger.error(`Error getting selected AIOS LLMs: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get selected AIOS LLMs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('agents/submit')
  async submitAgent(@Body() body: { agent_id: string; agent_config: any }): Promise<any> {
    try {
      const result = await this.aiosService.submitAgent(body.agent_id, body.agent_config);
      return result;
    } catch (error) {
      this.logger.error(`Error submitting AIOS agent: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to submit AIOS agent: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('agents/:executionId/status')
  async getAgentStatus(@Param('executionId') executionId: string): Promise<any> {
    try {
      const result = await this.aiosService.getAgentStatus(parseInt(executionId, 10));
      return result;
    } catch (error) {
      this.logger.error(`Error getting AIOS agent status: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get AIOS agent status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('agents/ps')
  async listAgentProcesses(): Promise<any> {
    try {
      return await this.aiosService.listAgentProcesses();
    } catch (error) {
      this.logger.error(`Error listing AIOS agent processes: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to list AIOS agent processes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('core/refresh')
  async refreshConfiguration(): Promise<any> {
    try {
      const result = await this.aiosService.refreshConfiguration();
      return result;
    } catch (error) {
      this.logger.error(`Error refreshing AIOS configuration: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to refresh AIOS configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}