import { NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { GenerateResumeDto } from './dto/generate-resume.dto.js';

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

export interface BuiltResume {
  fullName: string;
  headline: string;
  contact: { email?: string; phone?: string; location?: string };
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

const SYSTEM_PROMPT = `You are an expert resume writer for a job portal, producing ATS-friendly, professionally
worded resumes. Given a candidate's raw background notes (unstructured text about their work history and education)
plus their basic profile info, produce a polished, structured resume. Write a compelling 2-3 sentence professional
summary tailored to their target role if given. For each job, write 2-4 achievement-oriented bullet points using
strong action verbs and quantifiable outcomes where plausible from the input — do not invent specific employers,
titles, or dates that aren't implied by the input; infer reasonable durations/years only if the input gives enough
context, otherwise use sensible placeholders like "Present" or leave duration general.
Respond with strict JSON, no markdown, no extra text:
{
  "summary": string,
  "skills": string[] (deduplicated, most relevant first),
  "experience": [ { "title": string, "company": string, "duration": string, "bullets": string[] } ],
  "education": [ { "degree": string, "institution": string, "year": string } ]
}`;

@Injectable()
export class ResumeBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async generate(userId: string, dto: GenerateResumeDto): Promise<BuiltResume> {
    const profileWithUser = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });
    if (!profileWithUser) {
      throw new NotFoundException('Candidate profile not found');
    }

    const userPrompt = `Candidate profile:
- Full name: ${profileWithUser.fullName}
- Current headline: ${profileWithUser.headline || 'Not specified'}
- Known skills: ${profileWithUser.skills.length > 0 ? profileWithUser.skills.join(', ') : 'Not specified'}
- Location: ${profileWithUser.location || 'Not specified'}
- Target role for this resume: ${dto.targetRole || 'Not specified — write a general-purpose resume'}

Raw background notes from the candidate (work history, education, achievements, in their own words):
"""
${dto.rawBackground}
"""`;

    const generated = await this.ai.generateJson<{
      summary: string;
      skills: string[];
      experience: ExperienceEntry[];
      education: EducationEntry[];
    }>(SYSTEM_PROMPT, userPrompt);

    return {
      fullName: profileWithUser.fullName,
      headline: dto.targetRole || profileWithUser.headline || '',
      contact: {
        email: profileWithUser.user.email,
        phone: profileWithUser.phone || undefined,
        location: profileWithUser.location || undefined,
      },
      summary: generated.summary,
      skills: generated.skills,
      experience: generated.experience,
      education: generated.education,
    };
  }
}
