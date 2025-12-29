import { TasksService } from '../tasks/tasks.service';
import { MessagesService } from '../messages/messages.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  Message,
  Role,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import { AnthropicService } from '../anthropic/anthropic.service';
import {
  isComputerToolUseContentBlock,
  isSetTaskStatusToolUseBlock,
  isCreateTaskToolUseBlock,
  SetTaskStatusToolUseBlock,
} from '@bytebot/shared';

import {
  MessageContentBlock,
  MessageContentType,
  ToolResultContentBlock,
  TextContentBlock,
} from '@bytebot/shared';
import { InputCaptureService } from './input-capture.service';
import { OnEvent } from '@nestjs/event-emitter';
import { OpenAIService } from '../openai/openai.service';
import { GoogleService } from '../google/google.service';
import { GroqService } from '../groq/groq.service';
import { OllamaService } from '../ollama/ollama.service';
import { OpenCodeService } from '../opencode/opencode.service';
import { RoutewayService } from '../routeway/routeway.service';
import {
  BytebotAgentModel,
  BytebotAgentService,
  BytebotAgentResponse,
} from './agent.types';
import {
  AGENT_SYSTEM_PROMPT,
  SUMMARIZATION_SYSTEM_PROMPT,
} from './agent.constants';
import { SummariesService } from '../summaries/summaries.service';
import { handleComputerToolUse } from './agent.computer-use';
import { ProxyService } from '../proxy/proxy.service';
import { PerformanceMonitorService } from './performance-monitor.service';

@Injectable()
export class AgentProcessor {
  private readonly logger = new Logger(AgentProcessor.name);
  private currentTaskId: string | null = null;
  private isProcessing = false;
  private abortController: AbortController | null = null;
  private services: Record<string, BytebotAgentService> = {};

