import { Controller, Delete, Get, Query, Redirect, UseGuards } from '@nestjs/common';
import { SocialAuthService } from './social-auth.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('social-auth')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Get('status')
  getStatus() {
    return {
      github: this.socialAuthService.isGithubConfigured(),
      linkedin: this.socialAuthService.isLinkedinConfigured(),
    };
  }

  @Get('github/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  startGithub(@CurrentUser() user: AuthenticatedUser) {
    return this.socialAuthService.startGithub(user.userId);
  }

  @Get('github/callback')
  @Redirect()
  async githubCallback(@Query('code') code: string, @Query('state') state: string) {
    const url = await this.socialAuthService.handleGithubCallback(code, state);
    return { url };
  }

  @Delete('github')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  disconnectGithub(@CurrentUser() user: AuthenticatedUser) {
    return this.socialAuthService.disconnectGithub(user.userId);
  }

  @Get('linkedin/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  startLinkedin(@CurrentUser() user: AuthenticatedUser) {
    return this.socialAuthService.startLinkedin(user.userId);
  }

  @Get('linkedin/callback')
  @Redirect()
  async linkedinCallback(@Query('code') code: string, @Query('state') state: string) {
    const url = await this.socialAuthService.handleLinkedinCallback(code, state);
    return { url };
  }

  @Delete('linkedin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  disconnectLinkedin(@CurrentUser() user: AuthenticatedUser) {
    return this.socialAuthService.disconnectLinkedin(user.userId);
  }
}
