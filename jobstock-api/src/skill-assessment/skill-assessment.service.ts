import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { StartAssessmentDto } from './dto/start-assessment.dto.js';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto.js';

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUESTION_COUNT = 8;
const PASS_THRESHOLD = 0.7;
const TIME_LIMIT_SECONDS = 600; // 10 minutes
const TIME_GRACE_FACTOR = 1.15; // 15% grace over the limit before flagging as exceeded

const QUESTION_SYSTEM_PROMPT = `You are an expert technical assessor creating a skill certification quiz for a job portal.
Generate exactly ${QUESTION_COUNT} multiple-choice questions to test genuine proficiency in the given skill.
Questions should range from fundamental to moderately advanced, be unambiguous, and have exactly one correct answer.
Respond with strict JSON matching this exact shape, no markdown, no extra text:
{
  "questions": [
    { "question": string, "options": string[] (exactly 4 options), "correctIndex": number (0-3) }
  ]
}`;

@Injectable()
export class SkillAssessmentService {
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

  async start(userId: string, dto: StartAssessmentDto) {
    const candidateId = await this.getCandidateId(userId);

    const { questions } = await this.ai.generateJson<{ questions: GeneratedQuestion[] }>(
      QUESTION_SYSTEM_PROMPT,
      `Skill: ${dto.skill}`,
    );

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('Could not generate an assessment for this skill — try rephrasing it.');
    }

    const assessment = await this.prisma.skillAssessment.create({
      data: {
        candidateId,
        skill: dto.skill,
        questions: questions as unknown as Prisma.InputJsonValue,
        totalQuestions: questions.length,
        status: 'PENDING',
        timeLimitSeconds: TIME_LIMIT_SECONDS,
      },
    });

    return {
      id: assessment.id,
      skill: assessment.skill,
      totalQuestions: assessment.totalQuestions,
      timeLimitSeconds: assessment.timeLimitSeconds,
      questions: questions.map((q) => ({ question: q.question, options: q.options })),
    };
  }

  async submit(userId: string, assessmentId: string, dto: SubmitAssessmentDto) {
    const candidateId = await this.getCandidateId(userId);
    const assessment = await this.prisma.skillAssessment.findUnique({ where: { id: assessmentId } });

    if (!assessment || assessment.candidateId !== candidateId) {
      throw new NotFoundException('Assessment not found');
    }
    if (assessment.status !== 'PENDING') {
      throw new BadRequestException('This assessment has already been submitted');
    }

    const questions = assessment.questions as unknown as GeneratedQuestion[];
    if (dto.answers.length !== questions.length) {
      throw new BadRequestException(`Expected ${questions.length} answers, received ${dto.answers.length}`);
    }

    const score = questions.reduce(
      (total, q, i) => total + (dto.answers[i] === q.correctIndex ? 1 : 0),
      0,
    );
    const passed = score / questions.length >= PASS_THRESHOLD;

    // Server-side timing check — never trust the client's own clock for integrity signals.
    const elapsedSeconds = (Date.now() - assessment.createdAt.getTime()) / 1000;
    const timeExceeded = elapsedSeconds > assessment.timeLimitSeconds * TIME_GRACE_FACTOR;
    const violations = Math.max(0, dto.violations ?? 0);
    const proctored = violations === 0 && !timeExceeded;

    const updated = await this.prisma.skillAssessment.update({
      where: { id: assessmentId },
      data: {
        answers: dto.answers as unknown as Prisma.InputJsonValue,
        score,
        passed,
        status: 'COMPLETED',
        completedAt: new Date(),
        violations,
        timeExceeded,
        proctored,
      },
    });

    // Wire the dormant "trust badge" on the candidate's profile: it only flips on
    // when a skill assessment was both passed AND completed under real proctoring
    // conditions (no tab-switching, within the time limit) — a genuine signal, not
    // a rubber stamp.
    if (passed && proctored) {
      await this.prisma.candidateProfile.update({
        where: { id: candidateId },
        data: { isVerified: true },
      });
    }

    return {
      id: updated.id,
      skill: updated.skill,
      score,
      totalQuestions: questions.length,
      passed,
      proctored,
      timeExceeded,
      violations,
      correctAnswers: questions.map((q) => q.correctIndex),
    };
  }

  async listMine(userId: string) {
    const candidateId = await this.getCandidateId(userId);
    const assessments = await this.prisma.skillAssessment.findMany({
      where: { candidateId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        skill: true,
        score: true,
        totalQuestions: true,
        passed: true,
        proctored: true,
        completedAt: true,
      },
    });
    return assessments;
  }
}
