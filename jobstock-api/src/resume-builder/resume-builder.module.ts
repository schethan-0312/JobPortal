import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { ResumeBuilderService } from './resume-builder.service.js';
import { ResumeBuilderController } from './resume-builder.controller.js';

@Module({
  imports: [AiModule],
  providers: [ResumeBuilderService],
  controllers: [ResumeBuilderController],
})
export class ResumeBuilderModule {}
