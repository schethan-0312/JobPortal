import { Module } from '@nestjs/common';
import { AdminJobModerationService } from './admin-job-moderation.service.js';
import { AdminJobModerationController } from './admin-job-moderation.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule, AuditLogModule],
  providers: [AdminJobModerationService],
  controllers: [AdminJobModerationController],
})
export class AdminJobModerationModule {}
