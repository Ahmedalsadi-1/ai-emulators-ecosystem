import { BytebotAgentModel } from '../agent/agent.types';

export const GROQ_DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';

export const GROQ_MODELS: BytebotAgentModel[] = [
  {
    provider: 'groq',
    name: 'groq/llama-3.3-70b-versatile',
    title: 'Llama 3.3 70B Versatile (Groq)',
    contextWindow: 128000,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'groq/llama-3.1-8b-instant',
    title: 'Llama 3.1 8B Instant (Groq)',
    contextWindow: 128000,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'groq/llama-3.2-11b-vision-instruct',
    title: 'Llama 3.2 11B Vision (Groq)',
    contextWindow: 128000,
    capabilities: {
      toolCalling: true,
      vision: true,
      omniparser: true,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'groq/gemma2-9b-it',
    title: 'Gemma 2 9B (Groq)',
    contextWindow: 8192,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'groq/mixtral-8b-32768',
    title: 'Mixtral 8B (Groq)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
];
