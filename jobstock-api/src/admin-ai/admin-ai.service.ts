import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AiFeature, AuditTargetType } from '../../generated/prisma/enums.js';
import { ToggleFeatureDto } from './dto/toggle-feature.dto.js';

const ALL_FEATURES = Object.values(AiFeature);

@Injectable()
export class AdminAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async overview() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [byFeature, disabledConfigs, totalCalls, totalFailures] = await Promise.all([
      this.prisma.aiUsageLog.groupBy({
        by: ['feature'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _avg: { latencyMs: true, totalTokens: true },
        _sum: { totalTokens: true },
      }),
      this.prisma.aiFeatureConfig.findMany(),
      this.prisma.aiUsageLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.aiUsageLog.count({ where: { createdAt: { gte: since }, success: false } }),
    ]);

    const failuresByFeature = await this.prisma.aiUsageLog.groupBy({
      by: ['feature'],
      where: { createdAt: { gte: since }, success: false },
      _count: { _all: true },
    });
    const failureMap = new Map(failuresByFeature.map((f) => [f.feature, f._count._all]));
    const statsMap = new Map(byFeature.map((f) => [f.feature, f]));
    const disabledSet = new Set(disabledConfigs.filter((c) => !c.enabled).map((c) => c.feature));

    const features = ALL_FEATURES.map((feature) => {
      const stat = statsMap.get(feature);
      const calls = stat?._count._all ?? 0;
      const failures = failureMap.get(feature) ?? 0;
      return {
        feature,
        enabled: !disabledSet.has(feature),
        calls,
        failures,
        successRate: calls > 0 ? Math.round(((calls - failures) / calls) * 1000) / 10 : null,
        avgLatencyMs: stat?._avg.latencyMs ? Math.round(stat._avg.latencyMs) : null,
        totalTokens: stat?._sum.totalTokens ?? 0,
      };
    });

    return {
      windowDays: 30,
      totalCalls,
      totalFailures,
      totalTokens: features.reduce((sum, f) => sum + f.totalTokens, 0),
      features,
    };
  }

  async listUsage(params: {
    feature?: AiFeature;
    success?: boolean;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(params.feature ? { feature: params.feature } : {}),
      ...(params.success !== undefined ? { success: params.success } : {}),
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
      this.prisma.aiUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.aiUsageLog.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async listFeatureConfigs() {
    const configs = await this.prisma.aiFeatureConfig.findMany();
    const configMap = new Map(configs.map((c) => [c.feature, c]));
    return ALL_FEATURES.map((feature) => ({
      feature,
      enabled: configMap.get(feature)?.enabled ?? true,
      updatedAt: configMap.get(feature)?.updatedAt ?? null,
    }));
  }

  async toggleFeature(actorId: string, feature: AiFeature, dto: ToggleFeatureDto, ip?: string) {
    const updated = await this.prisma.aiFeatureConfig.upsert({
      where: { feature },
      create: { feature, enabled: dto.enabled, updatedById: actorId },
      update: { enabled: dto.enabled, updatedById: actorId },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: dto.enabled ? 'AI_FEATURE_ENABLED' : 'AI_FEATURE_DISABLED',
      targetType: AuditTargetType.CONFIG,
      targetId: feature,
      ipAddress: ip,
    });

    return updated;
  }
}
