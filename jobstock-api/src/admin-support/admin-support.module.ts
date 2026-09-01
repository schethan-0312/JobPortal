import { Module } from '@nestjs/common';
import { AdminSupportService } from './admin-support.service.js';
import { AdminSupportController } from './admin-support.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule, AuditLogModule],
  providers: [AdminSupportService],
  controllers: [AdminSupportController],
})
export class AdminSupportModule {}
