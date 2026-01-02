import { Injectable, Logger } from '@nestjs/common';
import { TestSuite, TestCase } from '@bytebot/shared';
import OpenAI from 'openai';

@Injectable()
export class AITestGenerator {
  private readonly logger = new Logger(AITestGenerator.name);
  private openai: OpenAI;

  constructor() {
    // Initialize OpenAI client - would use config service in real implementation
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async generateTestSuite(options: {
    applicationUrl?: string;
    applicationDescription?: string;
    testTypes?: string[];
    complexity?: 'basic' | 'intermediate' | 'advanced';
  }): Promise<TestSuite> {
    try {
      this.logger.log(`Generating test suite for ${options.applicationUrl}`);

      const prompt = this.buildTestGenerationPrompt(options);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert QA engineer specializing in automated testing. Generate comprehensive, realistic test cases for web applications.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const generatedTests = this.parseGeneratedTests(response.choices[0]?.message?.content || '');

      return {
        id: `suite_${Date.now()}`,
        name: `AI Generated Test Suite for ${options.applicationUrl || 'Application'}`,
        description: `Automatically generated test suite with ${generatedTests.length} test cases`,
        testCases: generatedTests,
        metadata: {
          generatedAt: new Date().toISOString(),
          complexity: options.complexity || 'intermediate',
          testTypes: options.testTypes || ['functional'],
        },
      };
    } catch (error) {
      this.logger.error(`Error generating test suite: ${error.message}`, error.stack);
      throw new Error(`Failed to generate test suite: ${error.message}`);
    }
  }

  async generateVisualTests(options: {
    screenshots: string[];
    applicationUrl: string;
    testScenario: string;
  }): Promise<TestCase[]> {
    try {
      this.logger.log(`Generating visual tests for ${options.applicationUrl}`);

      const prompt = `Generate visual regression test cases for the following scenario:

Application URL: ${options.applicationUrl}
Test Scenario: ${options.testScenario}

Please generate test cases that focus on:
1. Layout and visual consistency
2. Element positioning and sizing
3. Color and styling validation
4. Responsive design checks
5. Cross-browser visual differences

Return the test cases in JSON format with the following structure:
[{
  "id": "unique_id",
  "name": "Test case name",
  "description": "Detailed description",
  "type": "visual",
  "priority": "high|medium|low",
  "steps": [{
    "id": "step_id",
    "action": "navigate|click|screenshot|compare",
    "description": "Step description",
    "parameters": {}
  }],
  "expectedResult": "Expected visual outcome"
}]`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a visual testing expert. Generate comprehensive visual regression tests.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      return this.parseGeneratedTests(response.choices[0]?.message?.content || '');
    } catch (error) {
      this.logger.error(`Error generating visual tests: ${error.message}`, error.stack);
      throw new Error(`Failed to generate visual tests: ${error.message}`);
    }
  }

  private buildTestGenerationPrompt(options: {
    applicationUrl?: string;
    applicationDescription?: string;
    testTypes?: string[];
    complexity?: string;
  }): string {
    const testTypes = options.testTypes || ['functional'];
    const complexity = options.complexity || 'intermediate';

    return `Generate comprehensive automated test cases for a web application with the following details:

Application URL: ${options.applicationUrl || 'Not specified'}
Application Description: ${options.applicationDescription || 'Web application'}
Test Types: ${testTypes.join(', ')}
Complexity Level: ${complexity}

Please generate test cases that cover:
${testTypes.includes('functional') ? '- Functional testing (user workflows, form submissions, navigation)' : ''}
${testTypes.includes('visual') ? '- Visual testing (layout, styling, responsive design)' : ''}
${testTypes.includes('performance') ? '- Performance testing (load times, responsiveness)' : ''}
${testTypes.includes('accessibility') ? '- Accessibility testing (WCAG compliance, keyboard navigation)' : ''}
${testTypes.includes('security') ? '- Security testing (input validation, XSS prevention)' : ''}

For ${complexity} complexity, include:
${complexity === 'basic' ? '- Basic user flows and essential functionality' : ''}
${complexity === 'intermediate' ? '- Intermediate workflows, edge cases, and common user scenarios' : ''}
${complexity === 'advanced' ? '- Advanced edge cases, error conditions, and complex user journeys' : ''}

Return the test cases in JSON format with the following structure:
[{
  "id": "unique_id",
  "name": "Test case name",
  "description": "Detailed description",
  "type": "functional|visual|performance|accessibility|security",
  "priority": "critical|high|medium|low",
  "steps": [{
    "id": "step_id",
    "action": "navigate|click|type|wait|assert",
    "description": "Step description",
    "parameters": {
      "selector": ".css-selector",
      "text": "input text",
      "url": "navigation url",
      "duration": 1000
    },
    "waitFor": ".element-selector"
  }],
  "expectedResult": "Expected outcome description",
  "tags": ["tag1", "tag2"]
}]`;
  }

  private parseGeneratedTests(content: string): TestCase[] {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/(\[[\s\S]*\])/);
      const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

      const parsed = JSON.parse(jsonContent);

      if (Array.isArray(parsed)) {
        return parsed.map((test, index) => ({
          id: test.id || `test_${Date.now()}_${index}`,
          name: test.name || `Test Case ${index + 1}`,
          description: test.description || '',
          type: test.type || 'functional',
          priority: test.priority || 'medium',
          steps: test.steps || [],
          expectedResult: test.expectedResult || '',
          tags: test.tags || [],
          metadata: test.metadata || {},
        }));
      }

      return [];
    } catch (error) {
      this.logger.warn(`Failed to parse generated tests: ${error.message}`);
      // Return fallback test cases
      return [
        {
          id: `fallback_${Date.now()}`,
          name: 'Basic Navigation Test',
          description: 'Test basic application navigation',
          type: 'functional',
          priority: 'high',
          steps: [
            {
              id: 'nav_1',
              action: 'navigate',
              description: 'Navigate to application',
              parameters: { url: 'about:blank' },
            },
          ],
          expectedResult: 'Page should load successfully',
          tags: ['fallback'],
        },
      ];
    }
  }
}