import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

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

export type ScanResponse = ResumeScanResult | { success: boolean; message: string };

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

/**
 * Reusable helper to extract text from an uploaded resume file.
 */
export async function extractResumeText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const parsedPdf = await pdfParse(dataBuffer);
    return parsedPdf.text || '';
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  if (ext === '.doc') {
    const extractor = new WordExtractor();
    const extracted = await extractor.extract(filePath);
    return extracted.getBody() || '';
  }

  throw new Error('Unsupported file type');
}

@Injectable()
export class ResumeScannerService {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  async scan(userId: string, targetRole?: string): Promise<ScanResponse> {
    try {
      const profile = await this.prisma.candidateProfile.findUnique({
        where: { userId },
      });

      if (!profile || !profile.resumeUrl) {
        return {
          success: false,
          message: 'Please upload your resume first.',
        };
      }

      const filePath = path.join(process.cwd(), profile.resumeUrl);
      const ext = path.extname(filePath).toLowerCase();

      if (!['.pdf', '.doc', '.docx'].includes(ext)) {
        return {
          success: false,
          message: 'Only PDF, DOC, and DOCX resumes are supported.',
        };
      }

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: 'Unable to extract text from the uploaded resume.',
        };
      }

      let extractedText = '';
      try {
        extractedText = await extractResumeText(filePath);
      } catch (err) {
        return {
          success: false,
          message: 'Unable to extract text from the uploaded resume.',
        };
      }

      if (!extractedText || extractedText.trim() === '') {
        return {
          success: false,
          message: 'Unable to extract text from the uploaded resume.',
        };
      }

      const userPrompt = `Target role: ${targetRole || 'Not specified — evaluate generally'}

Resume text:
"""
${extractedText}
"""`;

      return await this.ai.generateJson<ResumeScanResult>(SYSTEM_PROMPT, userPrompt);
    } catch (error) {
      return {
        success: false,
        message: 'Unable to extract text from the uploaded resume.',
      };
    }
  }
}
