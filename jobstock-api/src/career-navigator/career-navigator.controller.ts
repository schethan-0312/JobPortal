import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CareerNavigatorService } from './career-navigator.service.js';
import { GeneratePathDto } from './dto/generate-path.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('career-navigator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class CareerNavigatorController {
  constructor(private readonly careerNavigatorService: CareerNavigatorService) {}

  @Post('generate')
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: GeneratePathDto) {
    return this.careerNavigatorService.generate(user.userId, dto);
  }
}
