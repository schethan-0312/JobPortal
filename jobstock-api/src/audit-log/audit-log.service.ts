import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditTargetType } from '../../generated/prisma/enums.js';

export interface AuditLogEntry {
  adminId: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Single write path for every sensitive admin action. Every other admin module
 * (candidates, employers, jobs, financials, config, security...) calls `log()`
 * here rather than writing to the AuditLog table directly, so the shape and
 * denormalized adminEmail snapshot stay consistent everywhere.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry) {
    const admin = await this.prisma.user.findUnique({
      where: { id: entry.adminId },
      select: { email: true },
    });
    return this.prisma.auditLog.create({
      data: {
        adminId: entry.adminId,
        adminEmail: admin?.email ?? 'unknown',
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        reason: entry.reason,
        metadata: entry.metadata as never,
        ipAddress: entry.ipAddress,
      },
    });
  }

  async list(params: {
    adminId?: string;
    action?: string;
    targetType?: AuditTargetType;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(params.adminId ? { adminId: params.adminId } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.targetType ? { targetType: params.targetType } : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  forTarget(targetType: AuditTargetType, targetId: string) {
    return this.prisma.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
