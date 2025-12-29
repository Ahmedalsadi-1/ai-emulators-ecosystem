import { Module, forwardRef } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { MessagesModule } from '../messages/messages.module';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { AgentProcessor } from './agent.processor';
import { ConfigModule } from '@nestjs/config';
import { AgentScheduler } from './agent.scheduler';
import { InputCaptureService } from './input-capture.service';
import { OpenAIModule } from '../openai/openai.module';
import { GoogleModule } from '../google/google.module';
import { GroqModule } from '../groq/groq.module';
import { OllamaModule } from '../ollama/ollama.module';
import { OpenCodeModule } from '../opencode/opencode.module';
import { RoutewayModule } from '../routeway/routeway.module';
import { SummariesModule } from 'src/summaries/summaries.modue';
import { AgentAnalyticsService } from './agent.analytics';
import { PerformanceMonitorService } from './performance-monitor.service';
import { ProxyModule } from 'src/proxy/proxy.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => TasksModule),
    MessagesModule,
    SummariesModule,
    AnthropicModule,
    OpenAIModule,
    GoogleModule,
    GroqModule,
    OllamaModule,
    OpenCodeModule,
    RoutewayModule,
    ProxyModule,
  ],
  providers: [
    AgentProcessor,
    AgentScheduler,
    InputCaptureService,
    AgentAnalyticsService,
    PerformanceMonitorService,
  ],
  exports: [AgentProcessor],
})
export class AgentModule {}
