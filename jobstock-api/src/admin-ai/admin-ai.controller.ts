import { Body, Controller, Get, Param, ParseEnumPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAiService } from './admin-ai.service.js';
import { ToggleFeatureDto } from './dto/toggle-feature.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { AiFeature, Role } from '../../generated/prisma/enums.js';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminAiController {
  constructor(private readonly adminAiService: AdminAiService) {}

  @Get('overview')
  overview() {
    return this.adminAiService.overview();
  }

  @Get('usage')
  listUsage(
    @Query('feature') feature?: string,
    @Query('success') success?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.adminAiService.listUsage({
      feature: feature && Object.values(AiFeature).includes(feature as AiFeature) ? (feature as AiFeature) : undefined,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get('feature-config')
  listFeatureConfigs() {
    return this.adminAiService.listFeatureConfigs();
  }

  @Patch('feature-config/:feature')
  toggleFeature(
    @CurrentUser() user: AuthenticatedUser,
    @Param('feature', new ParseEnumPipe(AiFeature)) feature: AiFeature,
    @Body() dto: ToggleFeatureDto,
    @Req() req: Request,
  ) {
    return this.adminAiService.toggleFeature(user.userId, feature, dto, req.ip);
  }
}
