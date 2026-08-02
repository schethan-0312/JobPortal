import { Module } from '@nestjs/common';
import { AdminLegalService } from './admin-legal.service.js';
import { AdminLegalController } from './admin-legal.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminLegalService],
  controllers: [AdminLegalController],
})
export class AdminLegalModule {}
