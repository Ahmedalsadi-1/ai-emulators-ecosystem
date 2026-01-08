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
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Message, Task } from '@prisma/client';
import { AddTaskMessageDto } from './dto/add-task-message.dto';
import { MessagesService } from '../messages/messages.service';
import { BytebotAgentModel } from 'src/agent/agent.types';
import { GROQ_MODELS } from '../groq/groq.constants';
import { ROUTEWAY_MODELS } from '../routeway/routeway.constants';
import { OLLAMA_MODELS } from '../ollama/ollama.constants';
import { OPENCODE_MODELS } from '../opencode/opencode.constants';

const proxyUrl = process.env.BYTEBOT_LLM_PROXY_URL;

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly messagesService: MessagesService,
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
  async getModels(@Query('toolCalling') toolCalling?: string) {
    // Build models array dynamically using process.env
    const allModels: BytebotAgentModel[] = [];

    // 1. LiteLLM proxy models
    if (proxyUrl) {
      try {
        const response = await fetch(`${proxyUrl}/models`, {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          const data = await response.json();
          const proxyModels = (data.data || []).map((model: any) => ({
            provider: 'proxy' as const,
            name: model.id || model.id,
            title: `${model.id || model.id} (Proxy)`,
            contextWindow: model.contextWindow || 128000,
            capabilities: {
              toolCalling: true,
              vision: model.id.includes('vl') || model.id.includes('vision'),
              omniparser: model.id.includes('vl') || model.id.includes('vision'),
              streaming: true,
            },
          }));
          allModels.push(...proxyModels);
          console.log('[Models] Proxy: ' + proxyModels.length + ' models');
        }
      } catch (error) {
        console.log('[Models] Proxy not available:', error instanceof Error ? error.message : error);
      }
    }

    // 2. LM Studio models
    const lmStudioBaseUrl = process.env.LM_STUDIO_BASE_URL || 'http://192.168.1.118:1234';
    try {
      const response = await fetch(`${lmStudioBaseUrl}/v1/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json() as { data: Array<{ id: string }> };
        const lmStudioModels = (data.data || []).map((model) => ({
          provider: 'lm-studio' as const,
          name: model.id,
          title: `${model.id} (LM Studio Local)`,
          contextWindow: 32768,
          capabilities: {
            toolCalling: true,
            vision: model.id.includes('vl') || model.id.includes('vision'),
            omniparser: model.id.includes('vl') || model.id.includes('vision'),
            streaming: true,
          },
        }));
        console.log('[Models] LM Studio: ' + lmStudioModels.length + ' models');
        allModels.push(...lmStudioModels);
      }
    } catch (error) {
      console.log('[Models] LM Studio not available:', error instanceof Error ? error.message : error);
    }

    // 3. Ollama models
    const ollamaHost = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
    try {
      console.log('[Models] Fetching Ollama models from:', ollamaHost);
      const response = await fetch(`${ollamaHost}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const ollamaModels = (data.models || []).map((model: any) => ({
          provider: 'ollama-local' as const,
          name: model.name,
          title: `${model.name} (Ollama Local)`,
          contextWindow: 4096,
          capabilities: {
            toolCalling: false,
            vision: false,
            streaming: true,
          },
        }));
        console.log('[Models] Ollama: ' + ollamaModels.length + ' models');
        allModels.push(...ollamaModels);
      } else {
        console.log('[Models] Ollama returned:', response.status);
      }
    } catch (error) {
      console.log('[Models] Ollama not available:', error instanceof Error ? error.message : error);
    }

    // 4. Groq models
    const groqModels = GROQ_MODELS.map(m => ({ ...m, provider: 'groq' as const }));
    console.log('[Models] Groq: ' + groqModels.length + ' models');
    allModels.push(...groqModels);

    // 5. Routeway models
    const routewayModels = ROUTEWAY_MODELS.map(m => ({ ...m, provider: 'routeway' as const }));
    console.log('[Models] Routeway: ' + routewayModels.length + ' models');
    allModels.push(...routewayModels);

    // 6. OpenCode models
    const opencodeModels = OPENCODE_MODELS.map(m => ({ ...m, provider: 'opencode-local' as const }));
    console.log('[Models] OpenCode: ' + opencodeModels.length + ' models');
    allModels.push(...opencodeModels);

    // Filter for tool-capable models if requested
    if (toolCalling === 'true') {
      const filtered = allModels.filter((model) =>
        model.capabilities?.toolCalling === true
      );
      console.log('[Models] Filtered to tool-capable models:', filtered.length);
      return filtered;
    }

    console.log('[Models] Total models:', allModels.length);
    return allModels;
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findById(id);
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
  ) {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    };

    return this.messagesService.findProcessedMessages(taskId, options);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.tasksService.delete(id);
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
