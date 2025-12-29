import { BytebotAgentModel } from '../agent/agent.types';

/**
 * Ollama models from user's installed models (ollama list output)
 */
export const OLLAMA_MODELS: BytebotAgentModel[] = [
  // Local models (actually installed on user's system)
  {
    provider: 'ollama-local',
    name: 'functiongemma:latest',
    title: 'FunctionGemma Latest (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'ministral-3:latest',
    title: 'MiniStral 3 Latest (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'qwen2.5:7b',
    title: 'Qwen2.5 7B (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'llama3.2:3b',
    title: 'Llama 3.2 3B (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'gemma2:2b',
    title: 'Gemma 2 2B (Local)',
    contextWindow: 2048,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'llava:latest',
    title: 'LLaVA Latest (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: true,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'mxbai-embed-large:latest',
    title: 'MXBAI Embed Large (Local)',
    contextWindow: 2048,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'ollama-local',
    name: 'nomic-embed-text:latest',
    title: 'Nomic Embed Text (Local)',
    contextWindow: 2048,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: false,
    },
  },
  {
    provider: 'ollama-local',
    name: 'llama3.2:latest',
    title: 'Llama 3.2 Latest (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'llava:7b',
    title: 'LLaVA 7B (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: true,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'qwen2.5-coder:7b',
    title: 'Qwen2.5 Coder 7B (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'codellama:7b',
    title: 'CodeLlama 7B (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'qwen3-vl:4b',
    title: 'Qwen3 VL 4B (Local)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: true,
      streaming: true,
    },
  },

  // Cloud models (available via Ollama proxy)
  {
    provider: 'ollama-local',
    name: 'glm-4.7:cloud',
    title: 'GLM-4.7 (Cloud)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'minimax-m2.1:cloud',
    title: 'MiniMax M2.1 (Cloud)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'gemini-3-flash-preview:latest',
    title: 'Gemini 3 Flash Preview (Cloud)',
    contextWindow: 1000000,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'devstral-small-2:24b-cloud',
    title: 'Devstral Small 2 24B (Cloud)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'qwen3-coder:480b-cloud',
    title: 'Qwen3 Coder 480B (Cloud)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'gpt-oss:120b-cloud',
    title: 'GPT-OSS 120B (Cloud)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'glm-4.6:cloud',
    title: 'GLM-4.6 (Cloud)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'deepseek-v3.1:671b-cloud',
    title: 'DeepSeek V3.1 671B (Cloud)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'qwen3-vl:235b-cloud',
    title: 'Qwen3 VL 235B (Cloud)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: false,
      vision: true,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'gemini-3-pro-preview:latest',
    title: 'Gemini 3 Pro Preview (Cloud)',
    contextWindow: 1000000,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'ollama-local',
    name: 'minimax-m2:cloud',
    title: 'MiniMax M2 (Cloud)',
    contextWindow: 4096,
    capabilities: {
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
];

/**
 * Default model to use
 */
export const DEFAULT_OLLAMA_MODEL = OLLAMA_MODELS[0];
