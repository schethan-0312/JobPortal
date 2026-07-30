import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { EmployersService } from './employers.service.js';
import { UpdateEmployerDto } from './dto/update-employer.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('employers')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  @Get()
  list(
    @Query('location') location?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
  ) {
    return this.employersService.listVerified({
      location,
      search,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(50, Math.max(1, parseInt(pageSize, 10) || 12)),
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.employersService.getMyProfile(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  updateMyProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateEmployerDto) {
    return this.employersService.updateMyProfile(user.userId, dto);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.employersService.getPublicProfile(id);
  }
}
