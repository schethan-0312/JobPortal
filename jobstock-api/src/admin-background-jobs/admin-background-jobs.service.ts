import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ScheduledJobsService } from '../scheduled-jobs/scheduled-jobs.service.js';
import { JOB_DEFINITIONS } from '../scheduled-jobs/job-registry.js';

@Injectable()
export class AdminBackgroundJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduledJobs: ScheduledJobsService,
  ) {}

  async listJobs() {
    const lastRuns = await Promise.all(
      JOB_DEFINITIONS.map((def) =>
        this.prisma.jobRunRecord.findFirst({ where: { jobName: def.name }, orderBy: { startedAt: 'desc' } }),
      ),
    );

    return JOB_DEFINITIONS.map((def, i) => ({
      ...def,
      lastRun: lastRuns[i],
    }));
  }

  async listHistory(jobName: string, page: number, pageSize: number) {
    const where = { jobName };
    const [items, total] = await Promise.all([
      this.prisma.jobRunRecord.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.jobRunRecord.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async runNow(jobName: string, triggeredBy: string) {
    if (jobName === 'nightly-database-backup') {
      return this.scheduledJobs.runNightlyBackup(triggeredBy);
    }
    if (jobName === 'stale-security-log-cleanup') {
      return this.scheduledJobs.runStaleSecurityLogCleanup(triggeredBy);
    }
    throw new BadRequestException('Unknown job name');
  }
}
