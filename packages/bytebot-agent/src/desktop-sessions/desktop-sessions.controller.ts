import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { DesktopSessionsService } from './desktop-sessions.service';
import { DesktopSession, DesktopSessionType } from './desktop-sessions.types';

type CreateDesktopSessionBody = {
  type: DesktopSessionType;
  name?: string;
};

@Controller('desktop-sessions')
export class DesktopSessionsController {
  constructor(private readonly desktopSessions: DesktopSessionsService) {}

  @Get()
  async listSessions(): Promise<DesktopSession[]> {
    return this.desktopSessions.listSessions();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() body: CreateDesktopSessionBody,
  ): Promise<DesktopSession> {
    return this.desktopSessions.createSession(body.type, body.name);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  async stopSession(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.desktopSessions.stopSession(id);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeSession(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.desktopSessions.removeSession(id);
    return { success: true };
  }
}
