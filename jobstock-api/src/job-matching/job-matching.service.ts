import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { EmailService } from '../email/email.service.js';
import type { Job } from '../../generated/prisma/client.js';

const GENERAL_INTEREST_LIMIT = 20;

@Injectable()
export class JobMatchingService {
  private readonly logger = new Logger(JobMatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async onJobPosted(job: Job): Promise<void> {
    try {
      await this.notifyFollowers(job);
      const alertedUserIds = await this.matchJobAlerts(job);
      await this.matchGeneralInterest(job, alertedUserIds);
    } catch (err) {
      this.logger.error(`Job matching failed for job ${job.id}: ${(err as Error).message}`);
    }
  }

  private async notifyFollowers(job: Job): Promise<void> {
    const employer = await this.prisma.employer.findUnique({
      where: { id: job.employerId },
      include: { user: true }
    });
    if (!employer) return;

    const follows = await this.prisma.candidateEmployerFollow.findMany({
      where: { followingId: employer.userId },
      include: { follower: { select: { email: true, id: true } } }
    });

    for (const follow of follows) {
      if (follow.follower?.email) {
        await this.emailService.sendNewJobNotification(
          follow.follower.email,
          job.title,
          employer.companyName,
          job.location,
          job.slug
        );
      }
      
      await this.notifications.create(
        follow.follower.id,
        'New Job from ' + employer.companyName,
        `"${job.title}" was just posted by ${employer.companyName}.`,
        `/job/${job.slug}`
      );
    }
  }

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
          `/job/${job.slug}`
        );
        notified.add(alert.userId);
      }
    }

    return notified;
  }

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
        `/job/${job.slug}`
      );
    }
  }
}
