import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FactifAIService, FactifAIStatus, FactifAIChatResponse } from './factif-ai.service';

@Controller('factif-ai')
export class FactifAIController {
  private readonly logger = new Logger(FactifAIController.name);

  constructor(private readonly factifAIService: FactifAIService) {}

  @Get('status')
  async getStatus(): Promise<FactifAIStatus> {
    try {
      return await this.factifAIService.getStatus();
    } catch (error) {
      this.logger.error(`Error getting Factif-AI status: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get Factif-AI status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('modes')
  async getAvailableModes(): Promise<any> {
    try {
      return await this.factifAIService.getAvailableModes();
    } catch (error) {
      this.logger.error(`Error getting Factif-AI modes: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get Factif-AI modes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('modes')
  async setMode(@Body() body: { mode: string }): Promise<any> {
    try {
      const result = await this.factifAIService.setMode(body.mode);
      return result;
    } catch (error) {
      this.logger.error(`Error setting Factif-AI mode: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to set Factif-AI mode: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chat')
  async sendChatMessage(
    @Body() body: { message: string; mode?: string; context?: any }
  ): Promise<FactifAIChatResponse> {
    try {
      const result = await this.factifAIService.sendChatMessage(
        body.message,
        body.mode,
        body.context
      );
      return result;
    } catch (error) {
      this.logger.error(`Error sending chat message to Factif-AI: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to send chat message to Factif-AI: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('explore/action')
  async exploreAction(@Body() action: any): Promise<any> {
    try {
      return await this.factifAIService.exploreAction(action);
    } catch (error) {
      this.logger.error(`Error executing explore action in Factif-AI: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to execute explore action in Factif-AI: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  async getChatHistory(): Promise<any> {
    try {
      return await this.factifAIService.getChatHistory();
    } catch (error) {
      this.logger.error(`Error getting chat history from Factif-AI: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get chat history from Factif-AI: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('history')
  async clearChatHistory(): Promise<any> {
    try {
      return await this.factifAIService.clearChatHistory();
    } catch (error) {
      this.logger.error(`Error clearing chat history in Factif-AI: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to clear chat history in Factif-AI: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('actions/execute')
  async executeAction(@Body() action: any): Promise<any> {
    try {
      return await this.factifAIService.executeAction(action);
    } catch (error) {
      this.logger.error(`Error executing action in Factif-AI: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to execute action in Factif-AI: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('filesystem')
  async getFileSystemInfo(@Query('path') path?: string): Promise<any> {
    try {
      return await this.factifAIService.getFileSystemInfo(path);
    } catch (error) {
      this.logger.error(`Error getting filesystem info from Factif-AI: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get filesystem info from Factif-AI: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


}