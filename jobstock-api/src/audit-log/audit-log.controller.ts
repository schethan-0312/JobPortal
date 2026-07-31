import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { AuditTargetType } from '../../generated/prisma/enums.js';

@Controller('admin/audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  list(
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: AuditTargetType,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    return this.auditLogService.list({
      adminId,
      action,
      targetType,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get(':targetType/:targetId')
  forTarget(@Param('targetType') targetType: AuditTargetType, @Param('targetId') targetId: string) {
    return this.auditLogService.forTarget(targetType, targetId);
  }
}
