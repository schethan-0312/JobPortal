import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
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
  ) {
    return this.adminService.verifyEmployer(user.userId, id, dto);
  }

  @Get('reports')
  listOpenReports() {
    return this.adminService.listOpenReports();
  }

  @Patch('reports/:id/resolve')
  resolveReport(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.adminService.resolveReport(id, dto);
  }

  @Patch('jobs/:id/flag')
  flagJob(@Param('id') id: string) {
    return this.adminService.flagJob(id);
  }

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
