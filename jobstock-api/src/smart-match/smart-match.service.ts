import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { AiFeature } from '../../generated/prisma/enums.js';

interface JobMatchRanking {
  jobId: string;
  matchScore: number;
  matchReasons: string[];
}

const CANDIDATE_POOL_SIZE = 40;
const TOP_MATCHES = 10;

const SYSTEM_PROMPT = `You are an AI job-matching engine for a job portal. Given a candidate's profile and a list of
open jobs, rank the jobs by how well they fit the candidate — considering skills overlap, experience level,
location, and role relevance from the job description. Only include jobs that are a genuinely reasonable fit
(skip jobs that are clearly unrelated to the candidate's background). Return at most ${TOP_MATCHES} jobs, best match first.
Respond with strict JSON, no markdown, no extra text:
{
  "matches": [
    { "jobId": string (must be one of the provided job ids, copied exactly), "matchScore": number (0-100),
      "matchReasons": string[] (1-3 short, specific reasons this job fits) }
  ]
}`;

@Injectable()
export class SmartMatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async getMatchesForCandidate(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    if (!profile.headline && profile.skills.length === 0) {
      throw new BadRequestException(
        'Add a headline and some skills to your profile first so we can find good job matches.',
      );
    }

    const jobs = await this.prisma.job.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: CANDIDATE_POOL_SIZE,
      include: { employer: { select: { companyName: true, logoUrl: true } } },
    });

    if (jobs.length === 0) {
      return [];
    }

    const jobsForPrompt = jobs.map((j) => ({
      jobId: j.id,
      title: j.title,
      category: j.category,
      location: j.location,
      jobType: j.jobType,
      requiredSkills: j.requiredSkills,
      experienceMin: j.experienceMin,
      experienceMax: j.experienceMax,
      description: j.description.slice(0, 500),
    }));

    const userPrompt = `Candidate profile:
- Headline: ${profile.headline || 'Not specified'}
- Skills: ${profile.skills.length > 0 ? profile.skills.join(', ') : 'Not specified'}
- Years of experience: ${profile.experienceYears ?? 'Not specified'}
- Location: ${profile.location || 'Not specified'}
- About: ${profile.about || 'Not specified'}

Open jobs (JSON):
${JSON.stringify(jobsForPrompt)}`;

    const { matches } = await this.ai.generateJson<{ matches: JobMatchRanking[] }>(
      AiFeature.SMART_MATCH,
      SYSTEM_PROMPT,
      userPrompt,
      userId,
    );

    const jobById = new Map(jobs.map((j) => [j.id, j]));
    return matches
      .filter((m) => jobById.has(m.jobId))
      .map((m) => {
        const job = jobById.get(m.jobId)!;
        return {
          matchScore: m.matchScore,
          matchReasons: m.matchReasons,
          job: {
            id: job.id,
            title: job.title,
            slug: job.slug,
            location: job.location,
            jobType: job.jobType,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            employer: job.employer,
          },
        };
      });
  }
}
