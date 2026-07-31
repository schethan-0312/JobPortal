import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service.js';
import { GamificationController } from './gamification.controller.js';

@Module({
  providers: [GamificationService],
  controllers: [GamificationController],
})
export class GamificationModule {}
