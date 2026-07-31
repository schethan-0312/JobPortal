import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { BlockIpDto } from './dto/block-ip.dto.js';

const BRUTE_FORCE_WINDOW_MS = 60 * 60 * 1000;
const BRUTE_FORCE_THRESHOLD = 5;

@Injectable()
export class AdminSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listFailedLogins(params: { from?: Date; to?: Date; page: number; pageSize: number }) {
    const where = {
      ...(params.from || params.to
        ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.failedLogin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.failedLogin.count({ where }),
    ]);

    // Flag IPs with 5+ failed attempts in the last hour — a brute-force signal.
    const recentWindow = new Date(Date.now() - BRUTE_FORCE_WINDOW_MS);
    const recentFailures = await this.prisma.failedLogin.findMany({
      where: { createdAt: { gte: recentWindow }, ipAddress: { not: null } },
      select: { ipAddress: true },
    });
    const counts = new Map<string, number>();
    for (const f of recentFailures) {
      if (!f.ipAddress) continue;
      counts.set(f.ipAddress, (counts.get(f.ipAddress) ?? 0) + 1);
    }
    const suspiciousIps = [...counts.entries()]
      .filter(([, count]) => count >= BRUTE_FORCE_THRESHOLD)
      .map(([ip, count]) => ({ ipAddress: ip, attemptsLastHour: count }));

    return { items, total, page: params.page, pageSize: params.pageSize, suspiciousIps };
  }

  /**
   * "Active sessions" for a stateless-JWT app is necessarily a heuristic: the most
   * recent LoginEvent per user, shown only if it's newer than any forced revocation
   * and within a reasonable recency window (JWT_EXPIRES_IN, defaulting to 7 days).
   */
  async listActiveSessions() {
    const users = await this.prisma.user.findMany({
      where: { loginEvents: { some: {} } },
      select: {
        id: true,
        email: true,
        role: true,
        sessionRevokedAt: true,
        loginEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const windowMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - windowMs;

    return users
      .map((u) => {
        const last = u.loginEvents[0];
        if (!last) return null;
        const revoked = u.sessionRevokedAt && last.createdAt.getTime() < u.sessionRevokedAt.getTime();
        const expired = last.createdAt.getTime() < cutoff;
        return {
          userId: u.id,
          email: u.email,
          role: u.role,
          lastLoginAt: last.createdAt,
          ipAddress: last.ipAddress,
          userAgent: last.userAgent,
          active: !revoked && !expired,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null && s.active)
      .sort((a, b) => b.lastLoginAt.getTime() - a.lastLoginAt.getTime());
  }

  async revokeSession(adminId: string, targetUserId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({ where: { id: targetUserId }, data: { sessionRevokedAt: new Date() } });

    await this.auditLog.log({
      adminId,
      action: 'REVOKE_SESSION',
      targetType: 'USER',
      targetId: targetUserId,
      metadata: { email: user.email },
      ipAddress: ip,
    });

    return { success: true };
  }

  async listRateLimitHits(params: { from?: Date; to?: Date; page: number; pageSize: number }) {
    const where = {
      ...(params.from || params.to
        ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.rateLimitHit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.rateLimitHit.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  listBlockedIps() {
    return this.prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async blockIp(adminId: string, dto: BlockIpDto, ip?: string) {
    const blocked = await this.prisma.blockedIp.upsert({
      where: { ipAddress: dto.ipAddress },
      create: { ipAddress: dto.ipAddress, reason: dto.reason },
      update: { reason: dto.reason },
    });

    await this.auditLog.log({
      adminId,
      action: 'BLOCK_IP',
      targetType: 'ADMIN',
      targetId: dto.ipAddress,
      reason: dto.reason,
      ipAddress: ip,
    });

    return blocked;
  }

  async unblockIp(adminId: string, id: string, ip?: string) {
    const existing = await this.prisma.blockedIp.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Blocked IP entry not found');
    }
    await this.prisma.blockedIp.delete({ where: { id } });

    await this.auditLog.log({
      adminId,
      action: 'UNBLOCK_IP',
      targetType: 'ADMIN',
      targetId: existing.ipAddress,
      ipAddress: ip,
    });

    return { success: true };
  }
}
