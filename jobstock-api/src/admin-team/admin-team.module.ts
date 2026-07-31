import { Module } from '@nestjs/common';
import { AdminTeamService } from './admin-team.service.js';
import { AdminTeamController } from './admin-team.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminTeamService],
  controllers: [AdminTeamController],
})
export class AdminTeamModule {}
