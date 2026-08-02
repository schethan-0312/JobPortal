import { BadRequestException, Body, Controller, Delete, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminSeoService } from './admin-seo.service.js';
import { UpsertSeoSettingDto } from './dto/upsert-seo-setting.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { AdminRole, Role } from '../../generated/prisma/enums.js';

// path is passed as a query param (not a route param) because real paths
// contain slashes (e.g. /candidate-detail/some-slug), which would otherwise
// need awkward wildcard route matching.
@Controller('admin/seo/overrides')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
export class AdminSeoController {
  constructor(private readonly adminSeoService: AdminSeoService) {}

  @Get()
  listOverrides() {
    return this.adminSeoService.listOverrides();
  }

  @Put()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Query('path') path: string,
    @Body() dto: UpsertSeoSettingDto,
    @Req() req: Request,
  ) {
    if (!path) throw new BadRequestException('path query param is required');
    return this.adminSeoService.upsert(user.userId, path, dto, req.ip);
  }

  @Delete()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  delete(@CurrentUser() user: AuthenticatedUser, @Query('path') path: string, @Req() req: Request) {
    if (!path) throw new BadRequestException('path query param is required');
    return this.adminSeoService.delete(user.userId, path, req.ip);
  }
}
