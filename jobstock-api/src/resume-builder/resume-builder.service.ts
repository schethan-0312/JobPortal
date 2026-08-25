import { NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { GenerateResumeDto } from './dto/generate-resume.dto.js';
import { SuggestImprovementDto } from './dto/suggest-improvement.dto.js';
import { AiFeature } from '../../generated/prisma/enums.js';

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

export interface ProjectEntry {
  title: string;
  link?: string;
  description: string;
}

export interface CertificationEntry {
  title: string;
  year: string;
  description: string;
}

export interface BuiltResume {
  fullName: string;
  headline: string;
  contact: { email?: string; phone?: string; location?: string };
  summary: string;
  skills: string[];
  languages: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
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
  "languages": string[] (extracted spoken or written languages, or empty array),
  "experience": [ { "title": string, "company": string, "duration": string, "bullets": string[] } ],
  "education": [ { "degree": string, "institution": string, "year": string } ],
  "projects": [ { "title": string, "link": string (or empty), "description": string } ],
  "certifications": [ { "title": string, "year": string, "description": string } ]
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
      languages: string[];
      experience: ExperienceEntry[];
      education: EducationEntry[];
      projects: ProjectEntry[];
      certifications: CertificationEntry[];
    }>(SYSTEM_PROMPT, userPrompt, AiFeature.RESUME_BUILDER, userId);

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
      languages: generated.languages || [],
      experience: generated.experience || [],
      education: generated.education || [],
      projects: generated.projects || [],
      certifications: generated.certifications || [],
    };
  }

  async suggestImprovement(userId: string, dto: SuggestImprovementDto) {
    const PROMPT = `You are an expert resume reviewer and copywriter.
The candidate wants to improve the following text from the "${dto.sectionType}" section of their resume.
Provide an improved, professional version of this text.
If it is a bullet point or paragraph, rewrite it using strong action verbs, quantifiable metrics where implied, and impactful phrasing.
If it is a list of skills, suggest a more professional grouping or formatting, or add obviously missing foundational keywords.
Return only the improved text, no extra conversational text.`;

    const result = await this.ai.generateText(PROMPT, `Text to improve:\n"""\n${dto.text}\n"""`, AiFeature.RESUME_BUILDER, userId);
    return { suggestion: result.trim() };
  }
}
