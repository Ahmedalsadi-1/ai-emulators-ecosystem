import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { FactifAiModule } from '../factif-ai/factif-ai.module';
import { FactifAiTools } from '../factif-ai/factif-ai.tools';

@Module({
  imports: [
    FactifAiModule,
    McpModule.forRoot({
      name: 'bytebot-agent',
      version: '0.0.1',
      sseEndpoint: '/mcp',
    }),
  ],
  providers: [FactifAiTools],
})
export class BytebotAgentMcpModule {}