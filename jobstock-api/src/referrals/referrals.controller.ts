import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('leaderboard')
  leaderboard(@Query('limit') limit = '10') {
    return this.referralsService.leaderboard(parseInt(limit, 10) || 10);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  myReferrals(@CurrentUser() user: AuthenticatedUser) {
    return this.referralsService.myReferrals(user.userId);
  }
}
