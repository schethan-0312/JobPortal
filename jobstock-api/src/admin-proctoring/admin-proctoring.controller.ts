import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminProctoringService } from './admin-proctoring.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin/proctoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProctoringController {
  constructor(private readonly proctoringService: AdminProctoringService) {}

  @Get('overview')
  overview() {
    return this.proctoringService.overview();
  }

  @Get('assessments')
  listAssessments(
    @Query('flaggedOnly') flaggedOnly?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.proctoringService.listAssessments({
      flaggedOnly: flaggedOnly === 'true',
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get('interviews')
  listInterviews(
    @Query('flaggedOnly') flaggedOnly?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.proctoringService.listInterviews({
      flaggedOnly: flaggedOnly === 'true',
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Post('assessments/:id/invalidate')
  invalidateAssessment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.proctoringService.invalidateAssessment(user.userId, id, req.ip);
  }

  @Post('interviews/:id/invalidate')
  invalidateInterview(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.proctoringService.invalidateInterview(user.userId, id, req.ip);
  }
}
