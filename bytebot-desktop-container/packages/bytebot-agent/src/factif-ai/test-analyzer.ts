import { Injectable, Logger } from '@nestjs/common';
import { TestResult } from '@bytebot/shared';
import OpenAI from 'openai';

@Injectable()
export class TestAnalyzer {
  private readonly logger = new Logger(TestAnalyzer.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async analyze(results: TestResult[]): Promise<{
    summary: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    };
    insights: string[];
    recommendations: string[];
    patterns?: {
      commonFailures?: string[];
      performanceIssues?: string[];
      accessibilityViolations?: string[];
    };
  }> {
    try {
      this.logger.log(`Analyzing ${results.length} test results`);

      // Calculate basic summary
      const summary = this.calculateSummary(results);

      // Generate AI-powered insights and recommendations
      const analysis = await this.generateAnalysis(results, summary);

      return {
        summary,
        ...analysis,
      };
    } catch (error) {
      this.logger.error(`Error analyzing test results: ${error.message}`, error.stack);

      // Return basic summary if AI analysis fails
      return {
        summary: this.calculateSummary(results),
        insights: ['Analysis generation failed - basic summary only'],
        recommendations: ['Review test failures manually'],
      };
    }
  }

  private calculateSummary(results: TestResult[]) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const duration = results.reduce((sum, r) => sum + r.duration, 0);

    return { total, passed, failed, skipped, duration };
  }

  private async generateAnalysis(
    results: TestResult[],
    summary: any,
  ): Promise<{
    insights: string[];
    recommendations: string[];
    patterns?: any;
  }> {
    const failedTests = results.filter(r => r.status === 'failed' || r.status === 'error');
    const errorPatterns = this.extractErrorPatterns(failedTests);

    const prompt = `Analyze the following test execution results and provide insights and recommendations:

SUMMARY:
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Skipped: ${summary.skipped}
- Total Duration: ${summary.duration}ms

FAILED TESTS:
${failedTests.map(test => `
Test ID: ${test.testCaseId}
Status: ${test.status}
Duration: ${test.duration}ms
Error: ${test.error || 'No error message'}
Logs: ${test.logs?.slice(-5).join('\n') || 'No logs'}
`).join('\n')}

ERROR PATTERNS:
${errorPatterns.join('\n')}

Please provide:
1. Key insights about the test results
2. Specific recommendations for improvement
3. Any patterns or trends identified

Return your analysis in JSON format:
{
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "patterns": {
    "commonFailures": ["pattern 1", "pattern 2"],
    "performanceIssues": ["issue 1"],
    "accessibilityViolations": ["violation 1"]
  }
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert QA analyst. Analyze test results and provide actionable insights and recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        patterns: parsed.patterns || {},
      };
    } catch (error) {
      this.logger.warn(`AI analysis failed: ${error.message}`);
      return {
        insights: ['AI analysis unavailable'],
        recommendations: ['Manual review recommended'],
      };
    }
  }

  private extractErrorPatterns(failedTests: TestResult[]): string[] {
    const patterns: string[] = [];
    const errorMessages = failedTests
      .map(test => test.error)
      .filter(Boolean) as string[];

    // Simple pattern extraction - could be enhanced
    const commonPatterns = [
      'timeout',
      'element not found',
      'network error',
      'assertion failed',
      'javascript error',
    ];

    commonPatterns.forEach(pattern => {
      const count = errorMessages.filter(msg =>
        msg.toLowerCase().includes(pattern.toLowerCase())
      ).length;
      if (count > 0) {
        patterns.push(`${pattern}: ${count} occurrences`);
      }
    });

    return patterns;
  }
}