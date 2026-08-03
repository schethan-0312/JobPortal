import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller.js';
import { NewsletterService } from './newsletter.service.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
