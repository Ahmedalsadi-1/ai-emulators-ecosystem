import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  Button,
  ClickMouseAction,
  ComputerAction,
  DragMouseAction,
  ScrollAction,
  TypeKeysAction,
  TypeTextAction,
} from '@bytebot/shared';
import { ComputerUseService } from '../computer-use/computer-use.service';
import { InputTrackingGateway } from './input-tracking.gateway';

@Injectable()
export class InputTrackingService implements OnModuleDestroy {
  private readonly logger = new Logger(InputTrackingService.name);

  private isTracking = false;

  constructor(
    private readonly gateway: InputTrackingGateway,
    private readonly computerUseService: ComputerUseService,
  ) {}

  onModuleDestroy() {
    this.stopTracking();
  }

  startTracking() {
    if (this.isTracking) {
      return;
    }
    this.logger.log('Input tracking not available on ARM64 architecture');
    this.isTracking = true;
  }

  stopTracking() {
    if (!this.isTracking) {
      return;
    }
    this.logger.log('Stopping input tracking');
    this.isTracking = false;
  }

  private mapButton(btn: unknown): Button {
    switch (btn) {
      case 1:
        return 'left';
      case 2:
        return 'right';
      case 3:
        return 'middle';
      default:
        return 'left';
    }
  }

  private async logAction(action: ComputerAction) {
    this.logger.log(`Detected action: ${JSON.stringify(action)}`);
    this.gateway.emitAction(action);
  }
}