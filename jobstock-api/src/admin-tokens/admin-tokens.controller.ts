import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminTokensService, TokenFilters } from './admin-tokens.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin/tokens')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminTokensController {
  constructor(private readonly adminTokensService: AdminTokensService) {}

  @Get('overview')
  async getOverview(@Query() filters: TokenFilters) {
    return this.adminTokensService.getOverview(filters);
  }

  @Get('users')
  async getUserUsage(
    @Query() filters: TokenFilters,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.adminTokensService.getUserUsage(
      filters,
      search,
      sortBy || 'totalTokens',
      sortOrder || 'desc',
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    );
  }

  @Get('users/:userId')
  async getUserDetails(@Param('userId') userId: string) {
    return this.adminTokensService.getUserDetails(userId);
  }

  @Get('analytics')
  async getAnalytics(@Query() filters: TokenFilters, @Query('period') period?: 'daily' | 'weekly' | 'monthly') {
    return this.adminTokensService.getAnalytics(filters, period || 'daily');
  }

  @Get('history')
  async getHistory(
    @Query() filters: TokenFilters,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.adminTokensService.getHistory(
      filters,
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    );
  }

  @Get('export')
  async exportCsv(@Query() filters: TokenFilters, @Res() res: Response) {
    const csv = await this.adminTokensService.exportCsv(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=token-usage.csv');
    return res.status(200).send(csv);
  }
}
