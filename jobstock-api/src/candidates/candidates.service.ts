import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
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
  constructor(private readonly prisma: PrismaService) {}

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
    params: { location?: string; skill?: string; page: number; pageSize: number },
    user?: { role: string; userId: string } | null,
  ) {
    const where: Prisma.CandidateProfileWhereInput = {
      ...(params.location ? { location: { contains: params.location, mode: 'insensitive' as const } } : {}),
      ...(params.skill ? { skills: { has: params.skill } } : {}),
    };

    if (user && user.role === 'CANDIDATE') {
      where.userId = { not: user.userId };
    }

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
    page: number;
    pageSize: number;
  }) {
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
