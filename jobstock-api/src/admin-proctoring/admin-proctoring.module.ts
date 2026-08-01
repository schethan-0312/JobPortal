import { Module } from '@nestjs/common';
import { AdminProctoringService } from './admin-proctoring.service.js';
import { AdminProctoringController } from './admin-proctoring.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminProctoringService],
  controllers: [AdminProctoringController],
})
export class AdminProctoringModule {}
