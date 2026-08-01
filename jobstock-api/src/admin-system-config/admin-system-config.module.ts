import { Module } from '@nestjs/common';
import { AdminSystemConfigService } from './admin-system-config.service.js';
import { AdminSystemConfigController } from './admin-system-config.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { SystemConfigModule } from '../system-config/system-config.module.js';

@Module({
  imports: [AuditLogModule, SystemConfigModule],
  providers: [AdminSystemConfigService],
  controllers: [AdminSystemConfigController],
})
export class AdminSystemConfigModule {}
