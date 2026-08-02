import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditTargetType } from '../../generated/prisma/enums.js';
import { UpsertSeoSettingDto } from './dto/upsert-seo-setting.dto.js';

@Injectable()
export class AdminSeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  listOverrides() {
    return this.prisma.seoSetting.findMany({ orderBy: { path: 'asc' } });
  }

  async upsert(actorId: string, path: string, dto: UpsertSeoSettingDto, ip?: string) {
    const updated = await this.prisma.seoSetting.upsert({
      where: { path },
      create: { path, ...dto, updatedById: actorId },
      update: { ...dto, updatedById: actorId },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'SEO_OVERRIDE_UPDATED',
      targetType: AuditTargetType.CONFIG,
      targetId: path,
      ipAddress: ip,
    });

    return updated;
  }

  async delete(actorId: string, path: string, ip?: string) {
    const existing = await this.prisma.seoSetting.findUnique({ where: { path } });
    if (!existing) {
      throw new NotFoundException('No override exists for this path');
    }

    await this.prisma.seoSetting.delete({ where: { path } });

    await this.auditLog.log({
      adminId: actorId,
      action: 'SEO_OVERRIDE_DELETED',
      targetType: AuditTargetType.CONFIG,
      targetId: path,
      ipAddress: ip,
    });

    return { success: true };
  }
}
