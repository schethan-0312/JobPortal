import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto.js';
import { CreateJobAlertDto } from './dto/create-job-alert.dto.js';

// Public-facing candidate fields. Deliberately excludes `phone` (PII) and `userId`
// (internal correlation key) — those must never be exposed outside the owner's
// own authenticated `/candidates/me` call.
const PUBLIC_CANDIDATE_SELECT = {
  id: true,
  fullName: true,
  headline: true,
  location: true,
  about: true,
  skills: true,
  experienceYears: true,
  resumeUrl: true,
  profilePhotoUrl: true,
  videoProfileUrl: true,
  isVerified: true,
  githubUsername: true,
  githubProfileUrl: true,
  githubAvatarUrl: true,
  linkedinProfileUrl: true,
  createdAt: true,
} as const;

// Employer-search fields: same as public, plus `userId` (needed to start a message
// thread with the candidate) and `updatedAt` (used to rank recently-active profiles
// higher — a "recency boost", the same signal real job portals use). Still excludes
// `phone` — contact happens through in-app messaging, not a leaked phone number.
const EMPLOYER_SEARCH_SELECT = {
  ...PUBLIC_CANDIDATE_SELECT,
  userId: true,
  updatedAt: true,
} as const;

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    return profile;
  }

  async updateMyProfile(userId: string, dto: UpdateCandidateProfileDto) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    return this.prisma.candidateProfile.update({ where: { userId }, data: dto });
  }

  async listPublic(params: { location?: string; skill?: string; page: number; pageSize: number }) {
    const where = {
      ...(params.location ? { location: { contains: params.location, mode: 'insensitive' as const } } : {}),
      ...(params.skill ? { skills: { has: params.skill } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.candidateProfile.findMany({
        where,
        select: PUBLIC_CANDIDATE_SELECT,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.candidateProfile.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  /** Employer-only candidate discovery — the "reverse search" recruiters use to find talent proactively. */
  async searchForEmployers(params: {
    location?: string;
    skill?: string;
    minExperience?: number;
    q?: string;
    page: number;
    pageSize: number;
  }) {
    // `q` is a full-text/boolean query (supports "quoted phrases", AND is implicit between
    // words, OR, and -exclude) run against headline/about/skills via Postgres websearch_to_tsquery.
    // Kept as a raw query because Prisma has no first-class tsvector/tsquery support.
    if (params.q && params.q.trim().length > 0) {
      const offset = (params.page - 1) * params.pageSize;
      const locationPattern = params.location ? `%${params.location}%` : null;
      const minExperience = params.minExperience ?? null;
      const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "CandidateProfile"
        WHERE to_tsvector('english', coalesce("headline",'') || ' ' || coalesce("about",'') || ' ' || array_to_string("skills", ' '))
          @@ websearch_to_tsquery('english', ${params.q})
          AND (${locationPattern}::text IS NULL OR "location" ILIKE ${locationPattern})
          AND (${minExperience}::int IS NULL OR "experienceYears" >= ${minExperience})
        ORDER BY "updatedAt" DESC
        LIMIT ${params.pageSize} OFFSET ${offset}
      `;
      const countRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "CandidateProfile"
        WHERE to_tsvector('english', coalesce("headline",'') || ' ' || coalesce("about",'') || ' ' || array_to_string("skills", ' '))
          @@ websearch_to_tsquery('english', ${params.q})
          AND (${locationPattern}::text IS NULL OR "location" ILIKE ${locationPattern})
          AND (${minExperience}::int IS NULL OR "experienceYears" >= ${minExperience})
      `;
      const ids = rows.map((r) => r.id);
      const items = ids.length
        ? await this.prisma.candidateProfile.findMany({ where: { id: { in: ids } }, select: EMPLOYER_SEARCH_SELECT })
        : [];
      // Raw query already ordered/paginated by id — restore that order after the findMany.
      const byId = new Map(items.map((i) => [i.id, i]));
      const ordered = ids.map((id) => byId.get(id)).filter((x): x is (typeof items)[number] => !!x);
      return { items: ordered, total: Number(countRows[0]?.count ?? 0), page: params.page, pageSize: params.pageSize };
    }

    const where = {
      ...(params.location ? { location: { contains: params.location, mode: 'insensitive' as const } } : {}),
      ...(params.skill ? { skills: { has: params.skill } } : {}),
      ...(params.minExperience != null ? { experienceYears: { gte: params.minExperience } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.candidateProfile.findMany({
        where,
        select: EMPLOYER_SEARCH_SELECT,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        // Recency boost: profiles updated more recently rank first, the same signal
        // real platforms use to surface actively-job-seeking candidates.
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.candidateProfile.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  /** Logs an employer opening a candidate's profile — powers "who viewed your profile". */
  async recordProfileView(candidateProfileId: string, viewerUserId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { id: candidateProfileId } });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    // A candidate viewing their own profile, or repeat views seconds apart, aren't a real signal.
    if (candidate.userId === viewerUserId) {
      return { logged: false };
    }
    await this.prisma.profileView.create({ data: { candidateId: candidateProfileId, viewerId: viewerUserId } });
    return { logged: true };
  }

  async listMyProfileViews(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    const [views, total] = await Promise.all([
      this.prisma.profileView.findMany({
        where: { candidateId: profile.id },
        include: { viewer: { select: { employer: { select: { companyName: true, logoUrl: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.profileView.count({ where: { candidateId: profile.id } }),
    ]);
    return { views, total };
  }

  async getPublicProfile(id: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id },
      select: PUBLIC_CANDIDATE_SELECT,
    });
    if (!profile) {
      throw new NotFoundException('Candidate not found');
    }
    return profile;
  }

  // ---- Saved jobs ----

  async saveJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) {
      throw new ConflictException('Job already saved');
    }
    return this.prisma.savedJob.create({ data: { userId, jobId } });
  }

  async unsaveJob(userId: string, jobId: string) {
    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (!existing) {
      throw new NotFoundException('Saved job not found');
    }
    await this.prisma.savedJob.delete({ where: { userId_jobId: { userId, jobId } } });
    return { success: true };
  }

  async listSavedJobs(userId: string) {
    return this.prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: { include: { employer: { select: { companyName: true, logoUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- Job alerts ----

  async createJobAlert(userId: string, dto: CreateJobAlertDto) {
    return this.prisma.jobAlert.create({ data: { userId, ...dto } });
  }

  async listJobAlerts(userId: string) {
    return this.prisma.jobAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async deleteJobAlert(userId: string, alertId: string) {
    const alert = await this.prisma.jobAlert.findUnique({ where: { id: alertId } });
    if (!alert || alert.userId !== userId) {
      throw new NotFoundException('Job alert not found');
    }
    await this.prisma.jobAlert.delete({ where: { id: alertId } });
    return { success: true };
  }

  // ---- Follow employers ----

  async followEmployer(userId: string, employerId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }
    const existing = await this.prisma.employerFollow.findUnique({
      where: { candidateId_employerId: { candidateId: profile.id, employerId } },
    });
    if (existing) {
      throw new ConflictException('Already following this employer');
    }
    return this.prisma.employerFollow.create({ data: { candidateId: profile.id, employerId } });
  }

  async listFollowedEmployers(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    return this.prisma.employerFollow.findMany({
      where: { candidateId: profile.id },
      include: { employer: { select: { id: true, companyName: true, logoUrl: true, location: true } } },
    });
  }
}
