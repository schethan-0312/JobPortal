import { Module } from '@nestjs/common';
import { FollowService } from './follow.service.js';
import { FollowController } from './follow.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {}

