import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminSecurityService } from './admin-security.service.js';
import { BlockIpDto } from './dto/block-ip.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSecurityController {
  constructor(private readonly securityService: AdminSecurityService) {}

  @Get('failed-logins')
  listFailedLogins(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.securityService.listFailedLogins({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get('active-sessions')
  listActiveSessions() {
    return this.securityService.listActiveSessions();
  }

  @Post('sessions/:userId/revoke')
  revokeSession(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string, @Req() req: Request) {
    return this.securityService.revokeSession(user.userId, userId, req.ip);
  }

  @Get('rate-limit-hits')
  listRateLimitHits(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.securityService.listRateLimitHits({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get('blocked-ips')
  listBlockedIps() {
    return this.securityService.listBlockedIps();
  }

  @Post('blocked-ips')
  blockIp(@CurrentUser() user: AuthenticatedUser, @Body() dto: BlockIpDto, @Req() req: Request) {
    return this.securityService.blockIp(user.userId, dto, req.ip);
  }

  @Delete('blocked-ips/:id')
  unblockIp(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.securityService.unblockIp(user.userId, id, req.ip);
  }
}
