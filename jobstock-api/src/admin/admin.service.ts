import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { VerifyEmployerDto, VerifyDecision } from './dto/verify-employer.dto.js';
import { ResolveReportDto } from './dto/resolve-report.dto.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  listPendingEmployers() {
    return this.prisma.employer.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { email: true, createdAt: true } } },
    });
  }

  async verifyEmployer(adminUserId: string, employerId: string, dto: VerifyEmployerDto) {
    const employer = await this.prisma.employer.findUnique({ where: { id: employerId }, include: { user: true } });
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        status: dto.decision as any, // Works for VERIFIED, REJECTED, SUSPENDED
        verifiedAt: new Date(),
        verifiedById: adminUserId,
      },
    });

    await this.notifications.create(
      employer.userId,
      'Company verification update',
      dto.decision === VerifyDecision.VERIFIED
        ? 'Your company has been verified. You can now post jobs.'
        : dto.decision === VerifyDecision.REJECTED ? 'Your company verification was rejected. Please contact support for details.' : 'Your company account was suspended.'
    );

    try {
      await this.emailService.sendEmployerVerificationStatus(employer.user.email, employer.companyName, dto.decision as any);
    } catch (e) {
      // Ignore email errors
    }

    return updated;
  }

  listOpenReports() {
    return this.prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
      include: {
        reporter: { select: { email: true } },
        job: { select: { title: true, slug: true } },
      },
    });
  }

  async resolveReport(reportId: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED', resolutionNote: dto.resolutionNote, resolvedAt: new Date() },
    });
  }

  async flagJob(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return this.prisma.job.update({ where: { id: jobId }, data: { status: 'FLAGGED' } });
  }

  async getDashboardStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCandidates,
      totalEmployers,
      pendingEmployers,
      jobsThisWeek,
      applicationsThisWeek,
      openReports,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYER' } }),
      this.prisma.employer.count({ where: { status: 'PENDING' } }),
      this.prisma.job.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.application.count({ where: { appliedAt: { gte: weekAgo } } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      totalCandidates,
      totalEmployers,
      pendingEmployers,
      jobsThisWeek,
      applicationsThisWeek,
      openReports,
    };
  }
}
