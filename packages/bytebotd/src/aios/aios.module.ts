import { Module } from '@nestjs/common';
import { AIOSController } from './aios.controller';
import { AIOSService } from './aios.service';

@Module({
  controllers: [AIOSController],
  providers: [AIOSService],
  exports: [AIOSService],
})
export class AIOSModule {}