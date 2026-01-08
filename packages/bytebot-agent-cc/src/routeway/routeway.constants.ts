import { BytebotAgentModel } from '../agent/agent.types';

export const ROUTEWAY_DEFAULT_BASE_URL = 'https://api.routeway.ai/v1';

export const ROUTEWAY_MODELS: BytebotAgentModel[] = [
  {
    provider: 'routeway',
    name: 'deepseek/deepseek-chat-v3.2',
    title: 'DeepSeek V3.2 (Routeway)',
    contextWindow: 128000,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'routeway',
    name: 'deepseek/deepseek-reasoner-v3.1-terminus',
    title: 'DeepSeek V3.1 Terminus (Routeway)',
    contextWindow: 128000,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
];
