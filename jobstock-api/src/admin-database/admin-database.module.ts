import { Module } from '@nestjs/common';
import { AdminDatabaseService } from './admin-database.service.js';
import { AdminDatabaseController } from './admin-database.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [AdminDatabaseService],
  controllers: [AdminDatabaseController],
  exports: [AdminDatabaseService],
})
export class AdminDatabaseModule {}
