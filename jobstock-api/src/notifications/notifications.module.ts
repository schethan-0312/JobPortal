import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { PushModule } from '../push/push.module.js';
import { SmsModule } from '../sms/sms.module.js';

@Module({
  imports: [PushModule, SmsModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
