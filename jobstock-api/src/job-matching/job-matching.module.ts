import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { EmailModule } from '../email/email.module.js';
import { JobMatchingService } from './job-matching.service.js';

@Module({
  imports: [NotificationsModule, EmailModule],
  providers: [JobMatchingService],
  exports: [JobMatchingService],
})
export class JobMatchingModule {}
