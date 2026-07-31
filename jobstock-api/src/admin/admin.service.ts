import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { VerifyEmployerDto, VerifyDecision } from './dto/verify-employer.dto.js';
import { ResolveReportDto } from './dto/resolve-report.dto.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
  ) {}

  listPendingEmployers() {
    return this.prisma.employer.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { email: true, createdAt: true } } },
    });
  }

  async verifyEmployer(adminUserId: string, employerId: string, dto: VerifyEmployerDto, ip?: string) {
    const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const statusMap = {
      [VerifyDecision.VERIFIED]: 'VERIFIED',
      [VerifyDecision.REJECTED]: 'REJECTED',
      [VerifyDecision.INFO_REQUESTED]: 'INFO_REQUESTED',
    } as const;

    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        status: statusMap[dto.decision],
        ...(dto.decision === VerifyDecision.VERIFIED ? { verifiedAt: new Date(), verifiedById: adminUserId } : {}),
      },
    });

    // Full history entry — the current `status` field only ever holds the latest
    // state, this table is what lets an admin see the whole submitted → info
    // requested → resubmitted → approved timeline for one employer.
    await this.prisma.verificationHistoryEntry.create({
      data: {
        employerId,
        decision: dto.decision,
        reason: dto.reason,
        requestedDocuments: dto.requestedDocuments ?? [],
        adminId: adminUserId,
      },
    });

    const notificationBody =
      dto.decision === VerifyDecision.VERIFIED
        ? 'Your company has been verified. You can now post jobs.'
        : dto.decision === VerifyDecision.REJECTED
          ? `Your company verification was rejected.${dto.reason ? ` Reason: ${dto.reason}` : ' Please contact support for details.'}`
          : `We need more information to verify your company.${dto.reason ? ` ${dto.reason}` : ''}${
              dto.requestedDocuments?.length ? ` Please provide: ${dto.requestedDocuments.join(', ')}.` : ''
            }`;

    await this.notifications.create(employer.userId, 'Company verification update', notificationBody);

    await this.auditLog.log({
      adminId: adminUserId,
      action: `EMPLOYER_VERIFICATION_${dto.decision}`,
      targetType: 'EMPLOYER',
      targetId: employerId,
      reason: dto.reason,
      metadata: { companyName: employer.companyName, decision: dto.decision },
      ipAddress: ip,
    });

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

  async resolveReport(adminUserId: string, reportId: string, dto: ResolveReportDto, ip?: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED', resolutionNote: dto.resolutionNote, resolvedAt: new Date() },
    });

    await this.auditLog.log({
      adminId: adminUserId,
      action: 'RESOLVE_REPORT',
      targetType: 'REPORT',
      targetId: reportId,
      reason: dto.resolutionNote,
      metadata: { targetType: report.targetType },
      ipAddress: ip,
    });

    return updated;
  }

  async flagJob(adminUserId: string, jobId: string, ip?: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const updated = await this.prisma.job.update({ where: { id: jobId }, data: { status: 'FLAGGED' } });

    await this.auditLog.log({
      adminId: adminUserId,
      action: 'FLAG_JOB',
      targetType: 'JOB',
      targetId: jobId,
      metadata: { title: job.title },
      ipAddress: ip,
    });

    return updated;
  }

  async getDashboardStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fortnightAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalCandidates,
      totalEmployers,
      pendingEmployers,
      jobsThisWeek,
      applicationsThisWeek,
      openReports,
      revenueLast30Days,
      failedLoginsLast24h,
      blockedIpsCount,
      aiFailuresLast24h,
      disabledAiFeatures,
      signupRows,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYER' } }),
      this.prisma.employer.count({ where: { status: 'PENDING' } }),
      this.prisma.job.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.application.count({ where: { appliedAt: { gte: weekAgo } } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: monthAgo } },
        _sum: { amountInPaisa: true },
      }),
      this.prisma.failedLogin.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.blockedIp.count(),
      this.prisma.aiUsageLog.count({ where: { success: false, createdAt: { gte: dayAgo } } }),
      this.prisma.aiFeatureConfig.count({ where: { enabled: false } }),
      this.prisma.$queryRaw<{ day: Date; role: string; count: bigint }[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, role, COUNT(*)::bigint AS count
        FROM "User"
        WHERE "createdAt" >= ${fortnightAgo} AND role IN ('CANDIDATE', 'EMPLOYER')
        GROUP BY day, role
        ORDER BY day ASC
      `,
    ]);

    const signupTrend: { date: string; candidates: number; employers: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      const candidates = signupRows.find(
        (r) => r.day.toISOString().slice(0, 10) === dateKey && r.role === 'CANDIDATE',
      );
      const employers = signupRows.find((r) => r.day.toISOString().slice(0, 10) === dateKey && r.role === 'EMPLOYER');
      signupTrend.push({
        date: dateKey,
        candidates: Number(candidates?.count ?? 0),
        employers: Number(employers?.count ?? 0),
      });
    }

    return {
      totalCandidates,
      totalEmployers,
      pendingEmployers,
      jobsThisWeek,
      applicationsThisWeek,
      openReports,
      revenueLast30DaysPaisa: revenueLast30Days._sum.amountInPaisa ?? 0,
      alerts: {
        pendingEmployers,
        openReports,
        failedLoginsLast24h,
        blockedIpsCount,
        aiFailuresLast24h,
        disabledAiFeatures,
      },
      signupTrend,
    };
  }
}
