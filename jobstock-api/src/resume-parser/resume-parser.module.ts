import { Module } from '@nestjs/common';
import { ResumeParserService } from './resume-parser.service.js';
import { ResumeParserController } from './resume-parser.controller.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [AiModule],
  providers: [ResumeParserService],
  controllers: [ResumeParserController]
})
export class ResumeParserModule {}
