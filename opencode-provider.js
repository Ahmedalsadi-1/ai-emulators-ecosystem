// OpenCode.ai Zen API Provider for TuriX
class OpenCodeProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://opencode.ai/zen/v1/chat/completions';
    this.models = {
      'gpt-5-nano': 'GPT 5 Nano (Free)',
      'grok-code': 'Grok Code Fast 1 (Free)',
      'big-pickle': 'Big Pickle (Free)',
      'glm-4.7-free': 'GLM 4.7 (Free)',
      'claude-sonnet-4-5': 'Claude Sonnet 4.5',
      'gpt-5.2': 'GPT 5.2'
    };
  }

  async chat(message, options = {}) {
    const model = options.model || 'gpt-5-nano';

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
          stream: options.stream || false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenCode API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from OpenCode API');
      }

    } catch (error) {
      console.error('OpenCode API call failed:', error);
      throw error;
    }
  }

  async chatWithContext(messages, options = {}) {
    const model = options.model || 'gpt-5-nano';

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
          stream: options.stream || false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenCode API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from OpenCode API');
      }

    } catch (error) {
      console.error('OpenCode API call failed:', error);
      throw error;
    }
  }

  getAvailableModels() {
    return Object.keys(this.models);
  }

  getModelDisplayName(modelId) {
    return this.models[modelId] || modelId;
  }

  // Test the API connection
  async testConnection() {
    try {
      const response = await this.chat('Hello, can you respond with just "OK" to confirm the connection works?', {
        model: 'gpt-5-nano',
        max_tokens: 10
      });
      return response.includes('OK') || response.includes('ok');
    } catch (error) {
      console.error('OpenCode connection test failed:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenCodeProvider;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.OpenCodeProvider = OpenCodeProvider;
}