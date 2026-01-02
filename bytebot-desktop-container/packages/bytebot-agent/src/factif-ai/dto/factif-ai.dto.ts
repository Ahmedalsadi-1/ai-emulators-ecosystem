import { IsOptional, IsString, IsArray, IsEnum, IsUrl, IsObject } from 'class-validator';

export class GenerateTestsDto {
  @IsOptional()
  @IsUrl()
  applicationUrl?: string;

  @IsOptional()
  @IsString()
  applicationDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  testTypes?: string[];

  @IsOptional()
  @IsEnum(['basic', 'intermediate', 'advanced'])
  complexity?: 'basic' | 'intermediate' | 'advanced';
}

export class ExecuteTestsDto {
  @IsString()
  testSuiteId: string;

  @IsOptional()
  @IsEnum(['chromium', 'firefox', 'webkit'])
  browser?: 'chromium' | 'firefox' | 'webkit';

  @IsOptional()
  headless?: boolean;

  @IsOptional()
  timeout?: number;

  @IsOptional()
  retries?: number;

  @IsOptional()
  parallel?: boolean;

  @IsOptional()
  screenshotOnFailure?: boolean;

  @IsOptional()
  videoRecording?: boolean;

  @IsOptional()
  @IsObject()
  environment?: Record<string, string>;
}

export class AnalyzeResultsDto {
  @IsArray()
  @IsString({ each: true })
  testResultIds: string[];
}

export class GenerateVisualTestsDto {
  @IsArray()
  @IsString({ each: true })
  screenshots: string[];

  @IsUrl()
  applicationUrl: string;

  @IsString()
  testScenario: string;
}

export class FullTestAutomationDto {
  @IsUrl()
  applicationUrl: string;

  @IsOptional()
  @IsString()
  applicationDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  testTypes?: string[];

  @IsOptional()
  includeVisualTests?: boolean;

  @IsOptional()
  @IsObject()
  executionOptions?: ExecuteTestsDto;
}