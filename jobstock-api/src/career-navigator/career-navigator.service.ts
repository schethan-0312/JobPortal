import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { GeneratePathDto } from './dto/generate-path.dto.js';
import { AiFeature } from '../../generated/prisma/enums.js';

export interface CareerStep {
  roleTitle: string;
  timeframe: string;
  salaryRange: string;
  description: string;
  skillsToLearn: string[];
}

export interface CareerPathResult {
  currentLevelSummary: string;
  careerPath: CareerStep[];
  recommendedSkillsNow: string[];
}

const SYSTEM_PROMPT = `You are a career advisor for a job portal, creating a personalized career path roadmap.
Given a candidate's current headline, skills, and years of experience, produce a realistic progression of 3-4 future
roles they could grow into over the next several years, each with an approximate timeframe, a realistic salary range
in INR per annum (India job market), a short description of the role, and 2-4 specific skills they'd need to learn to
reach it. Also give 3-5 skills they should focus on learning right now for the most immediate impact.
Respond with strict JSON, no markdown, no extra text:
{
  "currentLevelSummary": string (1-2 sentences on where they are now),
  "careerPath": [
    { "roleTitle": string, "timeframe": string (e.g. "1-2 years"), "salaryRange": string (e.g. "₹8L - ₹12L PA"),
      "description": string, "skillsToLearn": string[] }
  ],
  "recommendedSkillsNow": string[]
}`;

@Injectable()
export class CareerNavigatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async generate(userId: string, dto: GeneratePathDto): Promise<CareerPathResult> {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    if (!profile.headline && profile.skills.length === 0) {
      throw new BadRequestException(
        'Add a headline and some skills to your profile first so we can generate a meaningful career path.',
      );
    }

    const userPrompt = `Candidate profile:
- Current headline/role: ${profile.headline || 'Not specified'}
- Years of experience: ${profile.experienceYears ?? 'Not specified'}
- Skills: ${profile.skills.length > 0 ? profile.skills.join(', ') : 'Not specified'}
- About: ${profile.about || 'Not specified'}
- Target industry/direction (optional): ${dto.targetIndustry || 'Not specified — infer from current profile'}`;

    return this.ai.generateJson<CareerPathResult>(AiFeature.CAREER_NAVIGATOR, SYSTEM_PROMPT, userPrompt, userId);
  }
}
