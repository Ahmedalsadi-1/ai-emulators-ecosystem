import { BytebotAgentModel } from '../agent/agent.types';

export const OPENCODE_MODELS: BytebotAgentModel[] = [
  {
    provider: 'opencode-local',
    name: 'opencode/big-pickle',
    title: 'Big Pickle (OpenCode Local)',
    contextWindow: 200000,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
  {
    provider: 'opencode-local',
    name: 'opencode/sm-pickle',
    title: 'Sm Pickle (OpenCode Local)',
    contextWindow: 128000,
    capabilities: {
      toolCalling: true,
      vision: false,
      streaming: true,
    },
  },
];
