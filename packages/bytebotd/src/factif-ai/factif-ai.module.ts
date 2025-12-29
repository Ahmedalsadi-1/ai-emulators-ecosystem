import { Module } from '@nestjs/common';
import { FactifAIController } from './factif-ai.controller';
import { FactifAIService } from './factif-ai.service';

@Module({
  controllers: [FactifAIController],
  providers: [FactifAIService],
  exports: [FactifAIService],
})
export class FactifAIModule {}