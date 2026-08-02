import { Module } from '@nestjs/common';
import { AdminBackgroundJobsService } from './admin-background-jobs.service.js';
import { AdminBackgroundJobsController } from './admin-background-jobs.controller.js';
import { ScheduledJobsModule } from '../scheduled-jobs/scheduled-jobs.module.js';

@Module({
  imports: [ScheduledJobsModule],
  providers: [AdminBackgroundJobsService],
  controllers: [AdminBackgroundJobsController],
})
export class AdminBackgroundJobsModule {}
