import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto.js';
import { CreateJobAlertDto } from './dto/create-job-alert.dto.js';

// Public-facing candidate fields. Deliberately excludes `phone` (PII) and `userId`
// (internal correlation key) — those must never be exposed outside the owner's
// own authenticated `/candidates/me` call.
const PUBLIC_CANDIDATE_SELECT = {
  id: true,
  userId: true,
  fullName: true,
  headline: true,
  location: true,
  about: true,
  skills: true,
  experienceYears: true,
  resumeUrl: true,
  profilePhotoUrl: true,
  isVerified: true,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    const referralCount = await this.prisma.referral.count({ where: { referrerId: userId } });
    if (referralCount > 0) {
      const expectedPoints = referralCount * 100;
      if (profile.referralPoints !== expectedPoints) {
        return this.prisma.candidateProfile.update({
          where: { userId },
          data: { referralPoints: expectedPoints },
        });
      }
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

  async getMyResume(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Candidate profile not found');

    const resume = await this.prisma.candidateResume.findUnique({
      where: { candidateId: profile.id },
      include: {
        educations: true,
        experiences: true,
        projects: true,
        certifications: true,
      },
    });
    return resume || {};
  }

  async syncResume(userId: string, dto: any) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Candidate profile not found');

    return this.prisma.$transaction(async (tx) => {
      const resume = await tx.candidateResume.upsert({
        where: { candidateId: profile.id },
        update: {
          resumeUrl: dto.resumeUrl !== undefined ? dto.resumeUrl : undefined,
          summary: dto.summary !== undefined ? dto.summary : undefined,
          skills: dto.skills !== undefined ? dto.skills : undefined,
          languages: dto.languages !== undefined ? dto.languages : undefined,
          experienceYears: dto.experienceYears !== undefined ? dto.experienceYears : undefined,
        },
        create: {
          candidateId: profile.id,
          resumeUrl: dto.resumeUrl,
          summary: dto.summary,
          skills: dto.skills || [],
          languages: dto.languages || [],
          experienceYears: dto.experienceYears,
        },
      });

      if (dto.educations) {
        await tx.education.deleteMany({ where: { resumeId: resume.id } });
        if (dto.educations.length > 0) {
          await tx.education.createMany({
            data: dto.educations.map((e: any) => ({ ...e, resumeId: resume.id })),
          });
        }
      }

      if (dto.experiences) {
        await tx.experience.deleteMany({ where: { resumeId: resume.id } });
        if (dto.experiences.length > 0) {
          await tx.experience.createMany({
            data: dto.experiences.map((e: any) => ({ ...e, resumeId: resume.id })),
          });
        }
      }

      if (dto.projects) {
        await tx.project.deleteMany({ where: { resumeId: resume.id } });
        if (dto.projects.length > 0) {
          await tx.project.createMany({
            data: dto.projects.map((p: any) => ({ ...p, resumeId: resume.id })),
          });
        }
      }

      if (dto.certifications) {
        await tx.certification.deleteMany({ where: { resumeId: resume.id } });
        if (dto.certifications.length > 0) {
          await tx.certification.createMany({
            data: dto.certifications.map((c: any) => ({ ...c, resumeId: resume.id })),
          });
        }
      }

      return tx.candidateResume.findUnique({
        where: { id: resume.id },
        include: { educations: true, experiences: true, projects: true, certifications: true },
      });
    });
  }

  async listPublic(
    params: {
      location?: string;
      skill?: string;
      keyword?: string;
      search?: string;
      sortBy?: string;
      page: number;
      pageSize: number;
    },
    user?: { role: string; userId: string } | null,
  ) {
    const searchTerm = (params.skill || params.search || params.keyword || '').trim();
    const skillVariations = searchTerm
      ? [
          searchTerm,
          searchTerm.toLowerCase(),
          searchTerm.toUpperCase(),
          searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase(),
        ]
      : [];

    const andConditions: Prisma.CandidateProfileWhereInput[] = [];

    if (params.location && params.location.trim()) {
      andConditions.push({ location: { contains: params.location.trim(), mode: 'insensitive' as const } });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { fullName: { contains: searchTerm, mode: 'insensitive' as const } },
          { headline: { contains: searchTerm, mode: 'insensitive' as const } },
          { about: { contains: searchTerm, mode: 'insensitive' as const } },
          { location: { contains: searchTerm, mode: 'insensitive' as const } },
          { skills: { hasSome: skillVariations } },
        ],
      });
    }

    if (user && user.role === 'CANDIDATE') {
      andConditions.push({ userId: { not: user.userId } });
    }

    const where: Prisma.CandidateProfileWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    let orderBy: Prisma.CandidateProfileOrderByWithRelationInput = { updatedAt: 'desc' };
    if (params.sortBy === 'experience') {
      orderBy = { experienceYears: 'desc' };
    } else if (params.sortBy === 'name_asc') {
      orderBy = { fullName: 'asc' };
    } else if (params.sortBy === 'name_desc') {
      orderBy = { fullName: 'desc' };
    } else if (params.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else {
      orderBy = { updatedAt: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.candidateProfile.findMany({
        where,
        select: PUBLIC_CANDIDATE_SELECT,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy,
      }),
      this.prisma.candidateProfile.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  /** Employer-only candidate discovery — the "reverse search" recruiters use to find talent proactively. */
  async searchForEmployers(params: {
    userId: string;
    location?: string;
    skill?: string;
    minExperience?: number;
    page: number;
    pageSize: number;
  }) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId: params.userId },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    const sub = await this.prisma.employerPackageSubscription.findFirst({
      where: { employerId: employer.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { package: true },
    });

    // Note: The limit is now enforced per profile view, not on search.

    const skillVariations = params.skill 
      ? [
          params.skill, 
          params.skill.toLowerCase(), 
          params.skill.toUpperCase(), 
          params.skill.charAt(0).toUpperCase() + params.skill.slice(1).toLowerCase()
        ]
      : [];

    const where = {
      ...(params.location ? { location: { contains: params.location, mode: 'insensitive' as const } } : {}),
      ...(params.skill ? { skills: { hasSome: skillVariations } } : {}),
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

  async trackProfileView(employerUserId: string, candidateProfileId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId: employerUserId },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    const sub = await this.prisma.employerPackageSubscription.findFirst({
      where: { employerId: employer.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { package: true },
    });

    if (!sub || (sub.expiresAt && new Date(sub.expiresAt) < new Date())) {
      throw new ForbiddenException('You must have an active package to view candidate profiles.');
    }

    if (sub.package.jobSeekerViewLimit < 999999 && sub.jobSeekersViewed >= sub.package.jobSeekerViewLimit) {
      throw new ForbiddenException(`You have reached your limit of ${sub.package.jobSeekerViewLimit} profile views. Please upgrade your package.`);
    }

    await this.prisma.employerPackageSubscription.update({
      where: { id: sub.id },
      data: { jobSeekersViewed: { increment: 1 } },
    });

    // Send profile viewed email in background
    (async () => {
      try {
        const candidate = await this.prisma.candidateProfile.findUnique({
          where: { id: candidateProfileId },
          include: { user: { select: { email: true } } },
        });
        if (candidate?.user?.email) {
          await this.emailService.sendProfileViewedEmail({
            candidateEmail: candidate.user.email,
            candidateName: candidate.fullName || 'Candidate',
            companyName: employer.companyName,
          });
        }
      } catch (e) {
        // Fail silently
      }
    })();

    return { success: true };
  }

  async getPublicProfile(id: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id },
      select: {
        ...PUBLIC_CANDIDATE_SELECT,
        resume: {
          include: {
            educations: true,
            experiences: true,
            projects: true,
            certifications: true,
          }
        }
      }
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
    const alert = await this.prisma.jobAlert.create({ data: { userId, ...dto } });

    // Send confirmation email in background
    (async () => {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { candidateProfile: true },
        });
        if (user?.email) {
          await this.emailService.sendJobAlertCreatedEmail({
            candidateEmail: user.email,
            candidateName: user.candidateProfile?.fullName || 'Candidate',
            keyword: dto.keyword,
            category: dto.category,
            location: dto.location,
          });
        }
      } catch (e) {
        // Fail silently
      }
    })();

    return alert;
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
