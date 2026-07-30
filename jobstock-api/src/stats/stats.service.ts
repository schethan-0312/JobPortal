import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStats() {
    const [totalJobs, totalCandidates, totalVerifiedEmployers, totalApplications] = await Promise.all([
      this.prisma.job.count({ where: { status: 'OPEN' } }),
      this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
      this.prisma.employer.count({ where: { status: 'VERIFIED' } }),
      this.prisma.application.count(),
    ]);

    return { totalJobs, totalCandidates, totalVerifiedEmployers, totalApplications };
  }
}
