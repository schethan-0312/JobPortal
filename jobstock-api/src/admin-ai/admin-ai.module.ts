import { Module } from '@nestjs/common';
import { AdminAiService } from './admin-ai.service.js';
import { AdminAiController } from './admin-ai.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminAiService],
  controllers: [AdminAiController],
})
export class AdminAiModule {}
