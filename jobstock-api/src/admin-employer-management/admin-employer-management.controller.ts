import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminEmployerManagementService } from './admin-employer-management.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin/employer-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminEmployerManagementController {
  constructor(private readonly service: AdminEmployerManagementService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.service.list({
      status,
      search,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.service.getDetail(id);
  }
}
