import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { SkillAssessmentService } from './skill-assessment.service.js';
import { SkillAssessmentController } from './skill-assessment.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [AiModule, EmailModule],
  providers: [SkillAssessmentService],
  controllers: [SkillAssessmentController],
})
export class SkillAssessmentModule {}
