import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminCandidateManagementService } from './admin-candidate-management.service.js';
import { SuspendUserDto } from './dto/suspend-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin/candidate-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCandidateManagementController {
  constructor(private readonly candidateService: AdminCandidateManagementService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('suspended') suspended?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.candidateService.list({
      search,
      suspended: suspended === 'true' ? true : suspended === 'false' ? false : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.candidateService.getDetail(id);
  }

  @Post(':id/suspend')
  suspend(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SuspendUserDto, @Req() req: Request) {
    return this.candidateService.suspend(user.userId, id, dto, req.ip);
  }

  @Post(':id/unsuspend')
  unsuspend(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.candidateService.unsuspend(user.userId, id, req.ip);
  }

  @Patch(':id/toggle-verified')
  toggleVerified(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.candidateService.toggleVerified(user.userId, id, req.ip);
  }
}
