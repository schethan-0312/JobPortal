import { Module } from '@nestjs/common';
import { AdminEmployerManagementService } from './admin-employer-management.service.js';
import { AdminEmployerManagementController } from './admin-employer-management.controller.js';

@Module({
  providers: [AdminEmployerManagementService],
  controllers: [AdminEmployerManagementController],
})
export class AdminEmployerManagementModule {}
