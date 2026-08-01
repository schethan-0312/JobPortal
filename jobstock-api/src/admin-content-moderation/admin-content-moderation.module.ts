import { Module } from '@nestjs/common';
import { AdminContentModerationService } from './admin-content-moderation.service.js';
import { AdminContentModerationController } from './admin-content-moderation.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminContentModerationService],
  controllers: [AdminContentModerationController],
})
export class AdminContentModerationModule {}
