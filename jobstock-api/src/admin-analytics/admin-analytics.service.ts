import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface DailyRow {
  day: Date;
  count: bigint;
}

interface DailySumRow {
  day: Date;
  total: bigint;
}

function buildDailySeries(rows: DailyRow[], days: number): { date: string; count: number }[] {
  const now = new Date();
  const series: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    const row = rows.find((r) => r.day.toISOString().slice(0, 10) === dateKey);
    series.push({ date: dateKey, count: Number(row?.count ?? 0) });
  }
  return series;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalSignups,
      totalJobs,
      totalApplications,
      revenueAgg,
      signupRows,
      jobRows,
      applicationRows,
      revenueRows,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: since }, role: { in: ['CANDIDATE', 'EMPLOYER'] } } }),
      this.prisma.job.count({ where: { createdAt: { gte: since } } }),
      this.prisma.application.count({ where: { appliedAt: { gte: since } } }),
      this.prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: since } }, _sum: { amountInPaisa: true } }),
      this.prisma.$queryRaw<DailyRow[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "User" WHERE "createdAt" >= ${since} AND role IN ('CANDIDATE', 'EMPLOYER')
        GROUP BY day ORDER BY day ASC
      `,
      this.prisma.$queryRaw<DailyRow[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "Job" WHERE "createdAt" >= ${since}
        GROUP BY day ORDER BY day ASC
      `,
      this.prisma.$queryRaw<DailyRow[]>`
        SELECT DATE_TRUNC('day', "appliedAt") AS day, COUNT(*)::bigint AS count
        FROM "Application" WHERE "appliedAt" >= ${since}
        GROUP BY day ORDER BY day ASC
      `,
      this.prisma.$queryRaw<DailySumRow[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COALESCE(SUM("amountInPaisa"), 0)::bigint AS total
        FROM "Order" WHERE "createdAt" >= ${since} AND status = 'PAID'
        GROUP BY day ORDER BY day ASC
      `,
    ]);

    return {
      windowDays: days,
      totalSignups,
      totalJobs,
      totalApplications,
      totalRevenuePaisa: revenueAgg._sum.amountInPaisa ?? 0,
      signupTrend: buildDailySeries(signupRows, days),
      jobTrend: buildDailySeries(jobRows, days),
      applicationTrend: buildDailySeries(applicationRows, days),
      revenueTrend: buildDailySeries(
        revenueRows.map((r) => ({ day: r.day, count: r.total })),
        days,
      ),
    };
  }

  async breakdowns() {
    const [jobsByCategory, applicationsByStatus, candidatesByLocation] = await Promise.all([
      this.prisma.job.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { _count: { category: 'desc' } }, take: 10 }),
      this.prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.candidateProfile.groupBy({
        by: ['location'],
        where: { location: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { location: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      jobsByCategory: jobsByCategory.map((r) => ({ category: r.category, count: r._count._all })),
      applicationsByStatus: applicationsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      candidatesByLocation: candidatesByLocation.map((r) => ({ location: r.location, count: r._count._all })),
    };
  }

  async exportCsv(report: string, days: number): Promise<{ filename: string; csv: string }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (report === 'signups') {
      const rows = await this.prisma.user.findMany({
        where: { createdAt: { gte: since }, role: { in: ['CANDIDATE', 'EMPLOYER'] } },
        select: { email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const csv = ['email,role,createdAt', ...rows.map((r) => `${r.email},${r.role},${r.createdAt.toISOString()}`)].join('\n');
      return { filename: `signups-${days}d.csv`, csv };
    }

    if (report === 'jobs') {
      const rows = await this.prisma.job.findMany({
        where: { createdAt: { gte: since } },
        select: { title: true, category: true, location: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const csv = [
        'title,category,location,status,createdAt',
        ...rows.map((r) => `"${r.title.replace(/"/g, '""')}",${r.category},"${r.location}",${r.status},${r.createdAt.toISOString()}`),
      ].join('\n');
      return { filename: `jobs-${days}d.csv`, csv };
    }

    if (report === 'revenue') {
      const rows = await this.prisma.order.findMany({
        where: { createdAt: { gte: since }, status: 'PAID' },
        select: { amountInPaisa: true, createdAt: true, user: { select: { email: true } }, package: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const csv = [
        'email,package,amountInPaisa,createdAt',
        ...rows.map((r) => `${r.user.email},${r.package.name},${r.amountInPaisa},${r.createdAt.toISOString()}`),
      ].join('\n');
      return { filename: `revenue-${days}d.csv`, csv };
    }

    throw new BadRequestException('Unknown report type. Use signups, jobs, or revenue.');
  }
}
