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
  ImageContentBlock,
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
import { ROUTEWAY_DEFAULT_BASE_URL } from './routeway.constants';

@Injectable()
export class RoutewayService implements BytebotAgentService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(RoutewayService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ROUTEWAY_API_KEY');
    const baseURL =
      this.configService.get<string>('ROUTEWAY_BASE_URL') ||
      ROUTEWAY_DEFAULT_BASE_URL;

    if (!apiKey) {
      this.logger.warn(
        'ROUTEWAY_API_KEY is not set. RoutewayService will not work properly.',
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
    useTools: boolean = true,
    signal?: AbortSignal,
  ): Promise<BytebotAgentResponse> {
    const chatMessages = this.formatMessagesForChatCompletion(
      systemPrompt,
      messages,
    );

    try {
      const completionRequest: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages: chatMessages,
        max_tokens: 8192,
        ...(useTools && { tools: proxyTools }),
      };

      const completion = await this.openai.chat.completions.create(
        completionRequest,
        { signal },
      );

      const choice = completion.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No valid response from Routeway API');
      }

      const contentBlocks = this.formatChatCompletionResponse(choice.message);

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
        this.logger.log('Routeway API call aborted');
        throw new BytebotAgentInterrupt();
      }

      this.logger.error(
        `Error sending message to Routeway: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private formatMessagesForChatCompletion(
    systemPrompt: string,
    messages: Message[],
  ): ChatCompletionMessageParam[] {
    const chatMessages: ChatCompletionMessageParam[] = [];

    chatMessages.push({
      role: 'system',
      content: systemPrompt,
    });

    for (const message of messages) {
      const messageContentBlocks = message.content as MessageContentBlock[];

      if (
        messageContentBlocks.every((block) => isUserActionContentBlock(block))
      ) {
        const userActionBlocks = messageContentBlocks.flatMap(
          (block) => block.content,
        );

        for (const block of userActionBlocks) {
          if (isComputerToolUseContentBlock(block)) {
            chatMessages.push({
              role: 'user',
              content: `User performed action: ${block.name}\n${JSON.stringify(
                block.input,
                null,
                2,
              )}`,
            });
          } else if (isImageContentBlock(block)) {
            chatMessages.push({
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${block.source.media_type};base64,${block.source.data}`,
                    detail: 'high',
                  },
                },
              ],
            });
          }
        }
      } else {
        for (const block of messageContentBlocks) {
          switch (block.type) {
            case MessageContentType.Text: {
              chatMessages.push({
                role: message.role === Role.USER ? 'user' : 'assistant',
                content: block.text,
              });
              break;
            }
            case MessageContentType.Image: {
              const imageBlock = block as ImageContentBlock;
              chatMessages.push({
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${imageBlock.source.media_type};base64,${imageBlock.source.data}`,
                      detail: 'high',
                    },
                  },
                ],
              });
              break;
            }
            case MessageContentType.ToolUse: {
              const toolBlock = block as ToolUseContentBlock;
              chatMessages.push({
                role: 'assistant',
                tool_calls: [
                  {
                    id: toolBlock.id,
                    type: 'function',
                    function: {
                      name: toolBlock.name,
                      arguments: JSON.stringify(toolBlock.input),
                    },
                  },
                ],
              });
              break;
            }
            case MessageContentType.Thinking: {
              const thinkingBlock = block as ThinkingContentBlock;
              const message: ChatCompletionMessageParam = {
                role: 'assistant',
                content: null,
              };
              message['reasoning_content'] = thinkingBlock.thinking;
              chatMessages.push(message);
              break;
            }
            case MessageContentType.ToolResult: {
              const toolResultBlock = block as ToolResultContentBlock;

              if (
                toolResultBlock.content.every(
                  (content) => content.type === MessageContentType.Image,
                )
              ) {
                chatMessages.push({
                  role: 'tool',
                  tool_call_id: toolResultBlock.tool_use_id,
                  content: 'screenshot',
                });
              }

              toolResultBlock.content.forEach((content) => {
                if (content.type === MessageContentType.Text) {
                  chatMessages.push({
                    role: 'tool',
                    tool_call_id: toolResultBlock.tool_use_id,
                    content: content.text,
                  });
                }

                if (content.type === MessageContentType.Image) {
                  chatMessages.push({
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'Screenshot',
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: `data:${content.source.media_type};base64,${content.source.data}`,
                          detail: 'high',
                        },
                      },
                    ] as ChatCompletionContentPart[],
                  });
                }
              });
              break;
            }
          }
        }
      }
    }

    return chatMessages;
  }

  private formatChatCompletionResponse(
    message: OpenAI.Chat.ChatCompletionMessage,
  ): MessageContentBlock[] {
    const contentBlocks: MessageContentBlock[] = [];

    if (message.content) {
      contentBlocks.push({
        type: MessageContentType.Text,
        text: message.content,
      } as TextContentBlock);
    }

    if (message['reasoning_content']) {
      contentBlocks.push({
        type: MessageContentType.Thinking,
        thinking: message['reasoning_content'],
        signature: message['reasoning_content'],
      } as ThinkingContentBlock);
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          let parsedInput = {};
          try {
            parsedInput = JSON.parse(toolCall.function.arguments || '{}');
          } catch (error) {
            this.logger.warn(
              `Failed to parse tool call arguments: ${toolCall.function.arguments}`,
            );
            parsedInput = {};
          }

          contentBlocks.push({
            type: MessageContentType.ToolUse,
            id: toolCall.id,
            name: toolCall.function.name,
            input: parsedInput,
          } as ToolUseContentBlock);
        }
      }
    }

    if (message.refusal) {
      contentBlocks.push({
        type: MessageContentType.Text,
        text: `Refusal: ${message.refusal}`,
      } as TextContentBlock);
    }

    return contentBlocks;
  }
}
