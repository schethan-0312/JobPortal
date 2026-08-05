import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ResumeBuilderService } from './resume-builder.service.js';
import { GenerateResumeDto } from './dto/generate-resume.dto.js';
import { SuggestImprovementDto } from './dto/suggest-improvement.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('resume-builder')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class ResumeBuilderController {
  constructor(private readonly resumeBuilderService: ResumeBuilderService) {}

  @Post('generate')
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateResumeDto) {
    return this.resumeBuilderService.generate(user.userId, dto);
  }

  @Post('suggest')
  suggest(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuggestImprovementDto) {
    return this.resumeBuilderService.suggestImprovement(user.userId, dto);
  }
}
