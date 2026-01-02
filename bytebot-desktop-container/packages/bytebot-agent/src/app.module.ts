import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FactifAiModule } from './factif-ai/factif-ai.module';
import { BytebotAgentMcpModule } from './mcp/bytebot-agent-mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FactifAiModule,
    BytebotAgentMcpModule,
  ],
})
export class AppModule {}