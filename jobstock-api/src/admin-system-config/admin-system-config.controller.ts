import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminSystemConfigService } from './admin-system-config.service.js';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { AdminRole, Role } from '../../generated/prisma/enums.js';

@Controller('admin/system-config')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
export class AdminSystemConfigController {
  constructor(private readonly configService: AdminSystemConfigService) {}

  @Get()
  getAll() {
    return this.configService.getAll();
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSystemConfigDto, @Req() req: Request) {
    return this.configService.update(user.userId, dto, req.ip);
  }
}
