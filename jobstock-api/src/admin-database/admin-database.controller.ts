import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminDatabaseService } from './admin-database.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { AdminRole, Role } from '../../generated/prisma/enums.js';

@Controller('admin/database')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
export class AdminDatabaseController {
  constructor(private readonly databaseService: AdminDatabaseService) {}

  @Get('overview')
  overview() {
    return this.databaseService.overview();
  }

  @Get('backups')
  listBackups() {
    return this.databaseService.listBackups();
  }

  @Post('backups')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  triggerBackup(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.databaseService.triggerBackup(user.userId, req.ip);
  }

  @Get('users/:userId/export')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  exportUserData(@Param('userId') userId: string) {
    return this.databaseService.exportUserData(userId);
  }

  @Post('users/:userId/purge')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  purgeUserData(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string, @Req() req: Request) {
    return this.databaseService.purgeUserData(user.userId, userId, req.ip);
  }
}
