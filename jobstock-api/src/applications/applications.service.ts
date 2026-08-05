import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ZipArchive } from 'archiver';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async apply(candidateUserId: string, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
    if (!job || job.status !== 'OPEN') {
      throw new NotFoundException('Job not found or no longer accepting applications');
    }

    const existing = await this.prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: dto.jobId, candidateId: candidateUserId } },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    return this.prisma.application.create({
      data: {
        jobId: dto.jobId,
        candidateId: candidateUserId,
        coverNote: dto.coverNote,
      },
    });
  }

  /**
   * Applies to multiple jobs in one call (the "Apply to all strong matches" flow).
   * Skips jobs already applied to or closed rather than failing the whole batch —
   * a candidate should never lose progress on 9 valid applications because 1 job
   * closed a minute ago.
   */
  async bulkApply(candidateUserId: string, jobIds: string[]) {
    const uniqueJobIds = [...new Set(jobIds)];
    const jobs = await this.prisma.job.findMany({ where: { id: { in: uniqueJobIds }, status: 'OPEN' } });
    const existing = await this.prisma.application.findMany({
      where: { candidateId: candidateUserId, jobId: { in: uniqueJobIds } },
      select: { jobId: true },
    });
    const alreadyApplied = new Set(existing.map((a) => a.jobId));

    const toApply = jobs.filter((j) => !alreadyApplied.has(j.id));
    const skipped = uniqueJobIds.filter((id) => !toApply.some((j) => j.id === id));

    if (toApply.length > 0) {
      await this.prisma.application.createMany({
        data: toApply.map((j) => ({ jobId: j.id, candidateId: candidateUserId })),
        skipDuplicates: true,
      });
    }

    return {
      appliedCount: toApply.length,
      appliedJobIds: toApply.map((j) => j.id),
      skippedCount: skipped.length,
      skippedJobIds: skipped,
    };
  }

  async listMine(candidateUserId: string) {
    return this.prisma.application.findMany({
      where: { candidateId: candidateUserId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            employer: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async listForJob(employerUserId: string, jobId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerUserId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            candidateProfile: {
              select: {
                fullName: true,
                headline: true,
                resumeUrl: true,
                skills: true,
                location: true,
                isVerified: true,
                profilePhotoUrl: true,
                githubUsername: true,
                githubProfileUrl: true,
                githubAvatarUrl: true,
                experienceYears: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  /**
   * Streams a zip of resumes for the given applications, scoped to a single job the
   * requesting employer owns. Only files that actually exist on disk (a resume is
   * optional) are included — a missing file is skipped, not a hard failure.
   */
  async streamResumesZip(employerUserId: string, jobId: string, applicationIds: string[], res: Response) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerUserId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) {
      throw new NotFoundException('Job not found');
    }

    const applications = await this.prisma.application.findMany({
      where: {
        jobId,
        ...(applicationIds.length > 0 ? { id: { in: applicationIds } } : {}),
      },
      include: { candidate: { select: { candidateProfile: { select: { fullName: true, resumeUrl: true } } } } },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${job.slug}-resumes.zip"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.pipe(res);

    let seq = 1;
    for (const app of applications) {
      const resumeUrl = app.candidate.candidateProfile?.resumeUrl;
      if (!resumeUrl || !resumeUrl.startsWith('/uploads/')) continue;
      const filePath = path.join(UPLOAD_DIR, path.basename(resumeUrl));
      if (!fs.existsSync(filePath)) continue;
      const safeName = (app.candidate.candidateProfile?.fullName ?? `candidate-${seq}`).replace(/[^a-z0-9\- ]/gi, '');
      archive.file(filePath, { name: `${safeName || `candidate-${seq}`}${path.extname(filePath)}` });
      seq++;
    }

    await archive.finalize();
  }

  async updateStatus(employerUserId: string, applicationId: string, dto: UpdateApplicationStatusDto) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerUserId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.job.employerId !== employer.id) {
      throw new ForbiddenException('This application does not belong to one of your job postings');
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: dto.status },
    });

    await this.notifications.create(
      application.candidateId,
      'Application status updated',
      `Your application for "${application.job.title}" is now ${dto.status}`,
    );

    return updated;
  }

  async withdraw(candidateUserId: string, applicationId: string) {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application || application.candidateId !== candidateUserId) {
      throw new NotFoundException('Application not found');
    }
    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' },
    });
  }
}
