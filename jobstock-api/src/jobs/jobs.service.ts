import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmployersService } from '../employers/employers.service.js';
import { JobMatchingService } from '../job-matching/job-matching.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobStatusDto } from './dto/update-job-status.dto.js';

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
}
