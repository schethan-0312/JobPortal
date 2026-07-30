import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { EmployersModule } from '../employers/employers.module.js';
import { JobMatchingModule } from '../job-matching/job-matching.module.js';

@Module({
  imports: [EmployersModule, JobMatchingModule],
  providers: [JobsService],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}
