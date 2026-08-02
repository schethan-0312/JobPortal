import { Module } from '@nestjs/common';
import { AdminSeoService } from './admin-seo.service.js';
import { AdminSeoController } from './admin-seo.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminSeoService],
  controllers: [AdminSeoController],
})
export class AdminSeoModule {}
