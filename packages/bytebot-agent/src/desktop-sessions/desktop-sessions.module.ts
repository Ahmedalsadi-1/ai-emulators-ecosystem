import { Module } from '@nestjs/common';
import { DesktopSessionsController } from './desktop-sessions.controller';
import { DesktopSessionsService } from './desktop-sessions.service';

@Module({
  controllers: [DesktopSessionsController],
  providers: [DesktopSessionsService],
  exports: [DesktopSessionsService],
})
export class DesktopSessionsModule {}
