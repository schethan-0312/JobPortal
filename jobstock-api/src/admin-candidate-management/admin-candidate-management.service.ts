import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditTargetType, Role } from '../../generated/prisma/enums.js';
import { SuspendUserDto } from './dto/suspend-user.dto.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AdminCandidateManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  async list(params: { search?: string; suspended?: boolean; page: number; pageSize: number }) {
    const where = {
      role: Role.CANDIDATE,
      ...(params.suspended !== undefined ? { isSuspended: params.suspended } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' as const } },
              { candidateProfile: { fullName: { contains: params.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          isSuspended: true,
          createdAt: true,
          candidateProfile: {
            select: {
              fullName: true,
              headline: true,
              location: true,
              isVerified: true,
              _count: { select: { skillAssessments: true, mockInterviews: true } },
            },
          },
          _count: { select: { applications: true } },
          orders: {
            where: { status: 'PAID', package: { audience: 'RESUME' } },
            include: { package: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        isSuspended: u.isSuspended,
        createdAt: u.createdAt,
        fullName: u.candidateProfile?.fullName ?? '—',
        headline: u.candidateProfile?.headline ?? null,
        location: u.candidateProfile?.location ?? null,
        isVerified: u.candidateProfile?.isVerified ?? false,
        applicationsCount: u._count.applications,
        assessmentsCount: u.candidateProfile?._count.skillAssessments ?? 0,
        interviewsCount: u.candidateProfile?._count.mockInterviews ?? 0,
        activeResumePackage: u.orders && u.orders.length > 0 ? u.orders[0].package.name : null,
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: {
          include: {
            skillAssessments: { orderBy: { createdAt: 'desc' }, take: 10 },
            mockInterviews: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
        applications: {
          include: { job: { select: { title: true } } },
          orderBy: { appliedAt: 'desc' },
          take: 20,
        },
        loginEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!user || user.role !== Role.CANDIDATE) {
      throw new NotFoundException('Candidate not found');
    }
    const { passwordHash, ...safeUser } = user;
    void passwordHash;
    return safeUser;
  }

  async suspend(actorId: string, userId: string, dto: SuspendUserDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { candidateProfile: true }
    });
    if (!user || user.role !== Role.CANDIDATE) {
      throw new NotFoundException('Candidate not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true, suspendedReason: dto.reason, sessionRevokedAt: new Date() },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'CANDIDATE_SUSPENDED',
      targetType: AuditTargetType.USER,
      targetId: userId,
      reason: dto.reason,
      ipAddress: ip,
    });

    try {
      await this.emailService.sendCandidateSuspended(user.email, user.candidateProfile?.fullName || 'Candidate', dto.reason);
    } catch (error) {
      console.error('Failed to send suspension email to candidate:', error);
    }

    return { success: true };
  }

  async unsuspend(actorId: string, userId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { candidateProfile: true }
    });
    if (!user || user.role !== Role.CANDIDATE) {
      throw new NotFoundException('Candidate not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspendedReason: null },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'CANDIDATE_UNSUSPENDED',
      targetType: AuditTargetType.USER,
      targetId: userId,
      ipAddress: ip,
    });

    try {
      await this.emailService.sendCandidateReopened(user.email, user.candidateProfile?.fullName || 'Candidate');
    } catch (error) {
      console.error('Failed to send reopened email to candidate:', error);
    }

    return { success: true };
  }

  async toggleVerified(actorId: string, userId: string, ip?: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    const updated = await this.prisma.candidateProfile.update({
      where: { userId },
      data: { isVerified: !profile.isVerified },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: updated.isVerified ? 'CANDIDATE_VERIFIED' : 'CANDIDATE_UNVERIFIED',
      targetType: AuditTargetType.USER,
      targetId: userId,
      ipAddress: ip,
    });

    return { isVerified: updated.isVerified };
  }
}
