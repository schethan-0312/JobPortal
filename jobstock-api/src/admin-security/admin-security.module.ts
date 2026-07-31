import { Module } from '@nestjs/common';
import { AdminSecurityService } from './admin-security.service.js';
import { AdminSecurityController } from './admin-security.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminSecurityService],
  controllers: [AdminSecurityController],
  exports: [AdminSecurityService],
})
export class AdminSecurityModule {}
