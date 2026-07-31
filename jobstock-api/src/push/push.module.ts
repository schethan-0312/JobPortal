import { Module } from '@nestjs/common';
import { PushService } from './push.service.js';
import { PushController } from './push.controller.js';

@Module({
  providers: [PushService],
  controllers: [PushController],
  exports: [PushService],
})
export class PushModule {}
