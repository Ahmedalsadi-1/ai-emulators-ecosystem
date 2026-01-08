import { Message } from '@prisma/client';
import { MessageContentBlock } from '@bytebot/shared';

export interface BytebotAgentResponse {
  contentBlocks: MessageContentBlock[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
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
  provider: 'anthropic' | 'openai' | 'google' | 'proxy' | 'lm-studio' | 'ollama-local' | 'groq' | 'routeway' | 'opencode-local';
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
