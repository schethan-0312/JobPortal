import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SkillAssessmentService } from './skill-assessment.service.js';
import { StartAssessmentDto } from './dto/start-assessment.dto.js';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('skill-assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class SkillAssessmentController {
  constructor(private readonly skillAssessmentService: SkillAssessmentService) {}

  @Post('start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartAssessmentDto) {
    return this.skillAssessmentService.start(user.userId, dto);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SubmitAssessmentDto) {
    return this.skillAssessmentService.submit(user.userId, id, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.skillAssessmentService.listMine(user.userId);
  }

  @Get('recommended')
  getRecommended(@CurrentUser() user: AuthenticatedUser) {
    return this.skillAssessmentService.getRecommendedSkills(user.userId);
  }
}
