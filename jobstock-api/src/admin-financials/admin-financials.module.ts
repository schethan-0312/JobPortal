import { Module } from '@nestjs/common';
import { AdminFinancialsService } from './admin-financials.service.js';
import { AdminFinancialsController } from './admin-financials.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminFinancialsService],
  controllers: [AdminFinancialsController],
})
export class AdminFinancialsModule {}
