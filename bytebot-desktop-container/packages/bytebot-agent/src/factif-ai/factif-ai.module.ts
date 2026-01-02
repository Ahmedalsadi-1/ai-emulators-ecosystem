import { Module } from '@nestjs/common';
import { FactifAiController } from './factif-ai.controller';
import { FactifAiService } from './factif-ai.service';
import { PlaywrightTestRunner } from './playwright-test-runner';
import { AITestGenerator } from './ai-test-generator';
import { TestAnalyzer } from './test-analyzer';
import { FactifAiTools } from './factif-ai.tools';

@Module({
  controllers: [FactifAiController],
  providers: [
    FactifAiService,
    PlaywrightTestRunner,
    AITestGenerator,
    TestAnalyzer,
    FactifAiTools,
  ],
  exports: [FactifAiService],
})
export class FactifAiModule {}