import { BytebotAgentModel } from '../agent/agent.types';

export const ROUTEWAY_DEFAULT_BASE_URL = 'https://api.routeway.ai/v1';

export const ROUTEWAY_MODELS: BytebotAgentModel[] = [
  {
    provider: 'routeway',
    name: 'deepseek/deepseek-reasoner-v3.1-terminus',
    title: 'DeepSeek V3.1 Terminus',
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'routeway',
    name: 'deepseek/deepseek-reasoner-v3.1-terminus:free',
    title: 'DeepSeek V3.1 Terminus (Free)',
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'routeway',
    name: 'deepseek/deepseek-chat-v3.2',
    title: 'DeepSeek V3.2',
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'routeway',
    name: 'deepseek/deepseek-chat-v3.2-exp',
    title: 'DeepSeek V3.2 Exp',
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'routeway',
    name: 'deepseek/deepseek-reasoner',
    title: 'DeepSeek R1',
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
   {
     provider: 'routeway',
     name: 'tng/deepseek-r1t2-chimera:free',
     title: 'DeepSeek R1T2 Chimera (Free)',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'nex-agi/deepseek-v3.1-nex-n1:free',
     title: 'DeepSeek V3.1 Nex N1 (Free)',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'minimax/minimax-m2',
     title: 'MiniMax M2',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'minimax/minimax-m2:free',
     title: 'MiniMax M2 (Free)',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'z-ai/glm-4.6',
     title: 'GLM 4.6',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'z-ai/glm-4.6:free',
     title: 'GLM 4.6 (Free)',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'nvidia/nemotron-nano-12b-2-vl',
     title: 'Nemotron Nano 12B 2 VL',
     capabilities: {
       toolCalling: true,
       vision: true,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'nvidia/nemotron-3-nano-30b-a3b',
     title: 'Nemotron 3 Nano 30B A3B',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'microsoft/mai-ds-r1',
     title: 'MAI DS R1',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'moonshotai/kimi-k2-thinking',
     title: 'Kimi K2 Thinking',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'openai/gpt-oss-120b',
     title: 'GPT OSS 120B',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'meta-llama/llama-3.3-70b-instruct',
     title: 'Llama 3.3 70B Instruct',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'meta-llama/llama-3.2-3b-instruct',
     title: 'Llama 3.2 3B',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'meta-llama/llama-3.1-8b-instruct',
     title: 'Llama 3.1 8B',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'meta-llama/llama-3.1-70b-instruct',
     title: 'Llama 3.1 70B',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'alibaba/qwen3-235b-a22b-instruct',
     title: 'Qwen3 235B A22B Instruct',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'alibaba/qwen3-coder-480b-instruct',
     title: 'Qwen3 Coder 480B',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'mistral/devstral-2-2512',
     title: 'Devstral 2 2512',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
   {
     provider: 'routeway',
     name: 'kwaipilot/kat-coder-pro-v1:free',
     title: 'KAT-Coder-Pro V1 (Free)',
     capabilities: {
       toolCalling: true,
       vision: false,
       streaming: true,
     },
   },
];
