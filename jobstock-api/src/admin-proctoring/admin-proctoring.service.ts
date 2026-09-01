import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { EmailService } from '../email/email.service.js';
import { AuditTargetType } from '../../generated/prisma/enums.js';

@Injectable()
export class AdminProctoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  async overview() {
    const [
      totalAssessments,
      flaggedAssessments,
      totalInterviews,
      flaggedInterviews,
    ] = await Promise.all([
      this.prisma.skillAssessment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.skillAssessment.count({
        where: { status: 'COMPLETED', OR: [{ violations: { gt: 0 } }, { timeExceeded: true }] },
      }),
      this.prisma.mockInterview.count({ where: { status: 'COMPLETED' } }),
      this.prisma.mockInterview.count({
        where: { status: 'COMPLETED', OR: [{ violations: { gt: 0 } }, { timeExceeded: true }] },
      }),
    ]);

    return { totalAssessments, flaggedAssessments, totalInterviews, flaggedInterviews };
  }

  async listAssessments(params: { flaggedOnly?: boolean; page: number; pageSize: number }) {
    const where = {
      status: 'COMPLETED',
      ...(params.flaggedOnly ? { OR: [{ violations: { gt: 0 } }, { timeExceeded: true }] } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.skillAssessment.findMany({
        where,
        select: {
          id: true,
          skill: true,
          score: true,
          totalQuestions: true,
          passed: true,
          violations: true,
          timeExceeded: true,
          completedAt: true,
          candidate: { select: { fullName: true, userId: true } },
        },
        orderBy: [{ violations: 'desc' }, { completedAt: 'desc' }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.skillAssessment.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async listInterviews(params: { flaggedOnly?: boolean; page: number; pageSize: number }) {
    const where = {
      status: 'COMPLETED',
      ...(params.flaggedOnly ? { OR: [{ violations: { gt: 0 } }, { timeExceeded: true }] } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.mockInterview.findMany({
        where,
        select: {
          id: true,
          jobRole: true,
          overallRating: true,
          violations: true,
          timeExceeded: true,
          completedAt: true,
          candidate: { select: { fullName: true, userId: true } },
        },
        orderBy: [{ violations: 'desc' }, { completedAt: 'desc' }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.mockInterview.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async invalidateAssessment(actorId: string, assessmentId: string, ip?: string) {
    const assessment = await this.prisma.skillAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const updated = await this.prisma.skillAssessment.update({
      where: { id: assessmentId },
      data: { status: 'INVALIDATED', passed: false },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'ASSESSMENT_INVALIDATED',
      targetType: AuditTargetType.ASSESSMENT,
      targetId: assessmentId,
      metadata: { skill: assessment.skill, violations: assessment.violations },
      ipAddress: ip,
    });

    return updated;
  }

  async invalidateInterview(actorId: string, interviewId: string, ip?: string) {
    const interview = await this.prisma.mockInterview.findUnique({ where: { id: interviewId } });
    if (!interview) {
      throw new NotFoundException('Mock interview not found');
    }

    const updated = await this.prisma.mockInterview.update({
      where: { id: interviewId },
      data: { status: 'INVALIDATED' },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'MOCK_INTERVIEW_INVALIDATED',
      targetType: AuditTargetType.ASSESSMENT,
      targetId: interviewId,
      metadata: { jobRole: interview.jobRole, violations: interview.violations },
      ipAddress: ip,
    });

    return updated;
  }
}
