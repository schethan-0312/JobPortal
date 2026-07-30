import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CareerNavigatorService } from './career-navigator.service.js';
import { CareerNavigatorController } from './career-navigator.controller.js';

@Module({
  imports: [AiModule],
  providers: [CareerNavigatorService],
  controllers: [CareerNavigatorController],
})
export class CareerNavigatorModule {}
