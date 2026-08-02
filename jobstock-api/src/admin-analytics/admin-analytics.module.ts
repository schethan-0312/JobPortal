import { Module } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service.js';
import { AdminAnalyticsController } from './admin-analytics.controller.js';

@Module({
  providers: [AdminAnalyticsService],
  controllers: [AdminAnalyticsController],
})
export class AdminAnalyticsModule {}
