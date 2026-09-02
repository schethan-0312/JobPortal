import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminBackgroundJobsService } from './admin-background-jobs.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { AdminRole, Role } from '../../generated/prisma/enums.js';

@Controller('admin/background-jobs')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
export class AdminBackgroundJobsController {
  constructor(private readonly backgroundJobsService: AdminBackgroundJobsService) {}

  @Get()
  listJobs() {
    return this.backgroundJobsService.listJobs();
  }

  @Get(':jobName/history')
  listHistory(@Param('jobName') jobName: string, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.backgroundJobsService.listHistory(
      jobName,
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20)),
    );
  }

  @Post(':jobName/run')
  runNow(@CurrentUser() user: AuthenticatedUser, @Param('jobName') jobName: string) {
    return this.backgroundJobsService.runNow(jobName, `manual:${user.email}`);
  }
}
