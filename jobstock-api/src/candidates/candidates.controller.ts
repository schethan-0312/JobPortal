import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CandidatesService } from './candidates.service.js';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto.js';
import { CreateJobAlertDto } from './dto/create-job-alert.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @CurrentUser() user: AuthenticatedUser | null,
    @Query('location') location?: string,
    @Query('skill') skill?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
  ) {
    return this.candidatesService.listPublic(
      {
        location,
        skill,
        page: Math.max(1, parseInt(page, 10) || 1),
        pageSize: Math.min(50, Math.max(1, parseInt(pageSize, 10) || 12)),
      },
      user,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.candidatesService.getMyProfile(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  updateMyProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCandidateProfileDto) {
    return this.candidatesService.updateMyProfile(user.userId, dto);
  }

  @Get('me/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  getMyResume(@CurrentUser() user: AuthenticatedUser) {
    return this.candidatesService.getMyResume(user.userId);
  }

  @Put('me/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  syncResume(@CurrentUser() user: AuthenticatedUser, @Body() dto: any) {
    return this.candidatesService.syncResume(user.userId, dto);
  }

  @Get('saved-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  listSavedJobs(@CurrentUser() user: AuthenticatedUser) {
    return this.candidatesService.listSavedJobs(user.userId);
  }

  @Post('saved-jobs/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  saveJob(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string) {
    return this.candidatesService.saveJob(user.userId, jobId);
  }

  @Delete('saved-jobs/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  unsaveJob(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string) {
    return this.candidatesService.unsaveJob(user.userId, jobId);
  }

  @Get('job-alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  listJobAlerts(@CurrentUser() user: AuthenticatedUser) {
    return this.candidatesService.listJobAlerts(user.userId);
  }

  @Post('job-alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  createJobAlert(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJobAlertDto) {
    return this.candidatesService.createJobAlert(user.userId, dto);
  }

  @Delete('job-alerts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  deleteJobAlert(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.candidatesService.deleteJobAlert(user.userId, id);
  }

  @Get('followed-employers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  listFollowedEmployers(@CurrentUser() user: AuthenticatedUser) {
    return this.candidatesService.listFollowedEmployers(user.userId);
  }

  @Post('follow-employer/:employerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  followEmployer(@CurrentUser() user: AuthenticatedUser, @Param('employerId') employerId: string) {
    return this.candidatesService.followEmployer(user.userId, employerId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  searchForEmployers(
    @Query('location') location?: string,
    @Query('skill') skill?: string,
    @Query('minExperience') minExperience?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
  ) {
    return this.candidatesService.searchForEmployers({
      location,
      skill,
      minExperience: minExperience ? Math.max(0, parseInt(minExperience, 10) || 0) : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(50, Math.max(1, parseInt(pageSize, 10) || 12)),
    });
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.candidatesService.getPublicProfile(id);
  }
}
