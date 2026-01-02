import { Controller, Get, Post, Body, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ScreenControllerManager } from './screen-controller-manager.service';
import { ComputerActionDto } from '../computer-use/dto/computer-action.dto';
import { OpenInterfaceSettingsService } from './open-interface/open-interface-settings.service';

@Controller('screen-controllers')
export class ScreenControllersController {
  private readonly logger = new Logger(ScreenControllersController.name);

  constructor(
    private readonly screenControllerManager: ScreenControllerManager,
    private readonly openInterfaceSettings: OpenInterfaceSettingsService,
  ) {}

  @Get()
  async getControllers() {
    try {
      const controllers = this.screenControllerManager.getRegisteredControllers();
      const statuses = await this.screenControllerManager.getControllerStatus();

      return {
        controllers: controllers.map(c => ({
          name: c.name,
          status: statuses.find(s => s.name === c.name),
          enabled: c.enabled,
        })),
        activeController: this.screenControllerManager.getActiveController() ? 'open-interface' : null,
      };
    } catch (error) {
      this.logger.error('Failed to get controllers:', error);
      throw new HttpException('Failed to get controllers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('status/:name?')
  async getControllerStatus(@Param('name') name?: string) {
    try {
      return await this.screenControllerManager.getControllerStatus(name);
    } catch (error) {
      this.logger.error(`Failed to get controller status for ${name}:`, error);
      throw new HttpException('Failed to get controller status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('activate/:name')
  async activateController(@Param('name') name: string) {
    try {
      this.screenControllerManager.setActiveController(name);
      return { success: true, message: `Activated controller: ${name}` };
    } catch (error) {
      this.logger.error(`Failed to activate controller ${name}:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('execute')
  async executeAction(@Body() body: { action: ComputerActionDto; controller?: string }) {
    try {
      const result = await this.screenControllerManager.executeAction(body.action, body.controller);
      return { success: true, result };
    } catch (error) {
      this.logger.error('Failed to execute action:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('screenshot/:controller?')
  async takeScreenshot(@Param('controller') controller?: string) {
    try {
      const result = await this.screenControllerManager.takeScreenshot(controller);
      return result;
    } catch (error) {
      this.logger.error('Failed to take screenshot:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('open-interface/status')
  async getOpenInterfaceServerStatus() {
    try {
      return await this.screenControllerManager.getOpenInterfaceServerStatus();
    } catch (error) {
      this.logger.error('Failed to get Open-Interface server status:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Settings management endpoints
  @Get('open-interface/settings')
  async getOpenInterfaceSettings() {
    try {
      return await this.openInterfaceSettings.getSettings();
    } catch (error) {
      this.logger.error('Failed to get Open-Interface settings:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('open-interface/settings')
  async updateOpenInterfaceSettings(@Body() settings: any) {
    try {
      // Validate settings
      const validation = this.openInterfaceSettings.validateSettings(settings);
      if (!validation.isValid) {
        throw new HttpException(
          `Invalid settings: ${validation.errors.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        this.logger.warn(`Settings validation warnings: ${validation.warnings.join(', ')}`);
      }

      await this.openInterfaceSettings.updateSettings(settings);
      return {
        success: true,
        message: 'Settings updated successfully',
        warnings: validation.warnings
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to update Open-Interface settings:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('open-interface/settings/validate')
  async validateOpenInterfaceSettings(@Body() settings: any) {
    try {
      return this.openInterfaceSettings.validateSettings(settings);
    } catch (error) {
      this.logger.error('Failed to validate Open-Interface settings:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('open-interface/settings/reset')
  async resetOpenInterfaceSettings() {
    try {
      await this.openInterfaceSettings.resetToDefaults();
      return { success: true, message: 'Settings reset to defaults' };
    } catch (error) {
      this.logger.error('Failed to reset Open-Interface settings:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('open-interface/settings/export')
  async exportOpenInterfaceSettings() {
    try {
      const settingsJson = await this.openInterfaceSettings.exportSettings();
      return {
        success: true,
        settings: JSON.parse(settingsJson)
      };
    } catch (error) {
      this.logger.error('Failed to export Open-Interface settings:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('open-interface/settings/import')
  async importOpenInterfaceSettings(@Body() body: { settings: string }) {
    try {
      await this.openInterfaceSettings.importSettings(body.settings);
      return { success: true, message: 'Settings imported successfully' };
    } catch (error) {
      this.logger.error('Failed to import Open-Interface settings:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}