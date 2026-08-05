import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':targetId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE, Role.EMPLOYER)
  follow(@CurrentUser() user: AuthenticatedUser, @Param('targetId') targetId: string) {
    return this.followService.follow(user.userId, targetId);
  }

  @Delete(':targetId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE, Role.EMPLOYER)
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param('targetId') targetId: string) {
    return this.followService.unfollow(user.userId, targetId);
  }

  @Get('status/:targetId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE, Role.EMPLOYER)
  status(@CurrentUser() user: AuthenticatedUser, @Param('targetId') targetId: string) {
    return this.followService.status(user.userId, targetId);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE, Role.EMPLOYER)
  following(@CurrentUser() user: AuthenticatedUser) {
    return this.followService.following(user.userId);
  }

  @Get('counts/:id')
  counts(@Param('id') id: string) {
    return this.followService.counts(id);
  }
}
