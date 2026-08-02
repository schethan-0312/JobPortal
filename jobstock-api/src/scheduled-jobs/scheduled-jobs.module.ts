import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledJobsService } from './scheduled-jobs.service.js';
import { AdminDatabaseModule } from '../admin-database/admin-database.module.js';

@Module({
  imports: [ScheduleModule.forRoot(), AdminDatabaseModule],
  providers: [ScheduledJobsService],
  exports: [ScheduledJobsService],
})
export class ScheduledJobsModule {}
