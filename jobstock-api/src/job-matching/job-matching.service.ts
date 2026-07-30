import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { Job } from '../../generated/prisma/client.js';

const GENERAL_INTEREST_LIMIT = 20;

/**
 * Fan-out matching that runs once, synchronously, right after a job is posted.
 * Two independent, cheap (no AI) passes:
 *  1. Explicit job alerts — a candidate opted into these criteria, so a match is a
 *     strong, real-time-worthy signal.
 *  2. General skill/location overlap — a lighter-touch notification for candidates
 *     who look like a fit but never set up an alert. Capped and recency-ordered so
 *     it can't turn into a spam blast on a broad job post.
 * Deliberately does NOT call the AI scorer here — that runs on-demand (Smart Match)
 * when a candidate actually opens their dashboard, not synchronously for every
 * candidate on every job post. Doing per-candidate AI calls at post-time wouldn't
 * scale and would make job creation slow.
 */
@Injectable()
export class JobMatchingService {
  private readonly logger = new Logger(JobMatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async onJobPosted(job: Job): Promise<void> {
    try {
      const alertedUserIds = await this.matchJobAlerts(job);
      await this.matchGeneralInterest(job, alertedUserIds);
    } catch (err) {
      // Matching is best-effort — a failure here must never fail the job-posting request.
      this.logger.error(`Job matching failed for job ${job.id}: ${(err as Error).message}`);
    }
  }

  /** Notifies candidates whose saved Job Alert criteria match this job. Returns the set of userIds notified. */
  private async matchJobAlerts(job: Job): Promise<Set<string>> {
    const alerts = await this.prisma.jobAlert.findMany();
    const notified = new Set<string>();

    const haystack = `${job.title} ${job.description}`.toLowerCase();

    for (const alert of alerts) {
      const categoryOk = !alert.category || alert.category.toLowerCase() === job.category.toLowerCase();
      const locationOk = !alert.location || job.location.toLowerCase().includes(alert.location.toLowerCase());
      const keywordOk = !alert.keyword || haystack.includes(alert.keyword.toLowerCase());

      if (categoryOk && locationOk && keywordOk) {
        await this.notifications.create(
          alert.userId,
          'New job matches your alert',
          `"${job.title}" in ${job.location} matches your saved job alert.`,
        );
        notified.add(alert.userId);
      }
    }

    return notified;
  }

  /** Notifies a capped, recency-ordered set of candidates with obvious skill/location overlap. */
  private async matchGeneralInterest(job: Job, excludeUserIds: Set<string>): Promise<void> {
    const candidates = await this.prisma.candidateProfile.findMany({
      where: {
        userId: { notIn: Array.from(excludeUserIds) },
        OR: [
          { location: { contains: job.location, mode: 'insensitive' } },
          { skills: { has: job.category } },
        ],
      },
      select: { userId: true },
      orderBy: { updatedAt: 'desc' },
      take: GENERAL_INTEREST_LIMIT,
    });

    for (const candidate of candidates) {
      await this.notifications.create(
        candidate.userId,
        'New job you might like',
        `"${job.title}" in ${job.location} looks like a match for your profile.`,
      );
    }
  }
}
