import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { AutoShortlistService } from './auto-shortlist.service.js';
import { AutoShortlistController } from './auto-shortlist.controller.js';

@Module({
  imports: [AiModule],
  providers: [AutoShortlistService],
  controllers: [AutoShortlistController],
})
export class AutoShortlistModule {}
