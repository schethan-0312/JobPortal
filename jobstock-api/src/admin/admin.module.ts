import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [NotificationsModule, AuditLogModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
