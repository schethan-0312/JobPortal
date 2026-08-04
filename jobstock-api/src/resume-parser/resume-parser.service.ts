import { Injectable, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { extractResumeText } from '../resume-scanner/resume-scanner.service.js';

const SYSTEM_PROMPT = `You are an expert AI resume parser. Your job is to extract structured information from the provided raw resume text.
Always respond with strict JSON matching this exact shape, no markdown, no extra text:
{
  "fullName": string (or empty string if not found),
  "headline": string (a short professional headline based on the resume, or empty),
  "about": string (a brief professional summary, or empty),
  "skills": string[] (array of technical and soft skills),
  "experienceYears": number (estimated total years of experience, or null if cannot determine),
  "educations": [
    {
      "title": string (degree name),
      "academy": string (institution name),
      "year": string (graduation year),
      "description": string (or empty string)
    }
  ],
  "experiences": [
    {
      "title": string (job title),
      "company": string (company name),
      "startDate": string (start date),
      "endDate": string (end date or "Present"),
      "description": string (bullet points or summary)
    }
  ],
  "projects": [
    {
      "title": string,
      "description": string,
      "link": string
    }
  ],
  "certifications": [
    {
      "title": string,
      "year": string,
      "description": string
    }
  ]
}

If a section is entirely missing or cannot be detected, leave it as an empty array or empty string. Do not generate fake information. Extract exactly what is present.`;

export interface ParseResult {
  fullName: string;
  headline: string;
  about: string;
  skills: string[];
  experienceYears: number | null;
  educations: any[];
  experiences: any[];
  projects: any[];
  certifications: any[];
}

@Injectable()
export class ResumeParserService {
  constructor(private readonly ai: AiService) {}

  async parseResume(resumeUrl: string): Promise<ParseResult> {
    const filePath = path.join(process.cwd(), resumeUrl);
    
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('Uploaded file not found.');
    }

    let extractedText = '';
    try {
      extractedText = await extractResumeText(filePath);
    } catch (err) {
      throw new BadRequestException('Unable to extract text from the uploaded resume.');
    }

    if (!extractedText || extractedText.trim() === '') {
      throw new BadRequestException('Unable to extract text from the uploaded resume.');
    }

    const userPrompt = `Resume text:
"""
${extractedText}
"""`;

    return await this.ai.generateJson<ParseResult>(SYSTEM_PROMPT, userPrompt);
  }
}
