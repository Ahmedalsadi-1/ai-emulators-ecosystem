import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FactifAiService } from './factif-ai.service';
import {
  GenerateTestsDto,
  ExecuteTestsDto,
  AnalyzeResultsDto,
  GenerateVisualTestsDto,
  FullTestAutomationDto,
} from './dto/factif-ai.dto';
import { TestSuite, TestResult } from '@bytebot/shared';

@Controller('factif-ai')
export class FactifAiController {
  private readonly logger = new Logger(FactifAiController.name);

  constructor(private readonly factifAiService: FactifAiService) {}

  @Post('generate-tests')
  async generateTests(@Body() dto: GenerateTestsDto): Promise<TestSuite> {
    try {
      this.logger.log(`Generating tests for application: ${dto.applicationUrl}`);
      return await this.factifAiService.generateTests(dto);
    } catch (error) {
      this.logger.error(`Error generating tests: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to generate tests: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('execute-tests')
  async executeTests(
    @Body() dto: ExecuteTestsDto,
  ): Promise<{ testSuite: TestSuite; results: TestResult[] }> {
    try {
      this.logger.log(`Executing test suite: ${dto.testSuiteId}`);

      // Note: In a real implementation, you'd fetch the test suite from storage
      // For now, this is a placeholder - the actual implementation would need
      // to retrieve the TestSuite by ID from a database or storage service
      const testSuite: TestSuite = {
        id: dto.testSuiteId,
        name: 'Placeholder Test Suite',
        description: 'Test suite retrieved from storage',
        testCases: [],
      };

      const results = await this.factifAiService.executeTests(testSuite, dto);

      return { testSuite, results };
    } catch (error) {
      this.logger.error(`Error executing tests: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to execute tests: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-results')
  async analyzeResults(@Body() dto: AnalyzeResultsDto): Promise<{
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
      this.logger.log(`Analyzing ${dto.testResultIds.length} test results`);

      // Note: In a real implementation, you'd fetch the TestResult objects by IDs
      // For now, this returns a placeholder response
      const mockResults: TestResult[] = dto.testResultIds.map(id => ({
        testCaseId: id,
        status: 'passed' as const,
        duration: 1000,
        timestamp: new Date(),
      }));

      return await this.factifAiService.analyzeResults(mockResults);
    } catch (error) {
      this.logger.error(`Error analyzing results: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to analyze results: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-visual-tests')
  async generateVisualTests(@Body() dto: GenerateVisualTestsDto): Promise<{
    visualTests: any[];
  }> {
    try {
      this.logger.log(`Generating visual tests for ${dto.applicationUrl}`);

      const visualTests = await this.factifAiService.generateVisualTests(dto);

      return { visualTests };
    } catch (error) {
      this.logger.error(`Error generating visual tests: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to generate visual tests: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('full-automation')
  async runFullTestAutomation(@Body() dto: FullTestAutomationDto): Promise<{
    testSuite: TestSuite;
    results: TestResult[];
    analysis: {
      summary: any;
      insights: string[];
      recommendations: string[];
    };
  }> {
    try {
      this.logger.log(`Running full test automation for ${dto.applicationUrl}`);

      return await this.factifAiService.runFullTestAutomation(dto);
    } catch (error) {
      this.logger.error(`Error in full test automation: ${error.message}`, error.stack);
      throw new HttpException(
        `Test automation workflow failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}