import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.CANDIDATE)
  apply(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user.userId, dto);
  }

  @Get('mine')
  @Roles(Role.CANDIDATE)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.listMine(user.userId);
  }

  @Get('for-job/:jobId')
  @Roles(Role.EMPLOYER)
  listForJob(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string) {
    return this.applicationsService.listForJob(user.userId, jobId);
  }

  @Patch(':id/status')
  @Roles(Role.EMPLOYER)
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user.userId, id, dto);
  }

  @Patch(':id/withdraw')
  @Roles(Role.CANDIDATE)
  withdraw(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.applicationsService.withdraw(user.userId, id);
  }
}
