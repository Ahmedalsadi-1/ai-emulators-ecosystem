import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

export interface OpenInterfaceSettings {
  // API Configuration
  api_key?: string;
  base_url?: string;
  model?: string;

  // UI Configuration
  theme?: string;
  custom_llm_instructions?: string;

  // Application Configuration
  default_browser?: string;
  play_ding_on_completion?: boolean;

  // Advanced Configuration
  temperature?: number;
  max_tokens?: number;
  screenshot_quality?: number;
  screenshot_format?: 'png' | 'jpeg' | 'webp';

  // Open-Interface specific settings
  enable_voice_input?: boolean;
  screenshot_before_actions?: boolean;
  action_confirmation?: boolean;
  debug_mode?: boolean;
}

@Injectable()
export class OpenInterfaceSettingsService {
  private readonly logger = new Logger(OpenInterfaceSettingsService.name);
  private readonly settingsFile: string;
  private settings: OpenInterfaceSettings = {};
  private readonly defaultSettings: OpenInterfaceSettings = {
    // Default model configurations
    model: 'gpt-4o',
    base_url: 'https://api.openai.com/v1',

    // UI defaults
    theme: 'superhero',

    // Application defaults
    default_browser: 'Safari',
    play_ding_on_completion: true,

    // Advanced defaults
    temperature: 0.1,
    max_tokens: 1000,
    screenshot_quality: 85,
    screenshot_format: 'png',

    // Open-Interface specific defaults
    enable_voice_input: false,
    screenshot_before_actions: true,
    action_confirmation: false,
    debug_mode: false,
  };

  constructor(private readonly configService: ConfigService) {
    // Use Bytebot's config directory or create our own
    const configDir = this.configService.get<string>('CONFIG_DIR') ||
                     path.join(process.cwd(), 'config');

    this.settingsFile = path.join(configDir, 'open-interface-settings.json');
    this.logger.log(`Open-Interface settings file: ${this.settingsFile}`);
  }

  async onModuleInit() {
    await this.ensureConfigDirectory();
    await this.loadSettings();
  }

  private async ensureConfigDirectory(): Promise<void> {
    try {
      const configDir = path.dirname(this.settingsFile);
      await fs.mkdir(configDir, { recursive: true });
    } catch (error) {
      this.logger.warn(`Failed to create config directory: ${error.message}`);
    }
  }

  async loadSettings(): Promise<OpenInterfaceSettings> {
    try {
      const data = await fs.readFile(this.settingsFile, 'utf-8');
      const loadedSettings = JSON.parse(data);

      // Merge with defaults
      this.settings = { ...this.defaultSettings, ...loadedSettings };

      this.logger.log('✅ Open-Interface settings loaded successfully');
      return this.settings;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, use defaults
        this.logger.log('Settings file not found, using defaults');
        this.settings = { ...this.defaultSettings };
        await this.saveSettings(); // Create the file with defaults
        return this.settings;
      } else {
        this.logger.error(`Failed to load settings: ${error.message}`);
        // Fallback to defaults
        this.settings = { ...this.defaultSettings };
        return this.settings;
      }
    }
  }

  async saveSettings(settings?: Partial<OpenInterfaceSettings>): Promise<void> {
    try {
      if (settings) {
        // Update current settings with provided values
        this.settings = { ...this.settings, ...settings };
      }

      await fs.writeFile(this.settingsFile, JSON.stringify(this.settings, null, 2), 'utf-8');
      this.logger.log('✅ Open-Interface settings saved successfully');
    } catch (error) {
      this.logger.error(`Failed to save settings: ${error.message}`);
      throw error;
    }
  }

  getSettings(): OpenInterfaceSettings {
    return { ...this.settings };
  }

  getSetting<K extends keyof OpenInterfaceSettings>(key: K): OpenInterfaceSettings[K] {
    return this.settings[key];
  }

  async updateSetting<K extends keyof OpenInterfaceSettings>(
    key: K,
    value: OpenInterfaceSettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();
  }

  async updateSettings(updates: Partial<OpenInterfaceSettings>): Promise<void> {
    await this.saveSettings(updates);
  }

  async resetToDefaults(): Promise<void> {
    this.settings = { ...this.defaultSettings };
    await this.saveSettings();
    this.logger.log('✅ Open-Interface settings reset to defaults');
  }

  // Validation methods
  validateApiKey(apiKey?: string): boolean {
    if (!apiKey) return false;

    // Basic validation for OpenAI API key format
    // OpenAI keys start with 'sk-' and are followed by characters
    return /^sk-[a-zA-Z0-9]{48,}$/.test(apiKey);
  }

  validateBaseUrl(baseUrl?: string): boolean {
    if (!baseUrl) return false;

    try {
      const url = new URL(baseUrl);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  validateModel(model?: string): boolean {
    if (!model) return false;

    // Common OpenAI and Gemini model names
    const validModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-vision-preview',
      'gpt-4-turbo',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-pro-exp-02-05',
    ];

    return validModels.includes(model) || model.startsWith('gpt-') || model.startsWith('gemini-');
  }

  validateSettings(settings: Partial<OpenInterfaceSettings>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // API Key validation
    if (settings.api_key && !this.validateApiKey(settings.api_key)) {
      warnings.push('API key format appears invalid. Please verify it matches your provider\'s format.');
    }

    // Base URL validation
    if (settings.base_url && !this.validateBaseUrl(settings.base_url)) {
      errors.push('Base URL must be a valid HTTP or HTTPS URL.');
    }

    // Model validation
    if (settings.model && !this.validateModel(settings.model)) {
      warnings.push('Model name may be invalid. Please verify it matches your API provider\'s available models.');
    }

    // Temperature validation
    if (settings.temperature !== undefined && (settings.temperature < 0 || settings.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2.');
    }

    // Max tokens validation
    if (settings.max_tokens !== undefined && (settings.max_tokens < 1 || settings.max_tokens > 32768)) {
      errors.push('Max tokens must be between 1 and 32768.');
    }

    // Screenshot quality validation
    if (settings.screenshot_quality !== undefined && (settings.screenshot_quality < 1 || settings.screenshot_quality > 100)) {
      errors.push('Screenshot quality must be between 1 and 100.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Environment variable integration
  getEnvironmentVariables(): Record<string, string> {
    const envVars: Record<string, string> = {};

    if (this.settings.api_key) {
      envVars['OPENAI_API_KEY'] = this.settings.api_key;
    }

    if (this.settings.base_url) {
      envVars['OPENAI_BASE_URL'] = this.settings.base_url;
    }

    if (this.settings.model) {
      envVars['DEFAULT_MODEL'] = this.settings.model;
    }

    // Debug mode
    if (this.settings.debug_mode) {
      envVars['DEBUG_MODE'] = 'true';
    }

    return envVars;
  }

  // Settings export/import
  async exportSettings(): Promise<string> {
    // Export settings without sensitive data
    const exportData = { ...this.settings };

    // Remove API key from export (security)
    delete exportData.api_key;

    return JSON.stringify(exportData, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson);

      // Validate imported settings
      const validation = this.validateSettings(importedSettings);
      if (!validation.isValid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
      }

      // Warn about validation issues
      if (validation.warnings.length > 0) {
        this.logger.warn(`Settings import warnings: ${validation.warnings.join(', ')}`);
      }

      // Merge with current settings (preserve API key)
      await this.saveSettings({ ...this.settings, ...importedSettings });

      this.logger.log('✅ Open-Interface settings imported successfully');
    } catch (error) {
      this.logger.error(`Failed to import settings: ${error.message}`);
      throw error;
    }
  }
}