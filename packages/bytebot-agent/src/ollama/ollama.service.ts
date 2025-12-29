import { Injectable, Logger } from '@nestjs/common';

/**
 * Ollama configuration from opencode.json
 * Using native Ollama API (not OpenAI-compatible)
 */
export const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
export const OLLAMA_MODELS: {
  name: string;
  title: string;
  contextWindow?: number;
}[] = [
  {
    name: 'llama3.2:3b',
    title: 'Llama 3.2 3B (Local)',
    contextWindow: 4096,
  },
  {
    name: 'llama3.2:latest',
    title: 'Llama 3.2 Latest (Local)',
    contextWindow: 4096,
  },
  {
    name: 'gemma2:2b',
    title: 'Gemma 2 2B (Local)',
    contextWindow: 2048,
  },
  {
    name: 'llava:latest',
    title: 'LLaVA Latest (Local)',
  },
  {
    name: 'qwen2.5-coder:7b',
    title: 'Qwen2.5 Coder 7B (Local)',
    contextWindow: 4096,
  },
  {
    name: 'codellama:7b',
    title: 'CodeLlama 7B (Local)',
    contextWindow: 4096,
  },
  {
    name: 'qwen3-vl:4b',
    title: 'Qwen3 VL 4B (Local)',
  },
  {
    name: 'qwen3-coder:480b',
    title: 'Qwen3 Coder 480B (Cloud)',
  },
  {
    name: 'deepseek-v3.1:671b',
    title: 'DeepSeek V3.1 671B (Cloud)',
  },
  {
    name: 'qwen3-vl:235b',
    title: 'Qwen3 VL 235B (Cloud)',
  },
  {
    name: 'gemini-3-pro-preview',
    title: 'Gemini 3 Pro Preview (Cloud)',
  },
  {
    name: 'minimax-m2',
    title: 'MiniMax M2 (Cloud)',
  },
  {
    name: 'gpt-oss:120b',
    title: 'GPT-OSS 120B (Cloud)',
  },
  {
    name: 'glm-4.6',
    title: 'GLM-4.6 (Cloud)',
  },
];

/**
 * Default model to use
 */
export const DEFAULT_OLLAMA_MODEL = OLLAMA_MODELS[0];

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);

  constructor() {
    this.logger.log('OllamaService initialized');
  }

  /**
   * Main method to generate messages using Ollama API
   */
  async generateMessage(
    systemPrompt: string,
    messages: any[],
    model: string,
    useTools: boolean,
    signal?: AbortSignal,
  ): Promise<any> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((msg: any) => ({
              role: msg.role || 'user',
              content: typeof msg === 'string' ? msg : msg.text,
            })),
          ],
          stream: false,
          options: {
            num_ctx: model?.includes('3.2') ? 4096 : 2048,
            temperature: 0.7,
          },
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed: ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(`Ollama response: ${JSON.stringify(data)}`);

      return {
        message: data.message?.content || data.message || '',
        tokens: data.tokens || { input: 0, output: 0, total: 0 },
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.log('Ollama API call aborted');
        throw error;
      }

      this.logger.error(`Ollama API error:`, error);
      throw new Error(`Ollama service error: ${error.message}`);
    }
  }
}
