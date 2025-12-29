import { Module } from '@nestjs/common';
import { AiosService } from './aios.service';
import { AiosController } from './aios.controller';

@Module({
  controllers: [AiosController],
  providers: [AiosService],
  exports: [AiosService],
})
export class AiosModule {}