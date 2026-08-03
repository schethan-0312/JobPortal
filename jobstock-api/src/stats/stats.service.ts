import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStats() {
    const [
      totalJobs,
      totalCandidates,
      totalVerifiedEmployers,
      totalEmployers,
      totalApplications,
      salaryAgg,
    ] = await Promise.all([
      this.prisma.job.count({ where: { status: 'OPEN' } }),
      this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
      this.prisma.employer.count({ where: { status: 'VERIFIED' } }),
      this.prisma.employer.count(),
      this.prisma.application.count(),
      this.prisma.job.aggregate({
        where: { status: 'OPEN', salaryVisible: true },
        _min: { salaryMin: true },
        _max: { salaryMax: true },
      }),
    ]);

    const verifiedEmployerPct = totalEmployers > 0 ? Math.round((totalVerifiedEmployers / totalEmployers) * 100) : 0;

    return {
      totalJobs,
      totalCandidates,
      totalVerifiedEmployers,
      totalApplications,
      verifiedEmployerPct,
      salaryFloor: salaryAgg._min.salaryMin ?? null,
      salaryCeiling: salaryAgg._max.salaryMax ?? null,
    };
  }
}
