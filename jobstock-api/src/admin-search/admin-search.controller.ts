import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminSearchService } from './admin-search.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('admin/search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSearchController {
  constructor(private readonly searchService: AdminSearchService) {}

  @Get()
  search(@Query('q') q?: string) {
    return this.searchService.search(q ?? '');
  }
}
