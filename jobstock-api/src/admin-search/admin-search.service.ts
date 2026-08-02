import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../../generated/prisma/enums.js';

const RESULTS_PER_CATEGORY = 8;

export interface SearchResult {
  type: 'candidate' | 'employer' | 'job' | 'ticket' | 'transaction';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

@Injectable()
export class AdminSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string): Promise<SearchResult[]> {
    if (query.trim().length < 2) {
      return [];
    }
    const q = query.trim();

    const [candidates, employerUsers, jobs, tickets, orders] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: Role.CANDIDATE,
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { candidateProfile: { fullName: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: { id: true, email: true, candidateProfile: { select: { fullName: true } } },
        take: RESULTS_PER_CATEGORY,
      }),
      this.prisma.employer.findMany({
        where: {
          OR: [
            { companyName: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: { id: true, companyName: true, user: { select: { email: true } } },
        take: RESULTS_PER_CATEGORY,
      }),
      this.prisma.job.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        select: { id: true, title: true, employer: { select: { companyName: true } } },
        take: RESULTS_PER_CATEGORY,
      }),
      this.prisma.supportTicket.findMany({
        where: {
          OR: [{ subject: { contains: q, mode: 'insensitive' } }, { user: { email: { contains: q, mode: 'insensitive' } } }],
        },
        select: { id: true, subject: true, user: { select: { email: true } } },
        take: RESULTS_PER_CATEGORY,
      }),
      this.prisma.order.findMany({
        where: {
          OR: [
            { razorpayOrderId: { contains: q, mode: 'insensitive' } },
            { gatewayRef: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: { id: true, razorpayOrderId: true, amountInPaisa: true, user: { select: { email: true } } },
        take: RESULTS_PER_CATEGORY,
      }),
    ]);

    const results: SearchResult[] = [
      ...candidates.map((c) => ({
        type: 'candidate' as const,
        id: c.id,
        title: c.candidateProfile?.fullName ?? c.email,
        subtitle: c.email,
        href: `/admin-candidates/${c.id}`,
      })),
      ...employerUsers.map((e) => ({
        type: 'employer' as const,
        id: e.id,
        title: e.companyName,
        subtitle: e.user.email,
        href: `/admin-employer-directory/${e.id}`,
      })),
      ...jobs.map((j) => ({
        type: 'job' as const,
        id: j.id,
        title: j.title,
        subtitle: j.employer.companyName,
        href: `/admin-jobs/${j.id}`,
      })),
      ...tickets.map((t) => ({
        type: 'ticket' as const,
        id: t.id,
        title: t.subject,
        subtitle: t.user.email,
        href: `/admin-support/${t.id}`,
      })),
      ...orders.map((o) => ({
        type: 'transaction' as const,
        id: o.id,
        title: o.razorpayOrderId ?? o.id,
        subtitle: `${o.user.email} — ₹${(o.amountInPaisa / 100).toLocaleString('en-IN')}`,
        href: `/admin-financials`,
      })),
    ];

    return results;
  }
}
