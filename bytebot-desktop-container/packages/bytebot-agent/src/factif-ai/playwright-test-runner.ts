import { Injectable, Logger } from '@nestjs/common';
import { TestSuite, TestResult, TestExecutionOptions, TestCase } from '@bytebot/shared';
import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';

@Injectable()
export class PlaywrightTestRunner {
  private readonly logger = new Logger(PlaywrightTestRunner.name);

  async runTestSuite(
    testSuite: TestSuite,
    options: TestExecutionOptions = {},
  ): Promise<TestResult[]> {
    const browser = await this.launchBrowser(options);
    const context = await browser.newContext();
    const results: TestResult[] = [];

    try {
      this.logger.log(`Starting test suite execution: ${testSuite.name}`);

      for (const testCase of testSuite.testCases) {
        const result = await this.runTestCase(testCase, context, options);
        results.push(result);
      }

      this.logger.log(`Test suite execution completed: ${results.length} tests`);
    } catch (error) {
      this.logger.error(`Error running test suite: ${error.message}`, error.stack);
    } finally {
      await context.close();
      await browser.close();
    }

    return results;
  }

  private async launchBrowser(options: TestExecutionOptions): Promise<Browser> {
    const browserType = options.browser || 'chromium';
    const headless = options.headless !== false; // Default to true

    this.logger.log(`Launching ${browserType} browser (headless: ${headless})`);

    switch (browserType) {
      case 'firefox':
        return await firefox.launch({ headless });
      case 'webkit':
        return await webkit.launch({ headless });
      default:
        return await chromium.launch({ headless });
    }
  }

  private async runTestCase(
    testCase: TestCase,
    context: BrowserContext,
    options: TestExecutionOptions,
  ): Promise<TestResult> {
    const page = await context.newPage();
    const startTime = Date.now();
    let status: TestResult['status'] = 'passed';
    let error: string | undefined;
    const logs: string[] = [];
    const screenshots: string[] = [];

    // Set up logging
    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (err) => {
      logs.push(`[PAGE ERROR] ${err.message}`);
      status = 'error';
      error = err.message;
    });

    try {
      this.logger.log(`Executing test case: ${testCase.name}`);

      // Execute test steps
      for (const step of testCase.steps) {
        try {
          await this.executeStep(step, page);

          // Take screenshot if step requires it
          if (step.screenshot) {
            const screenshot = await page.screenshot({ encoding: 'base64' });
            screenshots.push(screenshot);
          }

          // Wait for condition if specified
          if (step.waitFor) {
            await page.waitForSelector(step.waitFor, { timeout: options.timeout || 30000 });
          }
        } catch (stepError) {
          this.logger.error(`Step failed: ${step.description}`, stepError);
          logs.push(`[STEP ERROR] ${step.description}: ${stepError.message}`);
          status = 'failed';
          error = stepError.message;

          // Take failure screenshot if enabled
          if (options.screenshotOnFailure) {
            try {
              const screenshot = await page.screenshot({ encoding: 'base64' });
              screenshots.push(screenshot);
            } catch (screenshotError) {
              this.logger.warn('Failed to take failure screenshot', screenshotError);
            }
          }

          break; // Stop executing remaining steps on failure
        }
      }

      // Validate expected result
      if (status === 'passed' && testCase.expectedResult) {
        try {
          await this.validateResult(testCase.expectedResult, page);
        } catch (validationError) {
          status = 'failed';
          error = `Validation failed: ${validationError.message}`;
          logs.push(`[VALIDATION ERROR] ${validationError.message}`);
        }
      }
    } catch (testError) {
      status = 'error';
      error = testError.message;
      logs.push(`[TEST ERROR] ${testError.message}`);
    } finally {
      await page.close();
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Test case completed: ${testCase.name} - ${status} (${duration}ms)`);

    return {
      testCaseId: testCase.id,
      status,
      duration,
      error,
      screenshots,
      logs,
      timestamp: new Date(),
    };
  }

  private async executeStep(step: any, page: Page): Promise<void> {
    switch (step.action) {
      case 'navigate':
        await page.goto(step.parameters.url);
        break;
      case 'click':
        await page.click(step.parameters.selector);
        break;
      case 'type':
        await page.fill(step.parameters.selector, step.parameters.text);
        break;
      case 'wait':
        await page.waitForTimeout(step.parameters.duration || 1000);
        break;
      case 'assert':
        await this.executeAssertion(step.parameters, page);
        break;
      default:
        throw new Error(`Unsupported action: ${step.action}`);
    }
  }

  private async executeAssertion(assertion: any, page: Page): Promise<void> {
    switch (assertion.type) {
      case 'element_exists':
        await page.waitForSelector(assertion.selector, { timeout: 5000 });
        break;
      case 'text_contains':
        await page.waitForFunction(
          (params) => {
            const element = document.querySelector(params.selector);
            return element && element.textContent?.includes(params.text);
          },
          { selector: assertion.selector, text: assertion.text },
        );
        break;
      case 'url_equals':
        if (page.url() !== assertion.url) {
          throw new Error(`Expected URL ${assertion.url}, but got ${page.url()}`);
        }
        break;
      default:
        throw new Error(`Unsupported assertion type: ${assertion.type}`);
    }
  }

  private async validateResult(expectedResult: string, page: Page): Promise<void> {
    // Parse and execute expected result validation
    // This could be enhanced to support more complex validations
    if (expectedResult.includes('should contain')) {
      const parts = expectedResult.split('should contain');
      if (parts.length === 2) {
        const text = parts[1].trim();
        const bodyText = await page.textContent('body');
        if (!bodyText?.includes(text)) {
          throw new Error(`Expected page to contain "${text}"`);
        }
      }
    }
  }
}