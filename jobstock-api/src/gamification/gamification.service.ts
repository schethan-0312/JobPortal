import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

const PROFILE_FIELDS_FOR_COMPLETION = [
  'headline',
  'location',
  'phone',
  'about',
  'experienceYears',
  'resumeUrl',
  'profilePhotoUrl',
] as const;

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProgress(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    const filledCount = PROFILE_FIELDS_FOR_COMPLETION.filter((field) => {
      const value = profile[field as keyof typeof profile];
      if (Array.isArray(value)) return value.length > 0;
      return value != null && value !== '';
    }).length;
    const hasSkills = profile.skills.length > 0;
    const totalFields = PROFILE_FIELDS_FOR_COMPLETION.length + 1; // +1 for skills
    const profileCompletionPercent = Math.round(((filledCount + (hasSkills ? 1 : 0)) / totalFields) * 100);

    const [applicationCount, passedAssessmentCount, completedInterviewCount] = await Promise.all([
      this.prisma.application.count({ where: { candidateId: userId } }),
      this.prisma.skillAssessment.count({ where: { candidateId: profile.id, passed: true } }),
      this.prisma.mockInterview.count({ where: { candidateId: profile.id, status: 'COMPLETED' } }),
    ]);

    const achievements: Achievement[] = [
      {
        id: 'profile-complete',
        title: 'Profile Complete',
        description: 'Filled out every section of your candidate profile',
        icon: 'fa-solid fa-id-card',
        earned: profileCompletionPercent === 100,
      },
      {
        id: 'first-application',
        title: 'First Application',
        description: 'Applied to your first job on JobStock',
        icon: 'fa-solid fa-paper-plane',
        earned: applicationCount >= 1,
      },
      {
        id: 'job-hunter',
        title: 'Job Hunter',
        description: 'Applied to 5 or more jobs',
        icon: 'fa-solid fa-magnifying-glass',
        earned: applicationCount >= 5,
      },
      {
        id: 'skill-verified',
        title: 'Skill Verified',
        description: 'Passed a proctored skill assessment',
        icon: 'fa-solid fa-shield-check',
        earned: profile.isVerified,
      },
      {
        id: 'skill-master',
        title: 'Skill Master',
        description: 'Passed 3 or more skill assessments',
        icon: 'fa-solid fa-award',
        earned: passedAssessmentCount >= 3,
      },
      {
        id: 'interview-ready',
        title: 'Interview Ready',
        description: 'Completed a mock interview',
        icon: 'fa-solid fa-video',
        earned: completedInterviewCount >= 1,
      },
      {
        id: 'referral-rookie',
        title: 'Referral Rookie',
        description: 'Earned 50+ referral points',
        icon: 'fa-solid fa-users',
        earned: profile.referralPoints >= 50,
      },
      {
        id: 'referral-champion',
        title: 'Referral Champion',
        description: 'Earned 250+ referral points',
        icon: 'fa-solid fa-crown',
        earned: profile.referralPoints >= 250,
      },
    ];

    return {
      profileCompletionPercent,
      stats: {
        applicationCount,
        passedAssessmentCount,
        completedInterviewCount,
        referralPoints: profile.referralPoints,
      },
      achievements,
      earnedCount: achievements.filter((a) => a.earned).length,
      totalCount: achievements.length,
    };
  }
}
