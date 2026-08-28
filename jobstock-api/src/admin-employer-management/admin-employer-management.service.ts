import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminEmployerManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { status?: string; search?: string; page: number; pageSize: number }) {
    const where = {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.search ? { companyName: { contains: params.search, mode: 'insensitive' as const } } : {}),
    };

    const [employers, total] = await Promise.all([
      this.prisma.employer.findMany({
        where,
        include: {
          user: { select: { email: true, createdAt: true } },
          subscriptions: { where: { status: 'ACTIVE' }, include: { package: { select: { name: true } } } },
          _count: { select: { jobs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.employer.count({ where }),
    ]);

    // Total spend per employer — Order.userId points at the employer's User, not
    // the Employer record, so this needs a second query joined by userId.
    const userIds = employers.map((e) => e.userId);
    const spendByUser = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: 'PAID' },
      _sum: { amountInPaisa: true },
    });
    const spendMap = new Map(spendByUser.map((s) => [s.userId, s._sum.amountInPaisa ?? 0]));

    const items = employers.map((e) => ({
      id: e.id,
      companyName: e.companyName,
      status: e.status,
      email: e.user.email,
      signupDate: e.user.createdAt,
      jobsPostedCount: e._count.jobs,
      activeSubscription: e.subscriptions?.[0]?.package?.name ?? null,
      totalSpendPaisa: spendMap.get(e.userId) ?? 0,
    }));

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async getDetail(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        user: { select: { id: true, email: true, createdAt: true } },
        jobs: { orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true, createdAt: true } },
        subscriptions: { where: { status: 'ACTIVE' }, include: { package: true } },
        verificationHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const [payments, hires, messages] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: employer.userId },
        include: { package: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({
        where: { job: { employerId }, status: 'OFFERED' },
      }),
      this.prisma.message.count({
        where: { OR: [{ senderId: employer.userId }, { receiverId: employer.userId }] },
      }),
    ]);

    return { ...employer, payments, hiresCount: hires, messageCount: messages };
  }
}
