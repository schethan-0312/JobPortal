import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [NotificationsModule, EmailModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
