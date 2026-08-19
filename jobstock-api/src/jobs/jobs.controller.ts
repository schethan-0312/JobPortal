import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobStatusDto } from './dto/update-job-status.dto.js';
import { CreateJobAssessmentDto } from './dto/create-job-assessment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('dump')
  async dump() {
    const candidates = await this.jobsService['prisma'].candidateProfile.findMany();
    if (candidates.length === 0) return { error: "No candidates" };
    const assessments = await this.jobsService.getMatchingAssessments(candidates[0].userId);
    return { candidateId: candidates[0].userId, assessments };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
    @Query('jobType') jobType?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
  ) {
    return this.jobsService.findAll({
      category,
      location,
      search,
      jobType,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(50, Math.max(1, parseInt(pageSize, 10) || 12)),
    });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.jobsService.findMine(user.userId);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.jobsService.findBySlug(slug);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateStatus(user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.jobsService.remove(user.userId, id);
  }

  @Post(':id/assessment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  createAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateJobAssessmentDto,
  ) {
    return this.jobsService.createAssessment(user.userId, id, dto);
  }

  @Get('employer/assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  getEmployerAssessments(@CurrentUser() user: AuthenticatedUser) {
    return this.jobsService.getEmployerAssessments(user.userId);
  }

  @Get(':id/assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  getAssessmentsForJob(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.jobsService.getAssessmentsForJob(user.userId, id);
  }

  @Get('assessments/:assessmentId/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  getAssessmentSubmissions(@CurrentUser() user: AuthenticatedUser, @Param('assessmentId') assessmentId: string) {
    return this.jobsService.getAssessmentSubmissions(user.userId, assessmentId);
  }

  // --- Candidate Endpoints ---

  @Get('assessments/matching')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  getMatchingAssessments(@CurrentUser() user: AuthenticatedUser) {
    return this.jobsService.getMatchingAssessments(user.userId);
  }

  @Get('assessments/:assessmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  getAssessmentDetails(@CurrentUser() user: AuthenticatedUser, @Param('assessmentId') assessmentId: string) {
    return this.jobsService.getAssessmentDetailsForCandidate(user.userId, assessmentId);
  }

  @Post('assessments/:assessmentId/attempt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  startAssessmentAttempt(@CurrentUser() user: AuthenticatedUser, @Param('assessmentId') assessmentId: string) {
    return this.jobsService.startAssessmentAttempt(user.userId, assessmentId);
  }

  @Post('assessments/:assessmentId/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  submitAssessmentAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assessmentId') assessmentId: string,
    @Body() body: any,
  ) {
    return this.jobsService.submitAssessmentAttempt(user.userId, assessmentId, body);
  }
}
