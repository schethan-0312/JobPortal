import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { GeneratePathDto } from './dto/generate-path.dto.js';
import { CareerKnowledgeService } from './career-knowledge.service.js';
import { extractResumeText } from '../resume-scanner/resume-scanner.service.js';
import * as path from 'path';
import * as fs from 'fs';

export interface CareerStep {
  roleTitle: string;
  timeframe: string;
  salaryRange: string;
  description: string;
  skillsToLearn: string[];
  technologies: string[];
  projects: string[];
  certifications: string[];
}

export interface CareerPathResult {
  currentLevelSummary: string;
  currentCareerLevel: string;
  currentSkills: string[];
  currentStrengths: string[];
  currentWeaknesses: string[];
  skillGaps: string[];
  recommendedSkillsNow: string[];
  careerPath: CareerStep[];
  interviewReadiness: {
    score: number;
    topics: string[];
  };
}

const SYSTEM_PROMPT = `You are an expert AI Career Advisor for a leading job portal.
Your task is to generate a personalized career roadmap for a candidate based on their current profile AND the provided retrieved career paths from our Knowledge Base.

CRITICAL INSTRUCTIONS (RAG STRICT COMPLIANCE):
1. For the future career roadmap ('careerPath' array), you MUST ONLY use the retrieved career roles provided below.
2. DO NOT invent or hallucinate career steps, salaries, technologies, or certifications. You must strictly align with the retrieved data.
3. You can personalize the descriptions to explain how the candidate can bridge the gap from their current state to the retrieved roles.
4. Output strictly valid JSON matching the exact schema requested. No markdown blocks outside JSON.

JSON SCHEMA:
{
  "currentLevelSummary": "2-3 sentences analyzing where they are now based on their source data",
  "currentCareerLevel": "e.g., Junior, Mid-Level, Senior",
  "currentSkills": ["skill1", "skill2"],
  "currentStrengths": ["strength1", "strength2"],
  "currentWeaknesses": ["weakness1", "weakness2"],
  "skillGaps": ["gap1", "gap2"],
  "recommendedSkillsNow": ["immediate focus skill 1", "immediate focus skill 2"],
  "careerPath": [
    {
      "roleTitle": "string (MUST MATCH RETRIEVED ROLE)",
      "timeframe": "string (e.g. 1-2 years)",
      "salaryRange": "string (MUST MATCH RETRIEVED SALARY)",
      "description": "string",
      "skillsToLearn": ["skill1", "skill2"],
      "technologies": ["tech1", "tech2"],
      "projects": ["project1", "project2"],
      "certifications": ["cert1"]
    }
  ],
  "interviewReadiness": {
    "score": number,
    "topics": ["topic1", "topic2"]
  }
}`;

@Injectable()
export class CareerNavigatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly knowledgeService: CareerKnowledgeService,
  ) {}

  async generate(userId: string, dto: GeneratePathDto): Promise<CareerPathResult> {
    let candidateContext = '';
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });

    const sourceType = dto.sourceType || 'profile';

    if (sourceType === 'profile') {
      if (!profile || (!profile.headline && profile.skills.length === 0)) {
        throw new BadRequestException('Your profile lacks sufficient data. Please add a headline and skills, or upload a resume instead.');
      }
      candidateContext = `Profile Headline: ${profile.headline || 'None'}
Experience: ${profile.experienceYears || 'Unknown'} years
Skills: ${profile.skills.join(', ')}
About: ${profile.about || 'None'}`;
    } else if (sourceType === 'resume') {
      if (!profile) throw new BadRequestException('Profile not found.');
      const candidateResume = await this.prisma.candidateResume.findUnique({
        where: { candidateId: profile.id },
        include: { educations: true, experiences: true, projects: true, certifications: true },
      });
      if (!candidateResume) throw new BadRequestException('You do not have a saved resume yet.');
      candidateContext = `
Summary: ${candidateResume.summary || ''}
Skills: ${(candidateResume.skills || []).join(', ')}
Experience: ${candidateResume.experiences.map((exp) => `${exp.title} at ${exp.company}`).join(', ')}
      `.trim();
    } else if (sourceType === 'upload') {
      if (!dto.sourceText) {
        throw new BadRequestException('Source file URL (sourceText) is required for upload analysis.');
      }
      const cleanUrl = dto.sourceText.startsWith('/') ? dto.sourceText.slice(1) : dto.sourceText;
      const filePath = path.join(process.cwd(), 'public', cleanUrl);
      if (!fs.existsSync(filePath)) throw new BadRequestException('Uploaded file not found.');
      const extractedText = await extractResumeText(filePath);
      candidateContext = `Resume Context: ${extractedText.substring(0, 3000)}`;
    } else {
      throw new BadRequestException('Invalid source type');
    }

    if (dto.targetIndustry) {
      candidateContext += `\nTarget Industry/Direction: ${dto.targetIndustry}`;
    }

    const searchQuery = dto.targetIndustry ? `${dto.targetIndustry} ${candidateContext}` : candidateContext;
    const topRoles = await this.knowledgeService.search(searchQuery, 4);

    const retrievedRolesContext = topRoles.map(r => `
ROLE: ${r.title}
Level: ${r.level}
Salary: ${r.salaryRange}
Experience Req: ${r.experienceRequired}
Skills: ${r.requiredSkills.join(', ')}
Tech: ${r.requiredTechnologies.join(', ')}
Projects: ${r.recommendedProjects.join(', ')}
Certifications: ${r.recommendedCertifications.join(', ')}
    `).join('\n---\n');

    const finalPrompt = `
### CANDIDATE CONTEXT ###
${candidateContext}

### RETRIEVED CAREER ROLES FROM KNOWLEDGE BASE (USE THESE ONLY FOR ROADMAP) ###
${retrievedRolesContext}
    `;

    return this.ai.generateJson<CareerPathResult>(SYSTEM_PROMPT, finalPrompt);
  }
}
