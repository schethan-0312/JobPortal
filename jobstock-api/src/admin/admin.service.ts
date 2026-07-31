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

    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        status: dto.decision === VerifyDecision.VERIFIED ? 'VERIFIED' : 'REJECTED',
        verifiedAt: new Date(),
        verifiedById: adminUserId,
      },
    });

    await this.notifications.create(
      employer.userId,
      'Company verification update',
      dto.decision === VerifyDecision.VERIFIED
        ? 'Your company has been verified. You can now post jobs.'
        : 'Your company verification was rejected. Please contact support for details.',
    );

    await this.auditLog.log({
      adminId: adminUserId,
      action: dto.decision === VerifyDecision.VERIFIED ? 'VERIFY_EMPLOYER' : 'REJECT_EMPLOYER',
      targetType: 'EMPLOYER',
      targetId: employerId,
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
