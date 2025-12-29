import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIUserAbortError } from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions';
import {
  MessageContentBlock,
  MessageContentType,
  TextContentBlock,
  ToolUseContentBlock,
  ToolResultContentBlock,
  isUserActionContentBlock,
  isComputerToolUseContentBlock,
  isImageContentBlock,
  ThinkingContentBlock,
} from '@bytebot/shared';
import { Message, Role } from '@prisma/client';
import { proxyTools } from '../proxy/proxy.tools';
import {
  BytebotAgentService,
  BytebotAgentInterrupt,
  BytebotAgentResponse,
} from '../agent/agent.types';
import { GROQ_DEFAULT_BASE_URL } from './groq.constants';

@Injectable()
export class GroqService implements BytebotAgentService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(GroqService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const baseURL = GROQ_DEFAULT_BASE_URL;

    if (!apiKey) {
      this.logger.warn(
        'GROQ_API_KEY is not set. GroqService will not work properly.',
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-initialization',
      baseURL,
    });
  }

  async generateMessage(
    systemPrompt: string,
    messages: Message[],
    model: string,
    useTools: boolean,
    signal?: AbortSignal,
  ): Promise<BytebotAgentResponse> {
    try {
      const openaiMessages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      for (const message of messages) {
        if (message.role === Role.USER) {
          const userMessage: ChatCompletionMessageParam = {
            role: 'user',
            content: String(message.content),
          };
          openaiMessages.push(userMessage);
        } else if (message.role === Role.ASSISTANT) {
          const assistantMessage: ChatCompletionMessageParam = {
            role: 'assistant',
            content: String(message.content),
          };
          openaiMessages.push(assistantMessage);
        }
      }

      const tools = useTools ? proxyTools : undefined;

      const completion = await this.openai.chat.completions.create(
        {
          model,
          messages: openaiMessages,
          tools,
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          signal,
        },
      );

      const choice = completion.choices[0];
      if (!choice) {
        throw new Error('No completion choice returned');
      }

      const message = choice.message;
      const contentBlocks: MessageContentBlock[] = [];

      if (message.content) {
        contentBlocks.push({
          type: MessageContentType.Text,
          text: message.content,
        } as TextContentBlock);
      }

      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          contentBlocks.push({
            type: MessageContentType.ToolUse,
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments),
          } as ToolUseContentBlock);
        }
      }

      return {
        contentBlocks,
        tokenUsage: {
          inputTokens: completion.usage?.prompt_tokens || 0,
          outputTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      if (error instanceof APIUserAbortError) {
        throw new BytebotAgentInterrupt();
      }

      this.logger.error(`Groq API error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