  constructor(
    private readonly tasksService: TasksService,
    private readonly messagesService: MessagesService,
    private readonly summariesService: SummariesService,
    private readonly anthropicService: AnthropicService,
    private readonly openaiService: OpenAIService,
    private readonly googleService: GoogleService,
    private readonly groqService: GroqService,
    private readonly proxyService: ProxyService,
    private readonly ollamaService: OllamaService,
    private readonly openCodeService: OpenCodeService,
    private readonly routewayService: RoutewayService,
    private readonly inputCaptureService: InputCaptureService,
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {
    console.log('🚀 AgentProcessor constructor called!');
    console.log('🔧 Services injected:', {
      groq: !!this.groqService,
      anthropic: !!this.anthropicService,
      openai: !!this.openaiService,
      google: !!this.googleService,
      routeway: !!this.routewayService,
    });
    this.logger.log('AgentProcessor constructor called');
    this.logger.log('GroqService injected:', !!this.groqService);

    this.services = {
      anthropic: this.anthropicService,
      openai: this.openaiService,
      google: this.googleService,
      groq: this.groqService,
      proxy: this.proxyService,
      'ollama-local': this.ollamaService,
      'opencode-local': this.openCodeService,
      routeway: this.routewayService,
    };

    // Debug: Log which services are actually available
    console.log('=== SERVICE INJECTION STATUS ===');
    console.log('anthropic:', !!this.anthropicService);
    console.log('openai:', !!this.openaiService);
    console.log('google:', !!this.googleService);
    console.log('groq:', !!this.groqService);
    console.log('proxy:', !!this.proxyService);
    console.log('ollama:', !!this.ollamaService);
    console.log('opencode:', !!this.openCodeService);
    console.log('routeway:', !!this.routewayService);
    console.log('================================');

    // Force log to stdout
    process.stdout.write('SERVICES MAP: ' + JSON.stringify(Object.keys(this.services)) + '\n');
    this.logger.log('Services registered:', Object.keys(this.services));
    this.logger.log('AgentProcessor initialized');
  }

  /**
   * Check if the processor is currently processing a task
   */
  isRunning(): boolean {
    return this.isProcessing;
  }

  /**
   * Get the current task ID being processed
   */
  getCurrentTaskId(): string | null {
    return this.currentTaskId;
  }

  @OnEvent('task.takeover')
  handleTaskTakeover({ taskId }: { taskId: string }) {
    this.logger.log(`Task takeover event received for task ID: ${taskId}`);

    // If the agent is still processing this task, abort any in-flight operations
    if (this.currentTaskId === taskId && this.isProcessing) {
      this.abortController?.abort();
    }

    // Always start capturing user input so that emitted actions are received
    this.inputCaptureService.start(taskId);
  }

  @OnEvent('task.resume')
  handleTaskResume({ taskId }: { taskId: string }) {
    if (this.currentTaskId === taskId && this.isProcessing) {
      this.logger.log(`Task resume event received for task ID: ${taskId}`);
      this.abortController = new AbortController();

      void this.runIteration(taskId);
    }
  }

  @OnEvent('task.cancel')
  async handleTaskCancel({ taskId }: { taskId: string }) {
    this.logger.log(`Task cancel event received for task ID: ${taskId}`);

    await this.stopProcessing();
  }

  processTask(taskId: string) {
    this.logger.log(`Starting processing for task ID: ${taskId}`);

    if (this.isProcessing) {
      this.logger.warn('AgentProcessor is already processing another task');
      return;
    }

    this.isProcessing = true;
    this.currentTaskId = taskId;
    this.abortController = new AbortController();

    // Kick off the first iteration without blocking the caller
    void this.runIteration(taskId);
  }

  /**
   * Runs a single iteration of task processing and schedules the next
   * iteration via setImmediate while the task remains RUNNING.
   */
  private async runIteration(taskId: string): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    let currentModel: BytebotAgentModel | null = null;

    try {
      const task: Task = await this.tasksService.findById(taskId);

      if (task.status !== TaskStatus.RUNNING) {
        this.logger.log(
          `Task processing completed for task ID: ${taskId} with status: ${task.status}`,
        );
        this.isProcessing = false;
        this.currentTaskId = null;
        return;
      }

      this.logger.log(`Processing iteration for task ID: ${taskId}`);

      // Refresh abort controller for this iteration to avoid accumulating
      // "abort" listeners on a single AbortSignal across iterations.
      this.abortController = new AbortController();

      const latestSummary = await this.summariesService.findLatest(taskId);
      const unsummarizedMessages =
        await this.messagesService.findUnsummarized(taskId);
      const messages = [
        ...(latestSummary
          ? [
              {
                id: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                taskId,
                summaryId: null,
                role: Role.USER,
                content: [
                  {
                    type: MessageContentType.Text,
                    text: latestSummary.content,
                  },
                ],
              },
            ]
          : []),
        ...unsummarizedMessages,
      ];
      this.logger.debug(
        `Sending ${messages.length} messages to LLM for processing`,
      );

      currentModel = task.model as unknown as BytebotAgentModel;
      const model = currentModel;
      let agentResponse: BytebotAgentResponse | undefined;

      // DEBUG: Check services map
      const availableServices = Object.keys(this.services);
      const requestedProvider = model.provider;

      if (!this.services[requestedProvider]) {
        this.logger.error(`Service not found. Available: ${availableServices.join(', ')}, Requested: ${requestedProvider}`);
        // Try to find similar keys
        const similar = availableServices.filter(s => s.includes('groq') || s.includes('q'));
        if (similar.length > 0) {
          this.logger.error(`Similar services found: ${similar.join(', ')}`);
        }
      }

      console.log('=== SERVICE LOOKUP DEBUG ===');
      console.log('Requested provider:', model.provider);
      console.log('Available services:', Object.keys(this.services));
      console.log('Service found:', !!this.services[model.provider]);

      const service = this.services[model.provider];
      if (!service) {
        console.log('SERVICE NOT FOUND - Failing task');
        this.logger.error(
          `No service found for model provider: ${model.provider}. Available services: ${Object.keys(this.services).join(', ')}`,
        );
        await this.tasksService.update(taskId, {
          status: TaskStatus.FAILED,
        });
        this.isProcessing = false;
        this.currentTaskId = null;
        return;
      }

       console.log('Using service for provider:', model.provider);

       // Check if model supports tool calling
       const supportsToolCalling = model.capabilities?.toolCalling ?? true; // Default to true for backward compatibility
       if (!supportsToolCalling) {
         this.logger.warn(`Model ${model.name} does not support tool calling, disabling tools`);
       }

       // Performance monitoring
       const startTime = Date.now();
       let success = false;

       try {
         agentResponse = await service.generateMessage(
           AGENT_SYSTEM_PROMPT,
           messages,
           model.name,
           supportsToolCalling,
           this.abortController.signal,
         );
         success = true;
       } catch (error) {
         success = false;
         throw error;
       } finally {
         const responseTime = Date.now() - startTime;
         this.performanceMonitor.recordMetrics({
           provider: model.provider,
           model: model.name,
           responseTime,
           inputTokens: agentResponse?.tokenUsage?.inputTokens || 0,
           outputTokens: agentResponse?.tokenUsage?.outputTokens || 0,
           totalTokens: agentResponse?.tokenUsage?.totalTokens || 0,
           success,
         });
       }

      const messageContentBlocks = agentResponse.contentBlocks;

      this.logger.debug(
        `Received ${messageContentBlocks.length} content blocks from LLM`,
      );

      if (messageContentBlocks.length === 0) {
        this.logger.warn(
          `Task ID: ${taskId} received no content blocks from LLM, marking as failed`,
        );
        await this.tasksService.update(taskId, {
          status: TaskStatus.FAILED,
        });
        this.isProcessing = false;
        this.currentTaskId = null;
        return;
      }

      await this.messagesService.create({
        content: messageContentBlocks,
        role: Role.ASSISTANT,
        taskId,
      });

      // Calculate if we need to summarize based on token usage
      const contextWindow = model.contextWindow || 200000; // Default to 200k if not specified
      const contextThreshold = contextWindow * 0.75;
      const shouldSummarize =
        agentResponse.tokenUsage.totalTokens >= contextThreshold;

      if (shouldSummarize) {
        try {
          // After we've successfully generated a response, we can summarize the unsummarized messages
          const summaryResponse = await service.generateMessage(
            SUMMARIZATION_SYSTEM_PROMPT,
            [
              ...messages,
              {
                id: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                taskId,
                summaryId: null,
                role: Role.USER,
                content: [
                  {
                    type: MessageContentType.Text,
                    text: 'Respond with a summary of the messages above. Do not include any additional information.',
                  },
                ],
              },
            ],
            model.name,
            false,
            this.abortController.signal,
          );

          const summaryContentBlocks = summaryResponse.contentBlocks;

          this.logger.debug(
            `Received ${summaryContentBlocks.length} summary content blocks from LLM`,
          );
          const summaryContent = summaryContentBlocks
            .filter(
              (block: MessageContentBlock) =>
                block.type === MessageContentType.Text,
            )
            .map((block: TextContentBlock) => block.text)
            .join('\n');

          const summary = await this.summariesService.create({
            content: summaryContent,
            taskId,
          });

          await this.messagesService.attachSummary(taskId, summary.id, [
            ...messages.map((message) => {
              return message.id;
            }),
          ]);

          this.logger.log(
            `Generated summary for task ${taskId} due to token usage (${agentResponse.tokenUsage.totalTokens}/${contextWindow})`,
          );
        } catch (error: any) {
          this.logger.error(
            `Error summarizing messages for task ID: ${taskId}`,
            error.stack,
          );
        }
      }

      this.logger.debug(
        `Token usage for task ${taskId}: ${agentResponse.tokenUsage.totalTokens}/${contextWindow} (${Math.round((agentResponse.tokenUsage.totalTokens / contextWindow) * 100)}%)`,
      );

      const generatedToolResults: ToolResultContentBlock[] = [];

      let setTaskStatusToolUseBlock: SetTaskStatusToolUseBlock | null = null;

      for (const block of messageContentBlocks) {
        if (isComputerToolUseContentBlock(block)) {
          const result = await handleComputerToolUse(block, this.logger);
          generatedToolResults.push(result);
        }

        if (isCreateTaskToolUseBlock(block)) {
          const type = block.input.type?.toUpperCase() as TaskType;
          const priority = block.input.priority?.toUpperCase() as TaskPriority;

          await this.tasksService.create({
            description: block.input.description,
            type,
            createdBy: Role.ASSISTANT,
            ...(block.input.scheduledFor && {
              scheduledFor: new Date(block.input.scheduledFor),
            }),
            model: task.model,
            priority,
          });

          generatedToolResults.push({
            type: MessageContentType.ToolResult,
            tool_use_id: block.id,
            content: [
              {
                type: MessageContentType.Text,
                text: 'The task has been created',
              },
            ],
          });
        }

        if (isSetTaskStatusToolUseBlock(block)) {
          setTaskStatusToolUseBlock = block;

          generatedToolResults.push({
            type: MessageContentType.ToolResult,
            tool_use_id: block.id,
            is_error: block.input.status === 'failed',
            content: [
              {
                type: MessageContentType.Text,
                text: block.input.description,
              },
            ],
          });
        }
      }

      if (generatedToolResults.length > 0) {
        await this.messagesService.create({
          content: generatedToolResults,
          role: Role.USER,
          taskId,
        });
      }

      // Update the task status after all tool results have been generated if we have a set task status tool use block
      if (setTaskStatusToolUseBlock) {
        switch (setTaskStatusToolUseBlock.input.status) {
          case 'completed':
            await this.tasksService.update(taskId, {
              status: TaskStatus.COMPLETED,
              completedAt: new Date(),
            });
            break;
          case 'needs_help':
            await this.tasksService.update(taskId, {
              status: TaskStatus.NEEDS_HELP,
            });
            break;
        }
      }

      // Schedule the next iteration without blocking
      if (this.isProcessing) {
        setImmediate(() => this.runIteration(taskId));
      }
    } catch (error: any) {
      if (error?.name === 'BytebotAgentInterrupt') {
        this.logger.warn(`Processing aborted for task ID: ${taskId}`);
      } else {
        // Check for specific model limitation errors
        let errorMessage = error.message;
        let shouldFailTask = true;

        if (error.message?.includes('tool calling') && error.message?.includes('not supported')) {
          errorMessage = `Model ${currentModel?.name || 'unknown'} does not support tool calling. Please select a different model.`;
          this.logger.warn(`Model limitation detected: ${errorMessage}`);
        } else if (error.message?.includes('context window') || error.message?.includes('token limit')) {
          errorMessage = `Model ${currentModel?.name || 'unknown'} exceeded context window. Task may need to be broken down.`;
          this.logger.warn(`Context window exceeded for model ${currentModel?.name || 'unknown'}`);
        } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
          errorMessage = `Rate limit or quota exceeded for ${currentModel?.provider || 'unknown'} provider. Please try again later.`;
          shouldFailTask = false; // Don't fail permanently, user can retry
          this.logger.warn(`Rate limit hit for provider ${currentModel?.provider || 'unknown'}`);
        }

        this.logger.error(
          `Error during task processing iteration for task ID: ${taskId} - ${errorMessage}`,
          error.stack,
        );

        if (shouldFailTask) {
          await this.tasksService.update(taskId, {
            status: TaskStatus.FAILED,
          });
          this.isProcessing = false;
          this.currentTaskId = null;
        } else {
          // For retryable errors, mark as needs help so user can retry
          await this.tasksService.update(taskId, {
            status: TaskStatus.NEEDS_HELP,
          });
          this.isProcessing = false;
          this.currentTaskId = null;
        }
      }
    }
  }

  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    this.logger.log(`Stopping execution of task ${this.currentTaskId}`);

    // Signal any in-flight async operations to abort
    this.abortController?.abort();

    await this.inputCaptureService.stop();

    this.isProcessing = false;
    this.currentTaskId = null;
  }
}
