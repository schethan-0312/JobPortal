import { Module } from '@nestjs/common';
import { AdminIntegrationsService } from './admin-integrations.service.js';
import { AdminIntegrationsController } from './admin-integrations.controller.js';

@Module({
  providers: [AdminIntegrationsService],
  controllers: [AdminIntegrationsController],
})
export class AdminIntegrationsModule {}
