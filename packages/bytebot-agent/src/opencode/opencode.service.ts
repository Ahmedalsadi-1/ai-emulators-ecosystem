import { Injectable, Logger } from '@nestjs/common';

import { BytebotAgentModel } from '../agent/agent.types';

/**
 * OpenCode configuration from opencode.json
 */
export const OPENCODE_BASE_URL = 'http://127.0.0.1:8000/api';
export const DEFAULT_OPENCODE_MODEL = 'opencode/big-pickle';

export const OPENCODE_MODELS: BytebotAgentModel[] = [
  {
    provider: 'opencode-local',
    name: 'opencode/big-pickle',
    title: 'OpenCode Big Pickle (Local)',
    contextWindow: 200000,
  },
];

/**
 * OpenCode service configuration from opencode.json
 */
export const OPENCODE_ENV_VARS = {
  MODEL_NAME: process.env.OPENCODE_MODEL_NAME || DEFAULT_OPENCODE_MODEL,
  API_BASE_URL: process.env.OPENCODE_API_BASE_URL || OPENCODE_BASE_URL,
  API_KEY: process.env.OPENCODE_API_KEY,
};

@Injectable()
export class OpenCodeService {
  private readonly logger = new Logger(OpenCodeService.name);

  constructor() {
    this.logger.log('OpenCodeService initialized');
  }

  /**
   * Main method to generate messages using OpenCode API
   */
  async generateMessage(
    systemPrompt: string,
    messages: any[],
    model: string,
    useTools: boolean = true,
    signal?: AbortSignal,
  ): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if API key is provided
      if (OPENCODE_ENV_VARS.API_KEY) {
        headers['Authorization'] = `Bearer ${OPENCODE_ENV_VARS.API_KEY}`;
      }

      const response = await fetch(`${OPENCODE_ENV_VARS.API_BASE_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((msg: any) => ({
              role: msg.role || 'user',
              content: typeof msg === 'string' ? msg : msg.text,
            })),
          ],
          stream: false,
          tools: useTools
            ? [
                {
                  type: 'computer_use',
                  function: { name: 'run_computer', arguments: {} },
                },
              ]
            : undefined,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`OpenCode API request failed: ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(`OpenCode response: ${JSON.stringify(data)}`);

      return {
        message: data.message?.content || data.message || '',
        tokens: data.tokens || { input: 0, output: 0, total: 0 },
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.log('OpenCode API call aborted');
        throw error;
      }

      this.logger.error(`OpenCode API error:`, error);
      throw new Error(`OpenCode service error: ${error.message}`);
    }
  }
}
