import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { SmartMatchService } from './smart-match.service.js';
import { SmartMatchController } from './smart-match.controller.js';

@Module({
  imports: [AiModule],
  providers: [SmartMatchService],
  controllers: [SmartMatchController],
})
export class SmartMatchModule {}
