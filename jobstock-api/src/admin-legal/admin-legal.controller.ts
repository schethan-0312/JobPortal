import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminLegalService } from './admin-legal.service.js';
import { UpsertLegalDocumentDto } from './dto/upsert-legal-document.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { AdminRole, Role } from '../../generated/prisma/enums.js';

@Controller('admin/legal')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
export class AdminLegalController {
  constructor(private readonly adminLegalService: AdminLegalService) {}

  @Get()
  listAll() {
    return this.adminLegalService.listAll();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.adminLegalService.getBySlug(slug);
  }

  @Put(':slug')
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: UpsertLegalDocumentDto,
    @Req() req: Request,
  ) {
    return this.adminLegalService.upsert(user.userId, slug, dto, req.ip);
  }

  @Get(':slug/revisions')
  listRevisions(@Param('slug') slug: string) {
    return this.adminLegalService.listRevisions(slug);
  }

  @Get(':slug/revisions/:version')
  getRevision(@Param('slug') slug: string, @Param('version') version: string) {
    return this.adminLegalService.getRevision(slug, parseInt(version, 10));
  }
}
