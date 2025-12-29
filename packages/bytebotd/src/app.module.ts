import { Module } from '@nestjs/common';
import { ComputerUseModule } from './computer-use/computer-use.module';
import { InputTrackingModule } from './input-tracking/input-tracking.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BytebotMcpModule } from './mcp';
import { TerminalModule } from './terminal/terminal.module';
import { AIOSModule } from './aios/aios.module';
import { FactifAIModule } from './factif-ai/factif-ai.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Explicitly makes it globally available
    }),
    ServeStaticModule.forRoot({
      rootPath: '/opt/noVNC',
      serveRoot: '/novnc',
    }),
    ComputerUseModule,
    InputTrackingModule,
    BytebotMcpModule,
    TerminalModule,
    AIOSModule,
    FactifAIModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
