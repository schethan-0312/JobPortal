import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { MockInterviewService } from './mock-interview.service.js';
import { MockInterviewController } from './mock-interview.controller.js';

@Module({
  imports: [AiModule],
  providers: [MockInterviewService],
  controllers: [MockInterviewController],
})
export class MockInterviewModule {}
