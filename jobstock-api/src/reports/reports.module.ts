import { EmailModule } from '../email/email.module.js';
import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';

@Module({
  imports: [EmailModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
