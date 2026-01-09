import { BytebotAgentModel } from '../agent/agent.types';

/**
 * OpenCode models from opencode.json configuration
 */
export const OPENCODE_MODELS: BytebotAgentModel[] = [
  {
    provider: 'opencode-local',
    name: 'opencode/big-pickle',
    title: 'OpenCode Big Pickle (Local)',
    contextWindow: 200000,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'opencode-local',
    name: 'opencode/glm-6.7-free',
    title: 'OpenCode GLM 6.7 Free (Local)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'opencode-local',
    name: 'opencode/minimax-m2.1-free',
    title: 'OpenCode MiniMax M2.1 Free (Local)',
    contextWindow: 32768,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
];

/**
 * Default model to use
 */
export const DEFAULT_OPENCODE_MODEL = OPENCODE_MODELS[0];
