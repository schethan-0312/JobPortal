import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}

  async fileReport(reporterId: string, dto: CreateReportDto) {
    const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const report = await this.prisma.report.create({
      data: {
        targetType: 'JOB',
        jobId: dto.jobId,
        reportedEmployerId: job.employerId,
        reporterId,
        reason: dto.reason,
      },
    });
  }

  listMine(reporterId: string) {
    return this.prisma.report.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
