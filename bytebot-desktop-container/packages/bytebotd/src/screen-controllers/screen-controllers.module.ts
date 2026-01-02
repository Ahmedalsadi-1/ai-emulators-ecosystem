import { Module } from '@nestjs/common';
import { ScreenControllerManager } from './screen-controller-manager.service';
import { ScreenControllersController } from './screen-controllers.controller';
import { CrossPlatformPythonManager } from './cross-platform-python-manager.service';
import { OpenInterfaceScreenControllerModule } from './open-interface';

@Module({
  imports: [OpenInterfaceScreenControllerModule],
  controllers: [ScreenControllersController],
  providers: [ScreenControllerManager, CrossPlatformPythonManager],
  exports: [ScreenControllerManager],
})
export class ScreenControllersModule {}