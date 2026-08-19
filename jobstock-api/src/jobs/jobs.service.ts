import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmployersService } from '../employers/employers.service.js';
import { JobMatchingService } from '../job-matching/job-matching.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobStatusDto } from './dto/update-job-status.dto.js';
import { CreateJobAssessmentDto } from './dto/create-job-assessment.dto.js';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employersService: EmployersService,
    private readonly jobMatching: JobMatchingService,
  ) {}

  private slugify(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
  }

  async create(userId: string, dto: CreateJobDto) {
    const employer = await this.employersService.assertVerified(userId);

    if (dto.salaryMin != null && dto.salaryMax != null && dto.salaryMin > dto.salaryMax) {
      throw new ForbiddenException('salaryMin cannot be greater than salaryMax');
    }

    const job = await this.prisma.job.create({
      data: {
        employerId: employer.id,
        title: dto.title,
        slug: this.slugify(dto.title),
        description: dto.description,
        category: dto.category,
        location: dto.location,
        jobType: dto.jobType,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
      },
    });

    // Fire-and-forget: candidate matching/notifications must never slow down or
    // fail the job-posting request itself (errors are caught inside the service).
    void this.jobMatching.onJobPosted(job);

    return job;
  }

  async findAll(params: {
    category?: string;
    location?: string;
    search?: string;
    jobType?: string;
    page: number;
    pageSize: number;
  }) {
    const jobTypeMap: Record<string, string> = {
      'full-time': 'FULL_TIME',
      'full_time': 'FULL_TIME',
      'part-time': 'PART_TIME',
      'part_time': 'PART_TIME',
      contract: 'CONTRACT',
      freelance: 'FREELANCE',
      internship: 'INTERNSHIP',
    };

    let mappedJobType: string | undefined;
    if (params.jobType) {
      const normalized = params.jobType.toLowerCase().replace(/\s+/g, '_');
      mappedJobType =
        jobTypeMap[normalized] ||
        (['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'].includes(params.jobType.toUpperCase())
          ? params.jobType.toUpperCase()
          : undefined);
    }

    const where = {
      status: 'OPEN' as const,
      ...(params.category ? { category: { equals: params.category, mode: 'insensitive' as const } } : {}),
      ...(params.location ? { location: { contains: params.location, mode: 'insensitive' as const } } : {}),
      ...(mappedJobType
        ? { jobType: mappedJobType as never }
        : params.jobType?.toLowerCase() === 'remote'
          ? { location: { contains: 'remote', mode: 'insensitive' as const } }
          : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' as const } },
              { description: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: { employer: { select: { id: true, companyName: true, logoUrl: true, status: true } } },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async findBySlug(slug: string) {
    const job = await this.prisma.job.findUnique({
      where: { slug },
      include: { employer: { select: { id: true, companyName: true, logoUrl: true, description: true, status: true } } },
    });
    if (!job || job.status !== 'OPEN') {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async findMine(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    return this.prisma.job.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  async updateStatus(userId: string, jobId: string, dto: UpdateJobStatusDto) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) {
      throw new NotFoundException('Job not found');
    }
    return this.prisma.job.update({ where: { id: jobId }, data: { status: dto.status } });
  }

  async createAssessment(userId: string, jobId: string, dto: any) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) throw new NotFoundException('Employer profile not found');
    
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) throw new NotFoundException('Job not found');

    return this.prisma.jobAssessment.create({
      data: {
        jobId,
        title: dto.title,
        skills: dto.skills,
        questions: dto.questions as any,
        timeLimitMinutes: dto.timeLimitMinutes,
      },
    });
  }

  async getAssessmentsForJob(userId: string, jobId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) throw new NotFoundException('Employer profile not found');
    
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) throw new NotFoundException('Job not found');

    return this.prisma.jobAssessment.findMany({ 
      where: { jobId },
      orderBy: { createdAt: 'asc' }
    });
  }



  async getEmployerAssessments(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) throw new NotFoundException('Employer profile not found');

    return this.prisma.jobAssessment.findMany({
      where: {
        job: { employerId: employer.id }
      },
      include: {
        job: { select: { title: true } },
        _count: { select: { attempts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAssessmentSubmissions(userId: string, assessmentId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) throw new NotFoundException('Employer profile not found');

    const assessment = await this.prisma.jobAssessment.findUnique({
      where: { id: assessmentId },
      include: { job: true }
    });

    if (!assessment || assessment.job.employerId !== employer.id) {
      throw new NotFoundException('Assessment not found or access denied');
    }

    return this.prisma.jobAssessmentAttempt.findMany({
      where: { 
        assessmentId,
        status: 'COMPLETED' 
      },
      take: 10,
      include: {
        candidate: {
          include: { user: { select: { email: true } } }
        },
        assessment: { select: { title: true, questions: true } }
      },
      orderBy: [
        { score: 'desc' },
        { startedAt: 'desc' }
      ]
    });
  }

  // --- Candidate Assessment Methods ---

  async getMatchingAssessments(userId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    if (!candidate.skills || candidate.skills.length === 0) {
      return [];
    }

    const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase());

    // Fetch all open assessments since Prisma hasSome is case-sensitive for string arrays
    const allAssessments = await this.prisma.jobAssessment.findMany({
      where: {
        job: { status: 'OPEN' }
      },
      include: {
        job: {
          select: { title: true, slug: true, employer: { select: { companyName: true, logoUrl: true } } },
        },
        attempts: {
          where: { candidateId: candidate.id },
          select: { status: true, score: true },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    const assessments = allAssessments.filter(a => 
      a.skills.some(skill => candidateSkillsLower.includes(skill.toLowerCase()))
    );

    return assessments;
  }

  async getAssessmentDetailsForCandidate(userId: string, assessmentId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const assessment = await this.prisma.jobAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        job: { select: { title: true, employer: { select: { companyName: true } } } },
        _count: { select: { attempts: true } }
      }
    });

    if (!assessment) throw new NotFoundException('Assessment not found');

    // Remove the questions payload for security before they start
    const { questions, ...safeAssessment } = assessment as any;
    
    // Also fetch their attempt if it exists
    const attempt = await this.prisma.jobAssessmentAttempt.findFirst({
      where: { candidateId: candidate.id, assessmentId },
      orderBy: { startedAt: 'desc' }
    });

    return { ...safeAssessment, attempt };
  }

  async startAssessmentAttempt(userId: string, assessmentId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const assessment = await this.prisma.jobAssessment.findUnique({ 
      where: { id: assessmentId },
      include: { job: true }
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // Upsert an attempt so if they refresh, they get the same IN_PROGRESS attempt
    const attempt = await this.prisma.jobAssessmentAttempt.upsert({
      where: {
        assessmentId_candidateId: {
          assessmentId: assessment.id,
          candidateId: candidate.id,
        },
      },
      update: {}, // don't change anything if it exists
      create: {
        assessmentId: assessment.id,
        candidateId: candidate.id,
        status: 'IN_PROGRESS',
      },
    });

    if (attempt.status === 'COMPLETED') {
      throw new ForbiddenException('You have already completed this assessment');
    }

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      assessment,
    };
  }

  async submitAssessmentAttempt(userId: string, assessmentId: string, answers: any) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const assessment = await this.prisma.jobAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const attempt = await this.prisma.jobAssessmentAttempt.findUnique({
      where: {
        assessmentId_candidateId: {
          assessmentId: assessment.id,
          candidateId: candidate.id,
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'COMPLETED') throw new ForbiddenException('Assessment already completed');
    
    // Check if time expired
    if (assessment.timeLimitMinutes) {
      const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
      const timeLimitMs = assessment.timeLimitMinutes * 60000;
      // Provide a 5 second grace period
      if (elapsedMs > timeLimitMs + 5000) {
        // Technically, we can still accept whatever they managed to submit, or mark it as auto-submitted
      }
    }

    return this.prisma.jobAssessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        answers,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}
