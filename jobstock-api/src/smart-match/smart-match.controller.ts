import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SmartMatchService } from './smart-match.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('smart-match')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class SmartMatchController {
  constructor(private readonly smartMatchService: SmartMatchService) {}

  @Get('jobs')
  getMatches(@CurrentUser() user: AuthenticatedUser) {
    return this.smartMatchService.getMatchesForCandidate(user.userId);
  }
}
