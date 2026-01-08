import { Module } from '@nestjs/common';
import { GBoxService } from './gbox.service';
import { GBoxController } from './gbox.controller';

@Module({
  controllers: [GBoxController],
  providers: [GBoxService],
  exports: [GBoxService],
})
export class GBoxModule {}
