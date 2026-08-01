import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminSupportService } from './admin-support.service.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { AdminReplyDto } from './dto/admin-reply.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role, TicketPriority, TicketStatus } from '../../generated/prisma/enums.js';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSupportController {
  constructor(private readonly adminSupportService: AdminSupportService) {}

  @Get('overview')
  overview() {
    return this.adminSupportService.overview();
  }

  @Get('tickets')
  list(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.adminSupportService.list({
      status: status && Object.values(TicketStatus).includes(status as TicketStatus) ? (status as TicketStatus) : undefined,
      priority:
        priority && Object.values(TicketPriority).includes(priority as TicketPriority)
          ? (priority as TicketPriority)
          : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get('tickets/:id')
  getDetail(@Param('id') id: string) {
    return this.adminSupportService.getDetail(id);
  }

  @Patch('tickets/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: Request,
  ) {
    return this.adminSupportService.update(user.userId, id, dto, req.ip);
  }

  @Post('tickets/:id/assign')
  assign(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.adminSupportService.assign(user.userId, id, req.ip);
  }

  @Post('tickets/:id/reply')
  reply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdminReplyDto,
    @Req() req: Request,
  ) {
    return this.adminSupportService.reply(user.userId, id, dto, req.ip);
  }
}
