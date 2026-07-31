import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiFeature } from '../../generated/prisma/enums.js';

interface UsageMeta {
  promptTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
}

@Injectable()
export class AiService {
  private client: GoogleGenerativeAI | null = null;
  // Refreshed every 30s rather than hit the DB on every AI call.
  private killSwitchCache: { data: Set<AiFeature>; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private getClient(): GoogleGenerativeAI {
    if (this.client) return this.client;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('AI features are not configured yet — GEMINI_API_KEY is missing.');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    return this.client;
  }

  private async getDisabledFeatures(): Promise<Set<AiFeature>> {
    if (this.killSwitchCache && this.killSwitchCache.expiresAt > Date.now()) {
      return this.killSwitchCache.data;
    }
    const disabled = await this.prisma.aiFeatureConfig.findMany({ where: { enabled: false } });
    const data = new Set(disabled.map((d) => d.feature));
    this.killSwitchCache = { data, expiresAt: Date.now() + 30_000 };
    return data;
  }

  private async assertEnabled(feature: AiFeature) {
    const disabled = await this.getDisabledFeatures();
    if (disabled.has(feature)) {
      throw new ServiceUnavailableException(`This AI feature is temporarily disabled by an administrator.`);
    }
  }

  private async logUsage(
    feature: AiFeature,
    startedAt: number,
    outcome: { success: true; meta: UsageMeta } | { success: false; error: unknown },
    userId?: string,
  ) {
    const latencyMs = Date.now() - startedAt;
    await this.prisma.aiUsageLog
      .create({
        data: {
          feature,
          userId,
          success: outcome.success,
          errorMessage: outcome.success ? null : String((outcome.error as Error)?.message ?? outcome.error),
          latencyMs,
          promptTokens: outcome.success ? outcome.meta.promptTokens : undefined,
          responseTokens: outcome.success ? outcome.meta.responseTokens : undefined,
          totalTokens: outcome.success ? outcome.meta.totalTokens : undefined,
        },
      })
      .catch(() => {
        // Usage logging must never break the actual AI feature it's observing.
      });
  }

  /**
   * Sends a prompt to Gemini and parses the response as JSON. Gemini is asked
   * to return only JSON, but we strip markdown code fences defensively since
   * models sometimes wrap output in ```json blocks regardless of instructions.
   */
  async generateJson<T>(feature: AiFeature, systemPrompt: string, userPrompt: string, userId?: string): Promise<T> {
    await this.assertEnabled(feature);
    const startedAt = Date.now();
    try {
      const model = this.getClient().getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: systemPrompt,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      const usage = result.response.usageMetadata;
      await this.logUsage(
        feature,
        startedAt,
        {
          success: true,
          meta: {
            promptTokens: usage?.promptTokenCount,
            responseTokens: usage?.candidatesTokenCount,
            totalTokens: usage?.totalTokenCount,
          },
        },
        userId,
      );
      return JSON.parse(text) as T;
    } catch (error) {
      await this.logUsage(feature, startedAt, { success: false, error }, userId);
      throw error;
    }
  }

  async generateText(feature: AiFeature, systemPrompt: string, userPrompt: string, userId?: string): Promise<string> {
    await this.assertEnabled(feature);
    const startedAt = Date.now();
    try {
      const model = this.getClient().getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent(userPrompt);
      const usage = result.response.usageMetadata;
      await this.logUsage(
        feature,
        startedAt,
        {
          success: true,
          meta: {
            promptTokens: usage?.promptTokenCount,
            responseTokens: usage?.candidatesTokenCount,
            totalTokens: usage?.totalTokenCount,
          },
        },
        userId,
      );
      return result.response.text();
    } catch (error) {
      await this.logUsage(feature, startedAt, { success: false, error }, userId);
      throw error;
    }
  }

  async chat(
    feature: AiFeature,
    systemPrompt: string,
    history: { role: 'user' | 'model'; text: string }[],
    message: string,
    userId?: string,
  ) {
    await this.assertEnabled(feature);
    const startedAt = Date.now();
    try {
      const model = this.getClient().getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: systemPrompt,
      });
      // Gemini requires chat history to start with a 'user' turn — drop any leading
      // 'model' turns (e.g. a UI's seeded greeting message) before sending it along.
      const firstUserIndex = history.findIndex((h) => h.role === 'user');
      const validHistory = firstUserIndex === -1 ? [] : history.slice(firstUserIndex);
      const chatSession = model.startChat({
        history: validHistory.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      });
      const result = await chatSession.sendMessage(message);
      const usage = result.response.usageMetadata;
      await this.logUsage(
        feature,
        startedAt,
        {
          success: true,
          meta: {
            promptTokens: usage?.promptTokenCount,
            responseTokens: usage?.candidatesTokenCount,
            totalTokens: usage?.totalTokenCount,
          },
        },
        userId,
      );
      return result.response.text();
    } catch (error) {
      await this.logUsage(feature, startedAt, { success: false, error }, userId);
      throw error;
    }
  }
}
