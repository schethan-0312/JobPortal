import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { MessagesController } from './messages.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [NotificationsModule, EmailModule],
  providers: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
