import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogController } from './audit-log.controller.js';

@Module({
  providers: [AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
