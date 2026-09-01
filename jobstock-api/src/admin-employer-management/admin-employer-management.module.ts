import { EmailModule } from '../email/email.module.js';
import { Module } from '@nestjs/common';
import { AdminEmployerManagementService } from './admin-employer-management.service.js';
import { AdminEmployerManagementController } from './admin-employer-management.controller.js';

@Module({
  imports: [EmailModule],
  providers: [AdminEmployerManagementService],
  controllers: [AdminEmployerManagementController],
})
export class AdminEmployerManagementModule {}
