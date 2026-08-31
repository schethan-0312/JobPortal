import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { MockInterviewService } from './mock-interview.service.js';
import { MockInterviewController } from './mock-interview.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [AiModule, EmailModule],
  providers: [MockInterviewService],
  controllers: [MockInterviewController],
})
export class MockInterviewModule {}
