import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { OpenInterfaceScreenController } from '../screen-controllers/open-interface';
import { ScreenController, ScreenControllerStatus, ComputerAction, ScreenshotResult } from '@bytebot/shared';

export interface RegisteredController {
  name: string;
  controller: ScreenController;
  status: ScreenControllerStatus;
  enabled: boolean;
}

@Injectable()
export class ScreenControllerManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScreenControllerManager.name);
  private controllers: Map<string, RegisteredController> = new Map();
  private activeController: string | null = null;

  constructor(
    private readonly openInterfaceController: OpenInterfaceScreenController,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Screen Controller Manager...');

    // Register available controllers
    await this.registerController('open-interface', this.openInterfaceController);

    // Set default active controller
    if (this.controllers.has('open-interface')) {
      this.activeController = 'open-interface';
      this.logger.log('Set Open-Interface as default active controller');
    }

    this.logger.log(`Registered ${this.controllers.size} screen controllers`);
  }

  async onModuleDestroy() {
    this.logger.log('Destroying Screen Controller Manager...');

    // Cleanup all controllers
    for (const [name, registered] of this.controllers) {
      try {
        await registered.controller.destroy();
        this.logger.log(`Destroyed controller: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to destroy controller ${name}:`, error);
      }
    }
  }

  async registerController(name: string, controller: ScreenController): Promise<void> {
    try {
      this.logger.log(`Registering screen controller: ${name}`);

      // Initialize the controller
      await controller.initialize();

      // Get initial status
      const status = await controller.getStatus();

      const registered: RegisteredController = {
        name,
        controller,
        status,
        enabled: true,
      };

      this.controllers.set(name, registered);
      this.logger.log(`✅ Successfully registered controller: ${name}`);
    } catch (error) {
      this.logger.error(`❌ Failed to register controller ${name}:`, error);
      throw error;
    }
  }

  async unregisterController(name: string): Promise<void> {
    const registered = this.controllers.get(name);
    if (!registered) {
      throw new Error(`Controller ${name} not found`);
    }

    try {
      await registered.controller.destroy();
      this.controllers.delete(name);

      // If this was the active controller, clear it
      if (this.activeController === name) {
        this.activeController = null;
      }

      this.logger.log(`Unregistered controller: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to unregister controller ${name}:`, error);
      throw error;
    }
  }

  getRegisteredControllers(): RegisteredController[] {
    return Array.from(this.controllers.values());
  }

  getController(name: string): ScreenController | null {
    const registered = this.controllers.get(name);
    return registered?.controller || null;
  }

  getActiveController(): ScreenController | null {
    if (!this.activeController) return null;
    return this.getController(this.activeController);
  }

  setActiveController(name: string): void {
    if (!this.controllers.has(name)) {
      throw new Error(`Controller ${name} not registered`);
    }

    const registered = this.controllers.get(name);
    if (!registered?.enabled) {
      throw new Error(`Controller ${name} is disabled`);
    }

    this.activeController = name;
    this.logger.log(`Set active controller to: ${name}`);
  }

  async getControllerStatus(name?: string): Promise<ScreenControllerStatus[]> {
    const statuses: ScreenControllerStatus[] = [];

    if (name) {
      const registered = this.controllers.get(name);
      if (registered) {
        // Refresh status
        registered.status = await registered.controller.getStatus();
        statuses.push(registered.status);
      }
    } else {
      // Get all statuses
      for (const registered of this.controllers.values()) {
        registered.status = await registered.controller.getStatus();
        statuses.push(registered.status);
      }
    }

    return statuses;
  }

  async executeAction(action: ComputerAction, controllerName?: string): Promise<any> {
    const controller = controllerName
      ? this.getController(controllerName)
      : this.getActiveController();

    if (!controller) {
      throw new Error(`No active controller available${controllerName ? ` for ${controllerName}` : ''}`);
    }

    return await controller.executeAction(action);
  }

  async takeScreenshot(controllerName?: string): Promise<ScreenshotResult> {
    const controller = controllerName
      ? this.getController(controllerName)
      : this.getActiveController();

    if (!controller) {
      throw new Error(`No active controller available${controllerName ? ` for ${controllerName}` : ''}`);
    }

    // Check if controller supports screenshot
    const status = await controller.getStatus();
    if (!status.capabilities.includes('screenshot')) {
      throw new Error(`Controller ${status.name} does not support screenshots`);
    }

    return await (controller as any).takeScreenshot();
  }

  // Open-Interface specific methods
  async updateOpenInterfaceSettings(settings: any): Promise<any> {
    const controller = this.getController('open-interface') as OpenInterfaceScreenController;
    if (!controller) {
      throw new Error('Open-Interface controller not available');
    }

    return await controller.updateSettings(settings);
  }

  async getOpenInterfaceSettings(): Promise<any> {
    const controller = this.getController('open-interface') as OpenInterfaceScreenController;
    if (!controller) {
      throw new Error('Open-Interface controller not available');
    }

    return await controller.getSettings();
  }

  async getOpenInterfaceServerStatus(): Promise<any> {
    const controller = this.getController('open-interface') as OpenInterfaceScreenController;
    if (!controller) {
      throw new Error('Open-Interface controller not available');
    }

    return await controller.getServerStatus();
  }
}