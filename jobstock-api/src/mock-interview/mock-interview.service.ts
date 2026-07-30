import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { StartInterviewDto } from './dto/start-interview.dto.js';
import { SubmitInterviewDto } from './dto/submit-interview.dto.js';

const QUESTION_COUNT = 6;

export interface QuestionFeedback {
  rating: number;
  feedback: string;
}

const QUESTIONS_SYSTEM_PROMPT = `You are an experienced technical interviewer preparing a mock interview for a job portal.
Generate exactly ${QUESTION_COUNT} interview questions for the given job role: a mix of behavioral questions and
role-specific technical/scenario questions, ordered from easier to harder.
Respond with strict JSON, no markdown, no extra text:
{ "questions": string[] (exactly ${QUESTION_COUNT} questions) }`;

const FEEDBACK_SYSTEM_PROMPT = `You are an experienced interviewer giving honest, constructive feedback on mock interview
answers for a job portal. For each question/answer pair, rate the answer 1-5 (5 = excellent, 1 = very weak or empty)
and give 1-3 sentences of specific, actionable feedback. Then give an overall rating (1-5) and a short overall summary.
Respond with strict JSON, no markdown, no extra text:
{
  "perQuestion": [ { "rating": number (1-5), "feedback": string } ],
  "overallRating": number (1-5),
  "overallSummary": string
}
The perQuestion array must have exactly as many entries as there are question/answer pairs, in the same order.
If an answer is empty or "N/A", rate it 1 and note that no answer was given.`;

@Injectable()
export class MockInterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  private async getCandidateId(userId: string): Promise<string> {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    return profile.id;
  }

  async start(userId: string, dto: StartInterviewDto) {
    const candidateId = await this.getCandidateId(userId);

    const { questions } = await this.ai.generateJson<{ questions: string[] }>(
      QUESTIONS_SYSTEM_PROMPT,
      `Job role: ${dto.jobRole}`,
    );

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('Could not generate interview questions for this role — try rephrasing it.');
    }

    const interview = await this.prisma.mockInterview.create({
      data: {
        candidateId,
        jobRole: dto.jobRole,
        questions: questions as unknown as Prisma.InputJsonValue,
        status: 'PENDING',
      },
    });

    return {
      id: interview.id,
      jobRole: interview.jobRole,
      questions,
    };
  }

  async submit(userId: string, interviewId: string, dto: SubmitInterviewDto) {
    const candidateId = await this.getCandidateId(userId);
    const interview = await this.prisma.mockInterview.findUnique({ where: { id: interviewId } });

    if (!interview || interview.candidateId !== candidateId) {
      throw new NotFoundException('Mock interview not found');
    }
    if (interview.status !== 'PENDING') {
      throw new BadRequestException('This interview has already been submitted');
    }

    const questions = interview.questions as unknown as string[];
    if (dto.answers.length !== questions.length) {
      throw new BadRequestException(`Expected ${questions.length} answers, received ${dto.answers.length}`);
    }

    const pairs = questions.map((q, i) => ({ question: q, answer: dto.answers[i] || 'N/A' }));
    const userPrompt = `Job role: ${interview.jobRole}\n\nQuestion/answer pairs:\n${pairs
      .map((p, i) => `${i + 1}. Q: ${p.question}\nA: ${p.answer}`)
      .join('\n\n')}`;

    const { perQuestion, overallRating, overallSummary } = await this.ai.generateJson<{
      perQuestion: QuestionFeedback[];
      overallRating: number;
      overallSummary: string;
    }>(FEEDBACK_SYSTEM_PROMPT, userPrompt);

    const feedback = { perQuestion, overallSummary };

    const updated = await this.prisma.mockInterview.update({
      where: { id: interviewId },
      data: {
        answers: dto.answers as unknown as Prisma.InputJsonValue,
        feedback: feedback as unknown as Prisma.InputJsonValue,
        overallRating,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      jobRole: updated.jobRole,
      questions,
      answers: dto.answers,
      perQuestion,
      overallRating,
      overallSummary,
    };
  }

  async listMine(userId: string) {
    const candidateId = await this.getCandidateId(userId);
    return this.prisma.mockInterview.findMany({
      where: { candidateId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        jobRole: true,
        overallRating: true,
        completedAt: true,
      },
    });
  }

  async getOne(userId: string, interviewId: string) {
    const candidateId = await this.getCandidateId(userId);
    const interview = await this.prisma.mockInterview.findUnique({ where: { id: interviewId } });
    if (!interview || interview.candidateId !== candidateId) {
      throw new NotFoundException('Mock interview not found');
    }
    return interview;
  }
}
