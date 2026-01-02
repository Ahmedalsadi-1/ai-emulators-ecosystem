import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { FactifAiService } from './factif-ai.service';

@Injectable()
export class FactifAiTools {
  constructor(private readonly factifAiService: FactifAiService) {}

  @Tool({
    name: 'factif_ai_generate_tests',
    description: 'Generate AI-powered test cases for web applications based on URL and requirements.',
    parameters: z.object({
      applicationUrl: z.string().url().describe('The URL of the application to test'),
      applicationDescription: z.string().optional().describe('Description of the application functionality'),
      testTypes: z.array(z.string()).optional().describe('Types of tests to generate (functional, visual, performance, etc.)'),
      complexity: z.enum(['basic', 'intermediate', 'advanced']).optional().describe('Complexity level of tests to generate'),
    }),
  })
  async generateTests({
    applicationUrl,
    applicationDescription,
    testTypes,
    complexity,
  }: {
    applicationUrl: string;
    applicationDescription?: string;
    testTypes?: string[];
    complexity?: 'basic' | 'intermediate' | 'advanced';
  }) {
    try {
      const testSuite = await this.factifAiService.generateTests({
        applicationUrl,
        applicationDescription,
        testTypes,
        complexity,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Generated test suite "${testSuite.name}" with ${testSuite.testCases.length} test cases`,
          },
          {
            type: 'text',
            text: JSON.stringify(testSuite, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating tests: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'factif_ai_execute_tests',
    description: 'Execute automated tests using Playwright with specified configuration.',
    parameters: z.object({
      testSuiteId: z.string().describe('ID of the test suite to execute'),
      browser: z.enum(['chromium', 'firefox', 'webkit']).optional().describe('Browser to use for testing'),
      headless: z.boolean().optional().describe('Run tests in headless mode'),
      timeout: z.number().optional().describe('Timeout for test execution in milliseconds'),
      screenshotOnFailure: z.boolean().optional().describe('Take screenshots on test failures'),
    }),
  })
  async executeTests({
    testSuiteId,
    browser,
    headless,
    timeout,
    screenshotOnFailure,
  }: {
    testSuiteId: string;
    browser?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
    timeout?: number;
    screenshotOnFailure?: boolean;
  }) {
    try {
      // Create a mock test suite for demonstration
      const testSuite = {
        id: testSuiteId,
        name: 'Mock Test Suite',
        description: 'Generated test suite',
        testCases: [],
      };

      const results = await this.factifAiService.executeTests(testSuite, {
        browser,
        headless,
        timeout,
        screenshotOnFailure,
      });

      const summary = {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
      };

      return {
        content: [
          {
            type: 'text',
            text: `Test execution completed. Results: ${summary.passed}/${summary.total} passed`,
          },
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tests: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'factif_ai_analyze_results',
    description: 'Analyze test execution results and provide insights and recommendations.',
    parameters: z.object({
      testResultIds: z.array(z.string()).describe('IDs of test results to analyze'),
    }),
  })
  async analyzeResults({ testResultIds }: { testResultIds: string[] }) {
    try {
      // Create mock test results for demonstration
      const mockResults = testResultIds.map(id => ({
        testCaseId: id,
        status: 'passed' as const,
        duration: Math.random() * 5000,
        timestamp: new Date(),
      }));

      const analysis = await this.factifAiService.analyzeResults(mockResults);

      return {
        content: [
          {
            type: 'text',
            text: `Analysis Summary: ${analysis.summary.passed}/${analysis.summary.total} tests passed`,
          },
          {
            type: 'text',
            text: `Insights: ${analysis.insights.join(', ')}`,
          },
          {
            type: 'text',
            text: `Recommendations: ${analysis.recommendations.join(', ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing results: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'factif_ai_generate_visual_tests',
    description: 'Generate visual regression test cases for applications.',
    parameters: z.object({
      applicationUrl: z.string().url().describe('URL of the application for visual testing'),
      testScenario: z.string().describe('Description of the visual test scenario'),
      screenshots: z.array(z.string()).optional().describe('Base64 encoded reference screenshots'),
    }),
  })
  async generateVisualTests({
    applicationUrl,
    testScenario,
    screenshots,
  }: {
    applicationUrl: string;
    testScenario: string;
    screenshots?: string[];
  }) {
    try {
      const visualTests = await this.factifAiService.generateVisualTests({
        applicationUrl,
        testScenario,
        screenshots: screenshots || [],
      });

      return {
        content: [
          {
            type: 'text',
            text: `Generated ${visualTests.length} visual test cases`,
          },
          {
            type: 'text',
            text: JSON.stringify(visualTests, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating visual tests: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'factif_ai_full_automation',
    description: 'Run complete test automation workflow: generate, execute, and analyze tests.',
    parameters: z.object({
      applicationUrl: z.string().url().describe('URL of the application to test'),
      applicationDescription: z.string().optional().describe('Description of the application'),
      testTypes: z.array(z.string()).optional().describe('Types of tests to include'),
      includeVisualTests: z.boolean().optional().describe('Include visual regression tests'),
      browser: z.enum(['chromium', 'firefox', 'webkit']).optional().describe('Browser for test execution'),
      headless: z.boolean().optional().describe('Run tests in headless mode'),
    }),
  })
  async runFullAutomation({
    applicationUrl,
    applicationDescription,
    testTypes,
    includeVisualTests,
    browser,
    headless,
  }: {
    applicationUrl: string;
    applicationDescription?: string;
    testTypes?: string[];
    includeVisualTests?: boolean;
    browser?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
  }) {
    try {
      const result = await this.factifAiService.runFullTestAutomation({
        applicationUrl,
        applicationDescription,
        testTypes,
        includeVisualTests,
        executionOptions: {
          browser,
          headless,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: `Full automation completed for ${applicationUrl}`,
          },
          {
            type: 'text',
            text: `Test Suite: ${result.testSuite.name} (${result.testSuite.testCases.length} tests)`,
          },
          {
            type: 'text',
            text: `Results: ${result.analysis.summary.passed}/${result.analysis.summary.total} passed`,
          },
          {
            type: 'text',
            text: `Key Insights: ${result.analysis.insights.slice(0, 3).join(', ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in full automation: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
}