import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CareerNavigatorService } from './career-navigator.service.js';
import { CareerNavigatorController } from './career-navigator.controller.js';
import { CareerKnowledgeService } from './career-knowledge.service.js';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [CareerNavigatorService, CareerKnowledgeService],
  controllers: [CareerNavigatorController],
})
export class CareerNavigatorModule {}
