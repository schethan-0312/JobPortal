import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminDatabaseService } from '../admin-database/admin-database.service.js';
import { JobRunStatus } from '../../generated/prisma/enums.js';

const SYSTEM_ACTOR_ID = 'system-scheduler';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminDatabaseService: AdminDatabaseService,
  ) {}

  private async record<T>(jobName: string, triggeredBy: string, fn: () => Promise<T>): Promise<T> {
    const run = await this.prisma.jobRunRecord.create({
      data: { jobName, status: JobRunStatus.RUNNING, triggeredBy },
    });
    try {
      const result = await fn();
      await this.prisma.jobRunRecord.update({
        where: { id: run.id },
        data: { status: JobRunStatus.SUCCESS, completedAt: new Date() },
      });
      return result;
    } catch (error) {
      await this.prisma.jobRunRecord.update({
        where: { id: run.id },
        data: {
          status: JobRunStatus.FAILED,
          detail: String((error as Error)?.message ?? error).slice(0, 2000),
          completedAt: new Date(),
        },
      });
      this.logger.error(`Job ${jobName} failed`, error as Error);
      throw error;
    }
  }

  async runNightlyBackup(triggeredBy = 'schedule') {
    return this.record('nightly-database-backup', triggeredBy, async () => {
      const backup = await this.adminDatabaseService.triggerBackup(SYSTEM_ACTOR_ID);
      return { backupRecordId: backup.id };
    });
  }

  async runStaleSecurityLogCleanup(triggeredBy = 'schedule') {
    return this.record('stale-security-log-cleanup', triggeredBy, async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [failedLogins, rateLimitHits] = await Promise.all([
        this.prisma.failedLogin.deleteMany({ where: { createdAt: { lt: cutoff } } }),
        this.prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      ]);
      return { deletedFailedLogins: failedLogins.count, deletedRateLimitHits: rateLimitHits.count };
    });
  }

  @Cron('0 2 * * *')
  async handleNightlyBackupCron() {
    await this.runNightlyBackup('schedule').catch(() => {});
  }

  @Cron('0 3 * * *')
  async handleCleanupCron() {
    await this.runStaleSecurityLogCleanup('schedule').catch(() => {});
  }
}
