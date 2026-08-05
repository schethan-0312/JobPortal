import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ResumeScannerService } from './resume-scanner.service.js';
import { ScanResumeDto } from './dto/scan-resume.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('resume-scanner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class ResumeScannerController {
  constructor(private readonly resumeScannerService: ResumeScannerService) {}

  @Post('scan')
  scan(@CurrentUser() user: AuthenticatedUser, @Body() dto: ScanResumeDto) {
    return this.resumeScannerService.scan(user.userId, dto);
  }
}
