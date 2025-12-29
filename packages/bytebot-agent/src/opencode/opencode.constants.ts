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
      toolCalling: false,
      vision: false,
      streaming: true,
    },
  },
];

/**
 * Default model to use
 */
export const DEFAULT_OPENCODE_MODEL = OPENCODE_MODELS[0];