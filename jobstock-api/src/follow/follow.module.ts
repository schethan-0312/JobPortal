import { Module } from '@nestjs/common';
import { FollowService } from './follow.service.js';
import { FollowController } from './follow.controller.js';

@Module({
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {}
