import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export const SYSTEM_CONFIG_DEFAULTS = {
  maintenanceMode: false,
  maintenanceMessage: 'JobStock is currently undergoing scheduled maintenance. Please check back shortly.',
  registrationEnabled: true,
  supportEmail: 'support@jobstock.com',
  maxJobPostsPerEmployer: 50,
  platformAnnouncement: '',
} as const;

export type SystemConfigKey = keyof typeof SYSTEM_CONFIG_DEFAULTS;

@Injectable()
export class SystemConfigService {
  // Refreshed every 30s so hot-path checks (maintenance mode, registration
  // toggle) don't hit the DB on every request.
  private cache: { data: Record<string, unknown>; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async loadAll(): Promise<Record<string, unknown>> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.data;
    }
    const rows = await this.prisma.systemConfig.findMany();
    const data: Record<string, unknown> = { ...SYSTEM_CONFIG_DEFAULTS };
    for (const row of rows) {
      data[row.key] = row.value;
    }
    this.cache = { data, expiresAt: Date.now() + 30_000 };
    return data;
  }

  async getAll() {
    return this.loadAll();
  }

  async get<K extends SystemConfigKey>(key: K): Promise<(typeof SYSTEM_CONFIG_DEFAULTS)[K]> {
    const all = await this.loadAll();
    return all[key] as (typeof SYSTEM_CONFIG_DEFAULTS)[K];
  }

  async set(key: SystemConfigKey, value: unknown, updatedById?: string) {
    const updated = await this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: value as never, updatedById },
      update: { value: value as never, updatedById },
    });
    this.cache = null;
    return updated;
  }
}
