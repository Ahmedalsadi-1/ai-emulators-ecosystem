import { Module } from '@nestjs/common';
import { ComputerUseModule } from './computer-use/computer-use.module';
import { ScreenControllersModule } from './screen-controllers/screen-controllers.module';
// import { InputTrackingModule } from './input-tracking/input-tracking.module'; // Disabled on ARM64
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BytebotMcpModule } from './mcp';
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
    AuthModule,
    ComputerUseModule,
    ScreenControllersModule,
    // InputTrackingModule, // Disabled on ARM64 due to native library incompatibility
    BytebotMcpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
