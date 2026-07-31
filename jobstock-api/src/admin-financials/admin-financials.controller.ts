import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminFinancialsService } from './admin-financials.service.js';
import { RefundTransactionDto } from './dto/refund-transaction.dto.js';
import { OverrideSubscriptionDto } from './dto/override-subscription.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin/financials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminFinancialsController {
  constructor(private readonly financialsService: AdminFinancialsService) {}

  @Get('mode')
  getMode() {
    return this.financialsService.getMode();
  }

  @Get('transactions')
  listTransactions(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.financialsService.listTransactions({
      status,
      userId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Post('transactions/:id/refund')
  refundTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RefundTransactionDto,
    @Req() req: Request,
  ) {
    return this.financialsService.refundTransaction(user.userId, id, dto, req.ip);
  }

  @Get('revenue-summary')
  revenueSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.financialsService.revenueSummary(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Get('refund-rate')
  refundRate(@Query('from') from?: string, @Query('to') to?: string) {
    return this.financialsService.refundRate(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Get('subscriptions')
  listSubscriptions() {
    return this.financialsService.listSubscriptions();
  }

  @Patch('subscriptions/:id/override')
  overrideSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: OverrideSubscriptionDto,
    @Req() req: Request,
  ) {
    return this.financialsService.overrideSubscription(user.userId, id, dto, req.ip);
  }
}
