import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';

interface CandidateRanking {
  applicationId: string;
  matchScore: number;
  strengths: string[];
  concerns: string[];
}

const SYSTEM_PROMPT = `You are an AI recruiting assistant helping an employer shortlist applicants for a job.
Given the job description and a list of applicants (with their profile headline, skills, experience, and about
section), rank ALL applicants from best to worst fit. Be honest — a low-effort or clearly unrelated profile should
get a low score, not an inflated one.
Respond with strict JSON, no markdown, no extra text:
{
  "rankings": [
    { "applicationId": string (must be one of the provided application ids, copied exactly), "matchScore": number (0-100),
      "strengths": string[] (1-3 specific reasons they fit), "concerns": string[] (0-2 gaps or risks, empty array if none) }
  ]
}
Every applicationId provided must appear exactly once in the rankings.`;

@Injectable()
export class AutoShortlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async rankApplicants(employerUserId: string, jobId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerUserId } });
    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) {
      throw new NotFoundException('Job not found');
    }

    const applications = await this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            email: true,
            candidateProfile: {
              select: { fullName: true, headline: true, skills: true, experienceYears: true, about: true, location: true },
            },
          },
        },
      },
    });

    if (applications.length === 0) {
      return [];
    }

    const applicantsForPrompt = applications.map((a) => ({
      applicationId: a.id,
      headline: a.candidate.candidateProfile?.headline || 'Not specified',
      skills: a.candidate.candidateProfile?.skills || [],
      experienceYears: a.candidate.candidateProfile?.experienceYears ?? 'Not specified',
      about: a.candidate.candidateProfile?.about || 'Not specified',
      location: a.candidate.candidateProfile?.location || 'Not specified',
      coverNote: a.coverNote || 'None provided',
    }));

    const userPrompt = `Job title: ${job.title}
Job category: ${job.category}
Job location: ${job.location}
Job description: ${job.description}

Applicants (JSON):
${JSON.stringify(applicantsForPrompt)}`;

    const { rankings } = await this.ai.generateJson<{ rankings: CandidateRanking[] }>(SYSTEM_PROMPT, userPrompt);

    const appById = new Map(applications.map((a) => [a.id, a]));
    return rankings
      .filter((r) => appById.has(r.applicationId))
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((r) => {
        const app = appById.get(r.applicationId)!;
        return {
          applicationId: app.id,
          status: app.status,
          appliedAt: app.appliedAt,
          matchScore: r.matchScore,
          strengths: r.strengths,
          concerns: r.concerns,
          candidate: {
            email: app.candidate.email,
            fullName: app.candidate.candidateProfile?.fullName,
            headline: app.candidate.candidateProfile?.headline,
            skills: app.candidate.candidateProfile?.skills,
            experienceYears: app.candidate.candidateProfile?.experienceYears,
            location: app.candidate.candidateProfile?.location,
          },
        };
      });
  }
}
