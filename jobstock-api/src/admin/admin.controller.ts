import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service.js';
import { VerifyEmployerDto } from './dto/verify-employer.dto.js';
import { ResolveReportDto } from './dto/resolve-report.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('employers/pending')
  listPendingEmployers() {
    return this.adminService.listPendingEmployers();
  }

  @Patch('employers/:id/verify')
  verifyEmployer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VerifyEmployerDto,
    @Req() req: Request,
  ) {
    return this.adminService.verifyEmployer(user.userId, id, dto, req.ip);
  }

  @Get('reports')
  listOpenReports() {
    return this.adminService.listOpenReports();
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @Req() req: Request,
  ) {
    return this.adminService.resolveReport(user.userId, id, dto, req.ip);
  }

  @Patch('jobs/:id/flag')
  flagJob(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.adminService.flagJob(user.userId, id, req.ip);
  }

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
