import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  leaderboard(limit = 10) {
    return this.prisma.candidateProfile.findMany({
      where: { referralPoints: { gt: 0 } },
      orderBy: { referralPoints: 'desc' },
      take: Math.min(50, Math.max(1, limit)),
      select: { id: true, fullName: true, referralPoints: true },
    });
  }

  async myReferrals(userId: string) {
    const [referrals, profile] = await Promise.all([
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: { referred: { select: { email: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.candidateProfile.findUnique({ where: { userId }, select: { referralPoints: true } }),
    ]);
    const totalPoints = referrals.length > 0 ? referrals.length * 100 : (profile?.referralPoints ?? 0);
    return { referrals, totalPoints };
  }
}
