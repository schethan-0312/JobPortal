import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { SkillAssessmentService } from './skill-assessment.service.js';
import { SkillAssessmentController } from './skill-assessment.controller.js';

@Module({
  imports: [AiModule],
  providers: [SkillAssessmentService],
  controllers: [SkillAssessmentController],
})
export class SkillAssessmentModule {}
