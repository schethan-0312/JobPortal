import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { ScanResumeDto, ScanSourceType } from './dto/scan-resume.dto.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

export interface ResumeScanResult {
  overallScore: number;
  atsScore: number;
  skillScore: number;
  experienceScore: number;
  completenessScore: number;
  grammarScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingSkills: string[];
  missingKeywords: string[];
  missingSections: string[];
  interviewReadiness: string;
}

export type ScanResponse = ResumeScanResult | { success: boolean; message: string };

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter for JobStock.
You evaluate resumes using advanced semantic understanding. You are provided with:
1. The extracted text of the candidate's resume.
2. The target job role or job description.

Your task is to analyze the semantic similarity and match between the candidate's skills/experience and the target role requirements. Do NOT rely strictly on exact keyword matches; look for conceptual and semantic matches.
A high score (>75) means the resume is highly relevant conceptually. A low score (<50) means significant semantic gaps.
Always respond with strict JSON matching this exact shape, no markdown, no extra text:
{
  "overallScore": number (0-100, AI Resume Health Score),
  "atsScore": number (0-100, AI ATS Compatibility Assessment based on semantic match to the JD),
  "skillScore": number (0-100, Skill Match Score based on semantic relevance),
  "experienceScore": number (0-100, Experience Relevance Score),
  "completenessScore": number (0-100, Resume Completeness Score),
  "grammarScore": number (0-100, Grammar & Readability Score),
  "strengths": string[] (3-5 concise points on what the resume does well semantically),
  "weaknesses": string[] (3-5 concise points on semantic or structural weaknesses),
  "suggestions": string[] (3-6 actionable, specific improvements),
  "missingSkills": string[] (important skills missing for the target role),
  "missingKeywords": string[] (ATS-friendly terms that should be included),
  "missingSections": string[] (e.g. "Projects", "Certifications" if omitted),
  "interviewReadiness": string (1-2 sentences summarizing if the candidate is ready for an interview)
}
Be honest, highly specific, and ensure your scores accurately reflect the semantic match.`;

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

  async scan(userId: string, dto: ScanResumeDto): Promise<ScanResponse> {
    try {
      let extractedText = '';

      if (dto.sourceType === ScanSourceType.PASTE) {
        if (!dto.pastedText || dto.pastedText.trim() === '') {
          return { success: false, message: 'Please provide resume text to scan.' };
        }
        extractedText = dto.pastedText;
      } else if (dto.sourceType === ScanSourceType.UPLOAD) {
        if (!dto.resumeUrl) {
          return { success: false, message: 'No file URL provided for uploaded resume.' };
        }
        const cleanUrl = dto.resumeUrl.startsWith('/') ? dto.resumeUrl.slice(1) : dto.resumeUrl;
        const filePath = path.join(process.cwd(), 'public', cleanUrl);
        const ext = path.extname(filePath).toLowerCase();

        if (!['.pdf', '.doc', '.docx'].includes(ext)) {
          return { success: false, message: 'Only PDF, DOC, and DOCX resumes are supported.' };
        }
        if (!fs.existsSync(filePath)) {
          return { success: false, message: 'File not found on server.' };
        }

        extractedText = await extractResumeText(filePath);
        if (!extractedText || extractedText.trim() === '') {
          return { success: false, message: 'Unable to extract text from the uploaded resume.' };
        }
      } else if (dto.sourceType === ScanSourceType.SAVED) {
        const profile = await this.prisma.candidateProfile.findUnique({
          where: { userId },
        });

        if (!profile) {
          return { success: false, message: 'Profile not found.' };
        }

        const candidateResume = await this.prisma.candidateResume.findUnique({
          where: { candidateId: profile.id },
          include: { educations: true, experiences: true, projects: true, certifications: true },
        });

        if (!candidateResume) {
          return { success: false, message: 'You do not have a saved resume yet.' };
        }

        extractedText = `
Summary: ${candidateResume.summary || ''}
Skills: ${(candidateResume.skills || []).join(', ')}
Languages: ${(candidateResume.languages || []).join(', ')}
Experience:
${candidateResume.experiences.map((exp) => `${exp.title} at ${exp.company} (${exp.startDate}): ${exp.description}`).join('\n')}
Education:
${candidateResume.educations.map((ed) => `${ed.title} at ${ed.academy} (${ed.year})`).join('\n')}
Projects: ${(candidateResume.projects as any[] || []).map(p => p.title).join(', ')}
Certifications: ${(candidateResume.certifications as any[] || []).map(c => c.title).join(', ')}
        `.trim();

        if (extractedText.length < 50) {
          return { success: false, message: 'Your saved resume is too empty to scan.' };
        }
      } else {
        return { success: false, message: 'Invalid source type.' };
      }

      // Prepare target role / JD
      const targetText = dto.jobDescription || dto.targetRole || 'General Resume Evaluation';

      // 3. Generate AI Report
      const userPrompt = `Target Role / Job Description: ${targetText}

Resume text:
"""
${extractedText}
"""`;

      return await this.ai.generateJson<ResumeScanResult>(SYSTEM_PROMPT, userPrompt);
    } catch (error) {
      console.error('Resume Scan Error:', error);
      return {
        success: false,
        message: 'An error occurred while scanning your resume.',
      };
    }
  }
}
