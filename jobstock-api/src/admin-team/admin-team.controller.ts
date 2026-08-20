import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminTeamService } from './admin-team.service.js';
import { InviteAdminDto } from './dto/invite-admin.dto.js';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { AdminRole, Role } from '../../generated/prisma/enums.js';

@Controller('admin/team')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
export class AdminTeamController {
  constructor(private readonly teamService: AdminTeamService) {}

  @Get()
  list() {
    return this.teamService.list();
  }

  @Post('invite')
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteAdminDto, @Req() req: Request) {
    return this.teamService.invite(user.userId, dto, req.ip);
  }

  @Patch(':id/role')
  updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoleDto,
    @Req() req: Request,
  ) {
    return this.teamService.updateRole(user.userId, id, dto, req.ip);
  }

  @Post(':id/force-logout')
  forceLogout(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.teamService.forceLogout(user.userId, id, req.ip);
  }

  @Get(':id/sessions')
  listSessions(@Param('id') id: string) {
    return this.teamService.listSessions(id);
  }
}
