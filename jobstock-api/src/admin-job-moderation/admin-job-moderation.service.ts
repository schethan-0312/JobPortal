import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { EmailService } from '../email/email.service.js';
import { AuditTargetType, JobStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class AdminJobModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  async list(params: { status?: JobStatus; search?: string; page: number; pageSize: number }) {
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' as const } },
              { employer: { companyName: { contains: params.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          category: true,
          location: true,
          jobType: true,
          status: true,
          createdAt: true,
          employer: { select: { companyName: true, status: true } },
          _count: { select: { applications: true, reports: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items: items.map((j) => ({
        id: j.id,
        title: j.title,
        category: j.category,
        location: j.location,
        jobType: j.jobType,
        status: j.status,
        createdAt: j.createdAt,
        employerName: j.employer.companyName,
        employerStatus: j.employer.status,
        applicationsCount: j._count.applications,
        reportsCount: j._count.reports,
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getDetail(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: { select: { id: true, companyName: true, status: true, userId: true } },
        reports: { orderBy: { createdAt: 'desc' }, include: { reporter: { select: { email: true } } } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async setStatus(actorId: string, jobId: string, status: JobStatus, ip?: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const updated = await this.prisma.job.update({ where: { id: jobId }, data: { status }, include: { employer: { include: { user: true } } } });
    if (status === 'OPEN' || status === 'FLAGGED') {
      this.emailService.sendJobModerationStatus({
        email: updated.employer.user.email,
        jobTitle: updated.title,
        companyName: updated.employer.companyName,
        status: status === 'OPEN' ? 'APPROVED' : 'REJECTED'
      }).catch(console.error);
    }

    await this.auditLog.log({
      adminId: actorId,
      action: `JOB_STATUS_${status}`,
      targetType: AuditTargetType.JOB,
      targetId: jobId,
      metadata: { title: job.title, previousStatus: job.status },
      ipAddress: ip,
    });

    return updated;
  }
}
