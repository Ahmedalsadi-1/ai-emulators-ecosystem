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
  Logger,
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
  private readonly logger = new Logger(TasksController.name);

  // Fallback chain: Routeway → Groq → OpenAI (Anthropic EXCLUDED)
  private readonly FALLBACK_CHAIN: { provider: string; name: string }[] = [
    { provider: 'routeway', name: 'deepseek/deepseek-chat-v3.2' },
    { provider: 'groq', name: 'llama-3.3-70b-versatile' },
    { provider: 'openai', name: 'gpt-4o' },
  ];

  constructor(
    private readonly tasksService: TasksService,
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {}

  private isFallbackableError(error: any): boolean {
    const status = error.status || error.statusCode;
    const message = error.message || '';

    return (
      status === 422 ||
      status === 429 ||
      status >= 500 ||
      message.includes('timeout') ||
      message.includes('TIMEOUT') ||
      message.includes('Timeout') ||
      message.includes('rate limit') ||
      message.includes('Rate limit') ||
      message.includes('overloaded') ||
      message.includes('context length') ||
      message.includes('token limit')
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    const originalModel = createTaskDto.model;
    let lastError: any;

    // Try original model first
    try {
      return await this.tasksService.create(createTaskDto);
    } catch (error) {
      lastError = error;

      // Check if fallbackable error
      if (this.isFallbackableError(error)) {
        this.logger.log(
          `Model ${originalModel?.provider}/${originalModel?.name} failed with ${error.status || 'unknown'}, attempting fallback chain`,
        );

        // Try fallback chain (Routeway → Groq → OpenAI)
        for (const fallback of this.FALLBACK_CHAIN) {
          // Skip if same as original model
          if (
            originalModel &&
            originalModel.provider === fallback.provider &&
            originalModel.name === fallback.name
          ) {
            continue;
          }

          // Skip Anthropic (not in fallback chain)
          if (fallback.provider === 'anthropic') {
            continue;
          }

          try {
            const fallbackDto = { ...createTaskDto, model: fallback };
            this.logger.log(
              `FALLBACK: Trying ${fallback.provider}/${fallback.name} instead of ${originalModel?.provider}/${originalModel?.name}`,
            );

            const result = await this.tasksService.create(fallbackDto);

            this.logger.log(
              `FALLBACK SUCCESS: ${fallback.provider}/${fallback.name} succeeded after ${originalModel?.provider}/${originalModel?.name} failed`,
            );

            // Record fallback metric
            this.performanceMonitor.recordFallback(
              originalModel?.provider || 'unknown',
              originalModel?.name || 'unknown',
              fallback.provider,
              fallback.name,
            );

            return result;
          } catch (fallbackError) {
            this.logger.debug(
              `FALLBACK FAILED: ${fallback.provider}/${fallback.name} failed with ${fallbackError.status || 'unknown'}`,
            );
            lastError = fallbackError;
            continue;
          }
        }
      }

      // No fallback worked, throw original error
      throw lastError;
    }
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
  async getModels(@Query('toolCalling') toolCalling?: string) {
    // Build models array dynamically using process.env
    // NOTE: Anthropic models are EXCLUDED - Routeway → Groq → OpenAI chain only
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    const routewayApiKey = process.env.ROUTEWAY_API_KEY;
    const omniparserEnabled = process.env.OMNIPARSER_ENABLED === 'true';

    console.log('[Models] API Keys check:', {
      anthropic: false, // Explicitly excluded
      openai: !!openaiApiKey,
      gemini: !!geminiApiKey,
      groq: !!groqApiKey,
      routeway: !!routewayApiKey
    });

    let dynamicModels: any[] = [];

    // NOTE: Anthropic models are EXCLUDED - no fallback to Anthropic allowed
    // Only Routeway → Groq → OpenAI chain is supported
    if (openaiApiKey) {
      dynamicModels = [...dynamicModels, ...OPENAI_MODELS];
    }
    if (geminiApiKey) {
      dynamicModels = [...dynamicModels, ...GOOGLE_MODELS];
    }
    if (groqApiKey) {
      console.log('[Models] Adding GROQ models:', GROQ_MODELS.length);
      dynamicModels = [...dynamicModels, ...GROQ_MODELS];
    }
    if (routewayApiKey) {
      console.log('[Models] Adding ROUTEWAY models:', ROUTEWAY_MODELS.length);
      dynamicModels = [...dynamicModels, ...ROUTEWAY_MODELS];
    }

    console.log('[Models] Total models so far:', dynamicModels.length);

    // Always add Ollama and OpenCode models
    dynamicModels = [...dynamicModels, ...OLLAMA_MODELS];
    dynamicModels = [...dynamicModels, ...OPENCODE_MODELS];

    if (proxyUrl) {
      try {
        const response = await fetch(`${proxyUrl}/model/info`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const proxyModels = await response.json();
          const proxyModelList: BytebotAgentModel[] = (proxyModels.data || [])
            .map((model: any) => {
              const name =
                model.litellm_params?.model || model.id || model.model_name;
              const title = model.model_name || name;
              const lowered = String(name || '').toLowerCase();
              const supportsTool =
                model.supports_function_calling ??
                model.litellm_params?.supports_function_calling ??
                false;
              const isVision =
                lowered.includes('vision') || lowered.includes('vl');
              const nameImpliesTool = [
                'ui-tars',
                'tars',
                'gpt',
                'gemini',
                'claude',
                'deepseek',
                'qwen',
                'llama',
                'mixtral',
              ].some((token) => lowered.includes(token));

              return {
                provider: 'proxy',
                name,
                title: `${title} (Proxy)`,
                contextWindow: model.context_window || 128000,
                capabilities: {
                  toolCalling: Boolean(supportsTool || nameImpliesTool),
                  vision: isVision,
                  omniparser: omniparserEnabled && isVision,
                  streaming: true,
                },
              };
            })
            .filter((model: BytebotAgentModel) => Boolean(model.name));

          dynamicModels = [...dynamicModels, ...proxyModelList];
        } else {
          this.logger.warn(`Proxy model fetch failed: ${response.status}`);
        }
      } catch (error) {
        this.logger.warn(
          `Proxy model fetch error: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    // Fetch LM Studio models from the configured URL
    const lmStudioBaseUrl = process.env.LM_STUDIO_BASE_URL || 'http://192.168.1.118:1234';
    try {
      console.log('[Models] Fetching LM Studio models from:', lmStudioBaseUrl);
      const response = await fetch(`${lmStudioBaseUrl}/v1/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json() as { data: Array<{ id: string }> };
        const lmStudioModels = (data.data || []).map((model) => ({
          provider: 'lm-studio',
          name: model.id,
          title: `${model.id} (LM Studio Local)`,
          contextWindow: 32768,
          capabilities: {
            toolCalling: true,
            vision: model.id.includes('vl') || model.id.includes('vision'),
            omniparser: omniparserEnabled && (model.id.includes('vl') || model.id.includes('vision')),
            streaming: true,
          },
        }));
        console.log('[Models] Found LM Studio models:', lmStudioModels.length);
        dynamicModels = [...dynamicModels, ...lmStudioModels];
      } else {
        console.log('[Models] LM Studio returned:', response.status);
      }
    } catch (error) {
      console.log('[Models] LM Studio not available:', error instanceof Error ? error.message : error);
    }

    if (omniparserEnabled) {
      dynamicModels = dynamicModels.map((model) => ({
        ...model,
        capabilities: {
          ...model.capabilities,
          omniparser: Boolean(model.capabilities?.vision),
        },
      }));
    }

    // Filter for tool-capable models if requested
    if (toolCalling === 'true') {
      dynamicModels = dynamicModels.filter((model) => 
        model.capabilities?.toolCalling === true
      );
      console.log('[Models] Filtered to tool-capable models:', dynamicModels.length);
    }

    console.log('[Models] Total models:', dynamicModels.length);
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
