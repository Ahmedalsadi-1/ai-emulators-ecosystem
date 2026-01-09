import { Message } from '@prisma/client';
import { MessageContentBlock } from '@bytebot/shared';

export interface BytebotAgentResponse {
  contentBlocks: MessageContentBlock[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  performance?: {
    responseTime: number;
    provider: string;
    model: string;
    success: boolean;
  };
}

export interface BytebotAgentService {
  generateMessage(
    systemPrompt: string,
    messages: Message[],
    model: string,
    useTools: boolean,
    signal?: AbortSignal,
  ): Promise<BytebotAgentResponse>;
}

  export interface BytebotAgentModel {
    provider:
      | 'anthropic'
      | 'openai'
      | 'google'
      | 'proxy'
      | 'ollama-local'
      | 'opencode-local'
      | 'routeway'
      | 'groq';
    name: string;
    title: string;
    contextWindow?: number;
    capabilities?: {
      toolCalling?: boolean;
      vision?: boolean;
      omniparser?: boolean;
      streaming?: boolean;
    };
  }

export class BytebotAgentInterrupt extends Error {
  constructor() {
    super('BytebotAgentInterrupt');
    this.name = 'BytebotAgentInterrupt';
  }
}
