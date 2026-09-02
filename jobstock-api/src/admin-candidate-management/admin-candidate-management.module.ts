import { Module } from '@nestjs/common';
import { AdminCandidateManagementService } from './admin-candidate-management.service.js';
import { AdminCandidateManagementController } from './admin-candidate-management.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [AuditLogModule, EmailModule],
  providers: [AdminCandidateManagementService],
  controllers: [AdminCandidateManagementController],
})
export class AdminCandidateManagementModule {}
