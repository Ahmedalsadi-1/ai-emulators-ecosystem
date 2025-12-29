import { BytebotAgentModel } from '../agent/agent.types';

export const GOOGLE_MODELS: BytebotAgentModel[] = [
  {
    provider: 'google',
    name: 'gemini-2.5-pro',
    title: 'Gemini 2.5 Pro',
    contextWindow: 1000000,
    capabilities: {
      toolCalling: true,
      vision: true,
      streaming: true,
    },
  },
  {
    provider: 'google',
    name: 'gemini-2.5-flash',
    title: 'Gemini 2.5 Flash',
    contextWindow: 1000000,
    capabilities: {
      toolCalling: true,
      vision: true,
      streaming: true,
    },
  },
];

export const DEFAULT_MODEL = GOOGLE_MODELS[0];
