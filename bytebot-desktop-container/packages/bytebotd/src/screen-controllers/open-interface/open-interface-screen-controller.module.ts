import { Module } from '@nestjs/common';
import { OpenInterfaceScreenController } from './open-interface-screen-controller.service';
import { OpenInterfaceSettingsService } from './open-interface-settings.service';

@Module({
  providers: [OpenInterfaceScreenController, OpenInterfaceSettingsService],
  exports: [OpenInterfaceScreenController, OpenInterfaceSettingsService],
})
export class OpenInterfaceScreenControllerModule {}