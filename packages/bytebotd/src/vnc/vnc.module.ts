import { Module } from '@nestjs/common';
import { VncBridgeService } from './vnc-bridge.service';

@Module({
  providers: [VncBridgeService],
  exports: [VncBridgeService],
})
export class VncModule {}
