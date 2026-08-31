import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { EmailService } from '../email/email.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async apply(candidateUserId: string, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        employer: {
          select: { companyName: true },
        },
      },
    });
    if (!job || job.status !== 'OPEN') {
      throw new NotFoundException('Job not found or no longer accepting applications');
    }

    const existing = await this.prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: dto.jobId, candidateId: candidateUserId } },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    const application = await this.prisma.application.create({
      data: {
        jobId: dto.jobId,
        candidateId: candidateUserId,
        coverNote: dto.coverNote,
      },
    });

    // Send confirmation email to candidate in background safely
    (async () => {
      try {
        const candidateUser = await this.prisma.user.findUnique({
          where: { id: candidateUserId },
          include: { candidateProfile: true },
        });

        if (candidateUser) {
          let salaryText: string | undefined;
          if (job.salaryMin && job.salaryMax) {
            salaryText = `${job.currency || '₹'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}${job.salaryPeriod ? ` / ${job.salaryPeriod.toLowerCase()}` : ''}`;
          } else if (job.salaryMin) {
            salaryText = `From ${job.currency || '₹'} ${job.salaryMin.toLocaleString()}${job.salaryPeriod ? ` / ${job.salaryPeriod.toLowerCase()}` : ''}`;
          } else if (job.salaryMax) {
            salaryText = `Up to ${job.currency || '₹'} ${job.salaryMax.toLocaleString()}${job.salaryPeriod ? ` / ${job.salaryPeriod.toLowerCase()}` : ''}`;
          }

          await this.emailService.sendApplicationSubmittedEmail({
            candidateEmail: candidateUser.email,
            candidateName: candidateUser.candidateProfile?.fullName || 'Candidate',
            jobTitle: job.title,
            companyName: job.employer.companyName,
            location: job.location,
            jobType: job.jobType,
            category: job.category,
            workMode: job.workMode,
            salaryText,
            jobSlug: job.slug,
            jobId: job.id,
            applicationId: application.id,
            appliedAt: application.appliedAt,
          });
        }
      } catch (e) {
        // Fail silently so apply operation is never disrupted
      }
    })();

    return application;
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

    const sub = await this.prisma.employerPackageSubscription.findFirst({
      where: { employerId: employer.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { package: true },
    });

    if (!sub || (sub.expiresAt && new Date(sub.expiresAt) < new Date())) {
      throw new ForbiddenException('You must have an active package to view applicants.');
    }

    // Note: The limit is now enforced per profile view, not on list.

    const applications = await this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
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
                jobAssessmentAttempts: {
                  where: {
                    assessment: { jobId },
                    status: 'COMPLETED'
                  },
                  include: {
                    assessment: true
                  }
                }
              },
            },
          },
        },
      },
    });

    // Rank applicants by their total job assessment score
    const rankedApplications = applications.sort((a, b) => {
      const scoreA = a.candidate.candidateProfile?.jobAssessmentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) || 0;
      const scoreB = b.candidate.candidateProfile?.jobAssessmentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) || 0;
      
      // Secondary sort by appliedAt if scores are equal
      if (scoreA === scoreB) {
        return b.appliedAt.getTime() - a.appliedAt.getTime();
      }
      return scoreB - scoreA;
    });

    return rankedApplications;
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

    if (application.status === 'APPLIED' && dto.status !== 'APPLIED') {
      const activeSub = await this.prisma.employerPackageSubscription.findFirst({
        where: { employerId: employer.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: { package: true }
      });
      if (!activeSub || (activeSub.expiresAt && new Date(activeSub.expiresAt) < new Date())) {
        throw new ForbiddenException('You must have an active package to view or manage applicants.');
      }
      if (activeSub.package.applicantViewLimit < 999999 && activeSub.applicantsViewed >= activeSub.package.applicantViewLimit) {
        throw new ForbiddenException(`You have reached your limit of ${activeSub.package.applicantViewLimit} applicants viewed. Please upgrade your package.`);
      }
      await this.prisma.employerPackageSubscription.update({
        where: { id: activeSub.id },
        data: { applicantsViewed: { increment: 1 } },
      });
    }

    if (dto.status === 'OFFERED' && application.status !== 'OFFERED') {
      const hiredCount = await this.prisma.application.count({
        where: {
          status: 'OFFERED',
          job: { employerId: employer.id },
        },
      });

      if (hiredCount >= 20) {
        const activeSub = await this.prisma.employerPackageSubscription.findFirst({
          where: { employerId: employer.id, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' }
        });

        const isSubActive = activeSub && (!activeSub.expiresAt || new Date(activeSub.expiresAt) > new Date());
        if (!isSubActive) {
          throw new ForbiddenException(
            'Subscription required: You have reached the limit of 20 hired candidates. Please upgrade your package to hire more candidates.',
          );
        }
      }
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

    // Send email in background
    (async () => {
      try {
        const candidateUser = await this.prisma.user.findUnique({
          where: { id: application.candidateId },
          include: { candidateProfile: true },
        });
        if (candidateUser) {
          await this.emailService.sendApplicationStatusUpdateEmail({
            candidateEmail: candidateUser.email,
            candidateName: candidateUser.candidateProfile?.fullName || 'Candidate',
            jobTitle: application.job.title,
            companyName: employer.companyName,
            newStatus: dto.status,
          });
        }
      } catch (e) {
        // Fail silently
      }
    })();

    return updated;
  }

  async withdraw(candidateUserId: string, applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            employer: { select: { companyName: true } },
          },
        },
      },
    });
    if (!application || application.candidateId !== candidateUserId) {
      throw new NotFoundException('Application not found');
    }
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' },
    });

    // Send email in background
    (async () => {
      try {
        const candidateUser = await this.prisma.user.findUnique({
          where: { id: candidateUserId },
          include: { candidateProfile: true },
        });
        if (candidateUser) {
          await this.emailService.sendApplicationWithdrawnEmail({
            candidateEmail: candidateUser.email,
            candidateName: candidateUser.candidateProfile?.fullName || 'Candidate',
            jobTitle: application.job.title,
            companyName: application.job.employer.companyName,
          });
        }
      } catch (e) {
        // Fail silently
      }
    })();

    return updated;
  }

  async deleteApplication(employerUserId: string, applicationId: string) {
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

    return this.prisma.application.delete({
      where: { id: applicationId },
    });
  }
}
