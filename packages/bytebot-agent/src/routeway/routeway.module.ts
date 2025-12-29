import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoutewayService } from './routeway.service';

@Module({
  imports: [ConfigModule],
  providers: [RoutewayService],
  exports: [RoutewayService],
})
export class RoutewayModule {}
