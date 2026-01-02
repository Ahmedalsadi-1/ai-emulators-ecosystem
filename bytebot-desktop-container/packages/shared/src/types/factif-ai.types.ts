// Test automation types for Factif-AI
export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'functional' | 'visual' | 'performance' | 'accessibility' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  steps: TestStep[];
  expectedResult: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TestStep {
  id: string;
  action: string;
  description: string;
  parameters?: Record<string, any>;
  screenshot?: string; // Base64 encoded
  waitFor?: string; // Selector or condition to wait for
}

export interface TestResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number; // in milliseconds
  error?: string;
  screenshots?: string[]; // Base64 encoded screenshots during execution
  logs?: string[];
  performance?: {
    loadTime?: number;
    memoryUsage?: number;
    networkRequests?: number;
  };
  timestamp: Date;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  metadata?: Record<string, any>;
}

export interface TestExecutionOptions {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number; // in milliseconds
  retries?: number;
  parallel?: boolean;
  screenshotOnFailure?: boolean;
  videoRecording?: boolean;
  environment?: Record<string, string>;
}

export interface TestAnalysisResult {
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
}