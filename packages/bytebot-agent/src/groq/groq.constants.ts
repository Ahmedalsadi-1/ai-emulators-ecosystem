import { BytebotAgentModel } from '../agent/agent.types';

export const GROQ_DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';

export const GROQ_MODELS: BytebotAgentModel[] = [
  {
    provider: 'groq',
    name: 'groq/compound-mini',
    title: 'Groq Compound Mini',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'openai/gpt-oss-120b',
    title: 'GPT OSS 120B',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'qwen/qwen3-32b',
    title: 'Qwen3 32B',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'moonshotai/kimi-k2-instruct-0905',
    title: 'Kimi K2 Instruct 0905',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'allam-2-7b',
    title: 'Allam 2 7B',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'openai/gpt-oss-safeguard-20b',
    title: 'GPT OSS Safeguard 20B',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'groq/compound',
    title: 'Groq Compound',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'meta-llama/llama-guard-4-12b',
    title: 'Llama Guard 4 12B',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'whisper-large-v3',
    title: 'Whisper Large V3',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'meta-llama/llama-prompt-guard-2-22m',
    title: 'Llama Prompt Guard 2 22M',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'openai/gpt-oss-20b',
    title: 'GPT OSS 20B',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'llama-3.3-70b-versatile',
    title: 'Llama 3.3 70B Versatile',
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'canopylabs/orpheus-arabic-saudi',
    title: 'Orpheus Arabic Saudi',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'meta-llama/llama-4-scout-17b-16e-instruct',
    title: 'Llama 4 Scout 17B 16E Instruct',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    title: 'Llama 4 Maverick 17B 128E Instruct',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'playai-tts',
    title: 'PlayAI TTS',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'meta-llama/llama-prompt-guard-2-86m',
    title: 'Llama Prompt Guard 2 86M',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'canopylabs/orpheus-v1-english',
    title: 'Orpheus V1 English',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'playai-tts-arabic',
    title: 'PlayAI TTS Arabic',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'whisper-large-v3-turbo',
    title: 'Whisper Large V3 Turbo',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'groq',
    name: 'moonshotai/kimi-k2-instruct',
    title: 'Kimi K2 Instruct',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'groq',
    name: 'llama-3.1-8b-instant',
    title: 'Llama 3.1 8B Instant',
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
];
