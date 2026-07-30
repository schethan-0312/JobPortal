import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { ScanResumeDto } from './dto/scan-resume.dto.js';

export interface ResumeScanResult {
  overallScore: number;
  structureScore: number;
  contentScore: number;
  keywordScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingKeywords: string[];
}

const SYSTEM_PROMPT = `You are an expert resume reviewer for a job portal called JobStock. You score resumes
objectively on structure, content quality, and keyword relevance for the target role (if given).
Always respond with strict JSON matching this exact shape, no markdown, no extra text:
{
  "overallScore": number (0-100),
  "structureScore": number (0-100),
  "contentScore": number (0-100),
  "keywordScore": number (0-100),
  "strengths": string[] (2-5 concise points),
  "weaknesses": string[] (2-5 concise points),
  "suggestions": string[] (3-6 actionable, specific improvements),
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

    return this.ai.generateJson<ResumeScanResult>(SYSTEM_PROMPT, userPrompt);
  }
}
