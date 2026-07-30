import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AutoShortlistService } from './auto-shortlist.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('auto-shortlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EMPLOYER)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class AutoShortlistController {
  constructor(private readonly autoShortlistService: AutoShortlistService) {}

  @Get('job/:jobId')
  rankApplicants(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string) {
    return this.autoShortlistService.rankApplicants(user.userId, jobId);
  }
}
