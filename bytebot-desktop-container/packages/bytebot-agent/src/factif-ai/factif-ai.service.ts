import { Injectable, Logger } from '@nestjs/common';
import { TestCase, TestResult, TestSuite, TestExecutionOptions } from '@bytebot/shared';
import { PlaywrightTestRunner } from './playwright-test-runner';
import { AITestGenerator } from './ai-test-generator';
import { TestAnalyzer } from './test-analyzer';

@Injectable()
export class FactifAiService {
  private readonly logger = new Logger(FactifAiService.name);

  constructor(
    private readonly playwrightTestRunner: PlaywrightTestRunner,
    private readonly aiTestGenerator: AITestGenerator,
    private readonly testAnalyzer: TestAnalyzer,
  ) {}

  /**
   * Generate AI-powered test cases based on application analysis
   */
  async generateTests(options: {
    applicationUrl?: string;
    applicationDescription?: string;
    testTypes?: string[];
    complexity?: 'basic' | 'intermediate' | 'advanced';
  }): Promise<TestSuite> {
    try {
      this.logger.log(`Generating AI-powered tests for ${options.applicationUrl || 'application'}`);

      const testSuite = await this.aiTestGenerator.generateTestSuite(options);

      this.logger.log(`Generated ${testSuite.testCases.length} test cases`);
      return testSuite;
    } catch (error) {
      this.logger.error(`Error generating tests: ${error.message}`, error.stack);
      throw new Error(`Failed to generate tests: ${error.message}`);
    }
  }

  /**
   * Execute automated tests
   */
  async executeTests(
    testSuite: TestSuite,
    options: TestExecutionOptions = {},
  ): Promise<TestResult[]> {
    try {
      this.logger.log(`Executing ${testSuite.testCases.length} tests`);

      const results = await this.playwrightTestRunner.runTestSuite(testSuite, options);

      this.logger.log(`Test execution completed: ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Error executing tests: ${error.message}`, error.stack);
      throw new Error(`Failed to execute tests: ${error.message}`);
    }
  }

  /**
   * Analyze test results and generate insights
   */
  async analyzeResults(results: TestResult[]): Promise<{
    summary: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    };
    insights: string[];
    recommendations: string[];
  }> {
    try {
      this.logger.log(`Analyzing ${results.length} test results`);

      const analysis = await this.testAnalyzer.analyze(results);

      this.logger.log('Test analysis completed');
      return analysis;
    } catch (error) {
      this.logger.error(`Error analyzing results: ${error.message}`, error.stack);
      throw new Error(`Failed to analyze results: ${error.message}`);
    }
  }

  /**
   * Generate visual test automation scripts
   */
  async generateVisualTests(options: {
    screenshots: string[];
    applicationUrl: string;
    testScenario: string;
  }): Promise<TestCase[]> {
    try {
      this.logger.log(`Generating visual tests for ${options.applicationUrl}`);

      const visualTests = await this.aiTestGenerator.generateVisualTests(options);

      this.logger.log(`Generated ${visualTests.length} visual test cases`);
      return visualTests;
    } catch (error) {
      this.logger.error(`Error generating visual tests: ${error.message}`, error.stack);
      throw new Error(`Failed to generate visual tests: ${error.message}`);
    }
  }

  /**
   * Run comprehensive test automation workflow
   */
  async runFullTestAutomation(options: {
    applicationUrl: string;
    applicationDescription?: string;
    testTypes?: string[];
    includeVisualTests?: boolean;
    executionOptions?: TestExecutionOptions;
  }): Promise<{
    testSuite: TestSuite;
    results: TestResult[];
    analysis: {
      summary: any;
      insights: string[];
      recommendations: string[];
    };
  }> {
    try {
      this.logger.log(`Running full test automation for ${options.applicationUrl}`);

      // 1. Generate tests
      const testSuite = await this.generateTests({
        applicationUrl: options.applicationUrl,
        applicationDescription: options.applicationDescription,
        testTypes: options.testTypes,
      });

      // 2. Add visual tests if requested
      if (options.includeVisualTests) {
        const visualTests = await this.generateVisualTests({
          screenshots: [], // Would be captured during execution
          applicationUrl: options.applicationUrl,
          testScenario: 'Full application visual validation',
        });
        testSuite.testCases.push(...visualTests);
      }

      // 3. Execute tests
      const results = await this.executeTests(testSuite, options.executionOptions);

      // 4. Analyze results
      const analysis = await this.analyzeResults(results);

      this.logger.log('Full test automation workflow completed');

      return {
        testSuite,
        results,
        analysis,
      };
    } catch (error) {
      this.logger.error(`Error in full test automation: ${error.message}`, error.stack);
      throw new Error(`Test automation workflow failed: ${error.message}`);
    }
  }
}