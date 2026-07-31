import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

const REFRESH_INTERVAL_MS = 60_000;

/**
 * Blocks requests from admin-blocklisted IPs before they reach any route. Checks
 * an in-memory Set refreshed once a minute rather than hitting Postgres on every
 * single request — a blocked IP takes up to a minute to actually start being
 * blocked, which is an acceptable tradeoff at this traffic scale.
 */
@Injectable()
export class IpBlocklistMiddleware implements NestMiddleware {
  private blockedIps = new Set<string>();
  private lastRefresh = 0;

  constructor(private readonly prisma: PrismaService) {}

  private async refreshIfStale() {
    if (Date.now() - this.lastRefresh < REFRESH_INTERVAL_MS) return;
    this.lastRefresh = Date.now();
    try {
      const rows = await this.prisma.blockedIp.findMany({ select: { ipAddress: true } });
      this.blockedIps = new Set(rows.map((r) => r.ipAddress));
    } catch {
      // If the DB is briefly unreachable, keep serving with the last-known list
      // rather than failing every request closed.
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    await this.refreshIfStale();
    if (req.ip && this.blockedIps.has(req.ip)) {
      throw new ForbiddenException('Access denied');
    }
    next();
  }
}
