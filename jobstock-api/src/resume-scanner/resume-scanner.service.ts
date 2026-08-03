import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { ScanResumeDto } from './dto/scan-resume.dto.js';
import { AiFeature } from '../../generated/prisma/enums.js';

export interface Suggestion {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ResumeScanResult {
  overallScore: number;
  summary: string;
  structureScore: number;
  keywordScore: number;
  atsScore: number;
  achievementScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  missingKeywords: string[];
}

const SYSTEM_PROMPT = `You are an expert resume reviewer for a job portal called JobStock. You score resumes
objectively on formatting/structure, keyword relevance for the target role, ATS (applicant tracking system)
compatibility, and how well achievements are quantified with concrete numbers/impact.
Always respond with strict JSON matching this exact shape, no markdown, no extra text:
{
  "overallScore": number (0-100),
  "summary": string (1 plain-language sentence summarizing the resume's overall state, e.g. "Solid experience section but weak keyword alignment for this role"),
  "structureScore": number (0-100, formatting, section organization, readability),
  "keywordScore": number (0-100, keyword match against the target role — if no target role given, judge general keyword strength for the candidate's apparent field),
  "atsScore": number (0-100, how well this would parse in an ATS: standard section headers, no tables/columns/graphics implied, plain text-friendly formatting),
  "achievementScore": number (0-100, how well accomplishments are quantified with concrete numbers, metrics, or measurable impact rather than vague duties),
  "strengths": string[] (2-5 concise points),
  "weaknesses": string[] (2-5 concise points),
  "suggestions": [ { "text": string (specific, actionable, references actual resume content — not generic advice), "priority": "high" | "medium" | "low" } ] (3-6 items, ordered most important first),
  "missingKeywords": string[] (relevant skills/keywords missing for the target role, empty array if no target role given)
}
Be honest and specific — reference actual content from the resume, not generic advice.`;

@Injectable()
export class ResumeScannerService {
  constructor(private readonly ai: AiService) {}

  async scan(dto: ScanResumeDto): Promise<ResumeScanResult> {
    const userPrompt = `Target role: ${dto.targetRole || 'Not specified — evaluate generally'}

Resume text:
"""
${dto.resumeText}
"""`;

    return this.ai.generateJson<ResumeScanResult>(AiFeature.RESUME_SCANNER, SYSTEM_PROMPT, userPrompt);
  }
}
