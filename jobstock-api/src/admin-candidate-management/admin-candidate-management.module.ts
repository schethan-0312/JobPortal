import { Module } from '@nestjs/common';
import { AdminCandidateManagementService } from './admin-candidate-management.service.js';
import { AdminCandidateManagementController } from './admin-candidate-management.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminCandidateManagementService],
  controllers: [AdminCandidateManagementController],
})
export class AdminCandidateManagementModule {}
