import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAnalyticsService } from './admin-analytics.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

function parseDays(days?: string): number {
  const parsed = parseInt(days ?? '30', 10);
  if (![7, 30, 90].includes(parsed)) return 30;
  return parsed;
}

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get('overview')
  overview(@Query('days') days?: string) {
    return this.analyticsService.overview(parseDays(days));
  }

  @Get('breakdowns')
  breakdowns() {
    return this.analyticsService.breakdowns();
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query('report') report: string, @Query('days') days: string | undefined, @Res() res: Response) {
    const { filename, csv } = await this.analyticsService.exportCsv(report, parseDays(days));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
