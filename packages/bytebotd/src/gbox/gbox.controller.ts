import { Controller, Get, Post, Body, HttpCode, HttpStatus, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { GBoxService } from './gbox.service';

@Controller('gbox')
export class GBoxController {
  constructor(private readonly gboxService: GBoxService) {}

  @Get('status')
  @Header('Content-Type', 'application/json')
  async getStatus() {
    return this.gboxService.getStatus();
  }

  @Get('devices')
  @Header('Content-Type', 'application/json')
  async listDevices() {
    return this.gboxService.listAndroidDevices();
  }

  @Get('android/devices')
  @Header('Content-Type', 'application/json')
  async listAndroidDevices() {
    return this.gboxService.listAndroidDevices();
  }

  @Post('launch-app')
  @Header('Content-Type', 'application/json')
  async launchApp(@Body() body: { packageName: string; activity?: string }) {
    return this.gboxService.launchAndroidApp(body.packageName, body.activity);
  }

  @Post('chromium')
  @Header('Content-Type', 'application/json')
  async launchChromium(@Body() body: { url?: string }) {
    return this.gboxService.launchChromium(body.url);
  }

  @Get('apps')
  @Header('Content-Type', 'application/json')
  async listApps() {
    return this.gboxService.listInstalledApps();
  }

  @Post('install-apk')
  @Header('Content-Type', 'application/json')
  async installApk(@Body() body: { apkPath: string }) {
    return this.gboxService.installApk(body.apkPath);
  }

  @Post('android/start')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  async startAndroid(@Body() body: { avdName?: string }) {
    return this.gboxService.startAndroidEmulator(body.avdName);
  }

  @Get('android/logs')
  @Header('Content-Type', 'application/json')
  async getAndroidLogs() {
    const logs = await this.gboxService.getAndroidLogs();
    return { logs };
  }

  @Get('desktop/status')
  @Header('Content-Type', 'application/json')
  async getDesktopStatus() {
    return this.gboxService.getDesktopStatus();
  }
}
