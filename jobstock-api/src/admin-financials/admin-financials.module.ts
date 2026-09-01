import { Module } from '@nestjs/common';
import { AdminFinancialsService } from './admin-financials.service.js';
import { AdminFinancialsController } from './admin-financials.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule, AuditLogModule],
  providers: [AdminFinancialsService],
  controllers: [AdminFinancialsController],
})
export class AdminFinancialsModule {}
