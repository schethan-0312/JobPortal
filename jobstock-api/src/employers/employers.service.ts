import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateEmployerDto } from './dto/update-employer.dto.js';

// Public-facing employer fields. Excludes `userId` (internal correlation key) and
// `verifiedById` (an internal admin user id with no business reason to be public).
const PUBLIC_EMPLOYER_SELECT = {
  id: true,
  companyName: true,
  logoUrl: true,
  description: true,
  website: true,
  location: true,
  industry: true,
  cultureBlurb: true,
  photos: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class EmployersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    return employer;
  }

  async updateMyProfile(userId: string, dto: UpdateEmployerDto) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    const submittedNewDocument = Boolean(dto.gstCertificateUrl || dto.incorporationCertUrl || dto.signatoryIdUrl);
    return this.prisma.employer.update({
      where: { userId },
      data: { ...dto, ...(submittedNewDocument ? { documentsSubmittedAt: new Date() } : {}) },
    });
  }

  async listVerified(params: { location?: string; search?: string; page: number; pageSize: number }) {
    const where = {
      status: 'VERIFIED' as const,
      ...(params.location ? { location: { contains: params.location, mode: 'insensitive' as const } } : {}),
      ...(params.search ? { companyName: { contains: params.search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.employer.findMany({
        where,
        select: PUBLIC_EMPLOYER_SELECT,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employer.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async getPublicProfile(id: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id },
      select: PUBLIC_EMPLOYER_SELECT,
    });
    if (!employer || employer.status !== 'VERIFIED') {
      throw new NotFoundException('Employer not found');
    }
    return employer;
  }

  /** Guard used by JobsService before allowing a job post */
  async assertVerified(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    if (employer.status !== 'VERIFIED') {
      throw new ForbiddenException(
        'Your company must be verified by an admin before you can post jobs',
      );
    }
    return employer;
  }
}
