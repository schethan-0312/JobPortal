import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import type { Request } from 'express';
import { AdminJobModerationService } from './admin-job-moderation.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { JobStatus, Role } from '../../generated/prisma/enums.js';

class SetJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;
}

@Controller('admin/job-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminJobModerationController {
  constructor(private readonly jobModerationService: AdminJobModerationService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.jobModerationService.list({
      status: status && Object.values(JobStatus).includes(status as JobStatus) ? (status as JobStatus) : undefined,
      search,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.jobModerationService.getDetail(id);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetJobStatusDto,
    @Req() req: Request,
  ) {
    return this.jobModerationService.setStatus(user.userId, id, dto.status, req.ip);
  }
}
