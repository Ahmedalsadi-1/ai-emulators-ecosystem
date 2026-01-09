import { Injectable, Logger } from '@nestjs/common';
import { BytebotAgentModel } from '../agent/agent.types';

// LM Studio configuration
const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://192.168.1.118:1234';

// Ollama configuration - support both local and remote
const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OMNIPARSER_ENABLED = process.env.OMNIPARSER_ENABLED === 'true';

/**
 * Models known to have tool calling capability
 */
const TOOL_CALLING_MODELS = new Set([
  'functiongemma:latest',
  'functiongemma',
  'qwen3-vl:8b',
  'qwen3-vl',
  'qwen2.5-vl-7b-instruct',
  'llama-3.2-11b-vision-instruct',
  'minicpm-v-2_6',
  'deepseek-v3',
  'deepseek-v3.1',
  'claude-opus',
  'claude-sonnet',
  'claude-haiku',
  'gpt-4o',
  'gpt-4o-mini',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'ui-tars-7b-dpo',
  'qwen3-4b-agent-claude-gemini-qx86-hi-mlx',
  // New models
  'Me7war/Astria:latest',
  'Me7war/Astria',
  'ahmadwaqar/gui-owl:7b-q8',
  'gui-owl',
]);

/**
 * Models known to have vision capability
 */
const VISION_MODELS = new Set([
  'qwen3-vl:8b',
  'qwen3-vl:4b',
  'qwen3-vl',
  'qwen2.5-vl-7b-instruct',
  'llama-3.2-11b-vision-instruct',
  'llava:latest',
  'minicpm-v-2_6',
  'functiongemma:latest',
  'functiongemma',
]);

export interface DynamicModel {
  provider: string;
  name: string;
  title: string;
  contextWindow?: number;
  capabilities: {
    toolCalling: boolean;
    vision: boolean;
    omniparser: boolean;
    streaming: boolean;
  };
}

@Injectable()
export class DynamicModelsService {
  private readonly logger = new Logger(DynamicModelsService.name);
  private ollamaModelsCache: DynamicModel[] = [];
  private lmStudioModelsCache: DynamicModel[] = [];
  private lastFetch = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Fetch models from Ollama API
   */
  async fetchOllamaModels(): Promise<DynamicModel[]> {
    const now = Date.now();
    if (now - this.lastFetch < this.CACHE_TTL && this.ollamaModelsCache.length > 0) {
      this.logger.debug('Using cached Ollama models');
      return this.ollamaModelsCache;
    }

    try {
      this.logger.log(`Fetching Ollama models from ${OLLAMA_BASE_URL}/api/tags`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}`);
      }

      const data = await response.json() as { models: Array<{ name: string; size?: number; digest?: string }> };
      
      this.ollamaModelsCache = (data.models || []).map((model) => {
        const name = model.name;
        return {
          provider: 'ollama-local',
          name,
          title: `${name} (Ollama Local)`,
          contextWindow: 4096, // Default context window
          capabilities: {
            toolCalling: TOOL_CALLING_MODELS.has(name) || name.includes('functiongemma') || name.includes('qwen3-vl'),
            vision: VISION_MODELS.has(name) || name.includes('vl') || name.includes('vision'),
            omniparser: OMNIPARSER_ENABLED && (VISION_MODELS.has(name) || name.includes('vl') || name.includes('vision')),
            streaming: true,
          },
        };
      });

      this.lastFetch = now;
      this.logger.log(`Found ${this.ollamaModelsCache.length} Ollama models`);
      return this.ollamaModelsCache;
    } catch (error) {
      this.logger.warn(`Failed to fetch Ollama models: ${error instanceof Error ? error.message : error}`);
      return this.ollamaModelsCache;
    }
  }

  /**
   * Fetch models from LM Studio API
   */
  async fetchLmStudioModels(): Promise<DynamicModel[]> {
    const now = Date.now();
    if (now - this.lastFetch < this.CACHE_TTL && this.lmStudioModelsCache.length > 0) {
      this.logger.debug('Using cached LM Studio models');
      return this.lmStudioModelsCache;
    }

    try {
      this.logger.log(`Fetching LM Studio models from ${LM_STUDIO_BASE_URL}/v1/models`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/models`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LM Studio API returned ${response.status}`);
      }

      const data = await response.json() as { data: Array<{ id: string; object?: string }> };
      
      this.lmStudioModelsCache = (data.data || []).map((model) => {
        const name = model.id;
        const hasVision = name.includes('vl') || name.includes('vision') || name.includes('qwen');
        return {
          provider: 'proxy',
          name,
          title: `${name} (LM Studio Local)`,
          contextWindow: 32768, // Default context window for LM Studio models
          capabilities: {
            toolCalling: TOOL_CALLING_MODELS.has(name) || name.includes('qwen') || name.includes('llama') || name.includes('claude'),
            vision: hasVision,
            omniparser: OMNIPARSER_ENABLED && hasVision,
            streaming: true,
          },
        };
      });

      this.lastFetch = now;
      this.logger.log(`Found ${this.lmStudioModelsCache.length} LM Studio models`);
      return this.lmStudioModelsCache;
    } catch (error) {
      this.logger.warn(`Failed to fetch LM Studio models: ${error instanceof Error ? error.message : error}`);
      return this.lmStudioModelsCache;
    }
  }

  /**
   * Get all dynamic models (Ollama + LM Studio)
   */
  async getAllDynamicModels(): Promise<DynamicModel[]> {
    const [ollamaModels, lmStudioModels] = await Promise.all([
      this.fetchOllamaModels(),
      this.fetchLmStudioModels(),
    ]);

    return [...ollamaModels, ...lmStudioModels];
  }

  /**
   * Get tool-capable models only
   */
  async getToolCapableModels(): Promise<DynamicModel[]> {
    const models = await this.getAllDynamicModels();
    return models.filter((model) => model.capabilities.toolCalling);
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.ollamaModelsCache = [];
    this.lmStudioModelsCache = [];
    this.lastFetch = 0;
    this.logger.log('Dynamic models cache cleared');
  }
}
