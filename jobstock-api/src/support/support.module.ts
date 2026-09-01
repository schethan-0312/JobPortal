import { EmailModule } from '../email/email.module.js';
import { Module } from '@nestjs/common';
import { SupportService } from './support.service.js';
import { SupportController } from './support.controller.js';

@Module({
  imports: [EmailModule],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
