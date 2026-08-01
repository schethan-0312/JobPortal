import { Module } from '@nestjs/common';
import { AdminSupportService } from './admin-support.service.js';
import { AdminSupportController } from './admin-support.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminSupportService],
  controllers: [AdminSupportController],
})
export class AdminSupportModule {}
