import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Query,
  HttpException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Message, Task } from '@prisma/client';
import { AddTaskMessageDto } from './dto/add-task-message.dto';
import { MessagesService } from '../messages/messages.service';
import { ANTHROPIC_MODELS } from '../anthropic/anthropic.constants';
import { OPENAI_MODELS } from '../openai/openai.constants';
import { GOOGLE_MODELS } from '../google/google.constants';
import { GROQ_MODELS } from '../groq/groq.constants';
import { ROUTEWAY_MODELS } from '../routeway/routeway.constants';
import { OLLAMA_MODELS } from '../ollama/ollama.constants';
import { OPENCODE_MODELS } from '../opencode/opencode.constants';
import { BytebotAgentModel } from 'src/agent/agent.types';
import { ConfigService } from '@nestjs/config';
import { PerformanceMonitorService } from '../agent/performance-monitor.service';

const proxyUrl = process.env.BYTEBOT_LLM_PROXY_URL;

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('statuses') statuses?: string,
  ): Promise<{ tasks: Task[]; total: number; totalPages: number }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Handle both single status and multiple statuses
    let statusFilter: string[] | undefined;
    if (statuses) {
      statusFilter = statuses.split(',');
    } else if (status) {
      statusFilter = [status];
    }

    return this.tasksService.findAll(pageNum, limitNum, statusFilter);
  }

  @Get('models')
  async getModels() {
    // Build models array dynamically using process.env
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    const routewayApiKey = process.env.ROUTEWAY_API_KEY;

    let dynamicModels: any[] = [];

    // Add models conditionally
    if (anthropicApiKey) {
      dynamicModels = [...dynamicModels, ...ANTHROPIC_MODELS];
    }
    if (openaiApiKey) {
      dynamicModels = [...dynamicModels, ...OPENAI_MODELS];
    }
    if (geminiApiKey) {
      dynamicModels = [...dynamicModels, ...GOOGLE_MODELS];
    }
    if (groqApiKey) {
      dynamicModels = [...dynamicModels, ...GROQ_MODELS];
    }
    if (routewayApiKey) {
      dynamicModels = [...dynamicModels, ...ROUTEWAY_MODELS];
    }

    // Always add Ollama and OpenCode models
    dynamicModels = [...dynamicModels, ...OLLAMA_MODELS];
    dynamicModels = [...dynamicModels, ...OPENCODE_MODELS];

    return dynamicModels;
  }

  @Get('performance')
  async getPerformanceMetrics(
    @Query('provider') provider?: string,
    @Query('model') model?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return {
      metrics: this.performanceMonitor.getMetrics(provider, model, limitNum),
      stats: this.performanceMonitor.getProviderStats(provider),
      recentErrors: this.performanceMonitor.getRecentErrors(5),
      topSlowest: this.performanceMonitor.getTopSlowest(5),
    };
  }

  @Post('/browseros/connect')
  @HttpCode(HttpStatus.OK)
  async connectBrowserOSSimple(): Promise<{ success: boolean; message: string }> {
    try {
      // Validate BYTEBOT_DESKTOP_BASE_URL is set
      const desktopUrl = process.env.BYTEBOT_DESKTOP_BASE_URL || 'http://localhost:9990';

      // Check for common environment variable issues
      const warnings: string[] = [];
      
      if (!process.env.BROWSEROS_APP_COMMAND) {
        warnings.push('BROWSEROS_APP_COMMAND environment variable is not set (using default: "browseros")');
      }
      
      if (!process.env.BYTEBOT_DESKTOP_VNC_URL) {
        warnings.push('BYTEBOT_DESKTOP_VNC_URL environment variable is not set - VNC connection may fail');
      }

      // Make direct call to computer-use service to launch BrowserOS
      const response = await fetch(`${desktopUrl}/computer-use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'application',
          application: 'browseros',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to launch BrowserOS: ${response.status} ${errorText}`;
        
        // Add helpful context for common issues
        if (response.status === 404) {
          errorMessage += ' - bytebotd service may not be running or BYTEBOT_DESKTOP_BASE_URL is incorrect';
        } else if (response.status === 500) {
          errorMessage += ' - BrowserOS application may not be installed or BROWSEROS_APP_COMMAND is incorrect';
        }
        
        throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      let successMessage = 'BrowserOS launched successfully';
      if (warnings.length > 0) {
        successMessage += ` (warnings: ${warnings.join(', ')})`;
      }

      return {
        success: true,
        message: successMessage,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to connect to BrowserOS: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/messages')
  async taskMessages(
    @Param('id') taskId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<Message[]> {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    };

    const messages = await this.messagesService.findAll(taskId, options);
    return messages;
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async addTaskMessage(
    @Param('id') taskId: string,
    @Body() guideTaskDto: AddTaskMessageDto,
  ): Promise<Task> {
    return this.tasksService.addTaskMessage(taskId, guideTaskDto);
  }

  @Get(':id/messages/raw')
  async taskRawMessages(
    @Param('id') taskId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<Message[]> {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    };

    return this.messagesService.findRawMessages(taskId, options);
  }

  @Get(':id/messages/processed')
  async taskProcessedMessages(
    @Param('id') taskId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<any[]> {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    };

    return this.messagesService.findProcessedMessages(taskId, options);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.tasksService.delete(id);
  }



  @Post('aios/connect')
  @HttpCode(HttpStatus.OK)
  async connectAIOS(): Promise<{ success: boolean; message: string }> {
    try {
      // Validate BYTEBOT_DESKTOP_BASE_URL is set
      const desktopUrl = this.configService.get<string>('BYTEBOT_DESKTOP_BASE_URL');
      if (!desktopUrl) {
        throw new HttpException(
          'BYTEBOT_DESKTOP_BASE_URL environment variable is not configured. Please set it to the bytebotd service URL (e.g., http://localhost:9990).',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Make direct call to computer-use service to launch AIOS
      const response = await fetch(`${desktopUrl}/computer-use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'application',
          application: 'aios',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `Failed to launch AIOS: ${response.status} ${errorText}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        message: 'AIOS launched successfully',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to connect to AIOS: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/takeover')
  @HttpCode(HttpStatus.OK)
  async takeOver(@Param('id') taskId: string): Promise<Task> {
    return this.tasksService.takeOver(taskId);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(@Param('id') taskId: string): Promise<Task> {
    return this.tasksService.resume(taskId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') taskId: string): Promise<Task> {
    return this.tasksService.cancel(taskId);
  }
}