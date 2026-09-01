import { Injectable, InternalServerErrorException, HttpException, HttpStatus, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiFeature } from '../../generated/prisma/enums.js';
import { getCapacityConfig } from '../config/capacity.config.js';

@Injectable()
export class AiService {
  private client: GoogleGenerativeAI | null = null;
  private activeRequests = 0;
  private readonly waitingRequests: Array<() => void> = [];
  private readonly capacity = getCapacityConfig();

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

  private async withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    return this.runWithConcurrencyLimit(async () => {
      try {
        return await operation();
      } catch (err: any) {
        if (err?.status === 429 || err?.message?.includes('429')) {
          throw new HttpException('AI services are currently busy due to high demand. Please wait a minute and try again.', HttpStatus.TOO_MANY_REQUESTS);
        }
        throw err;
      }
    });
  }

  private async runWithConcurrencyLimit<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.capacity.ai.maxConcurrent) {
      if (this.waitingRequests.length >= this.capacity.ai.maxQueued) {
        throw new ServiceUnavailableException('AI services are busy. Please try again shortly.');
      }
      await new Promise<void>((resolve) => this.waitingRequests.push(resolve));
    }

    this.activeRequests += 1;
    try {
      return await operation();
    } finally {
      this.activeRequests -= 1;
      this.waitingRequests.shift()?.();
    }
  }

  private async logUsage(
    feature: AiFeature | undefined,
    userId: string | undefined,
    success: boolean,
    latencyMs: number,
    promptTokens?: number,
    responseTokens?: number,
    errorMessage?: string,
    modelName?: string,
  ) {
    try {
      await this.prisma.aiUsageLog.create({
        data: {
          feature: feature || 'CHATBOT',
          userId: userId || null,
          success,
          latencyMs,
          promptTokens: promptTokens || null,
          responseTokens: responseTokens || null,
          totalTokens: (promptTokens || 0) + (responseTokens || 0) || null,
          errorMessage: errorMessage || null,
          model: modelName || null,
        },
      });
    } catch (err) {
      console.error('Failed to log AI usage:', err);
    }
  }

  /**
   * Sends a prompt to Gemini and parses the response as JSON. Gemini is asked
   * to return only JSON, but we strip markdown code fences defensively since
   * LLMs sometimes include them anyway.
   */
  async generateJson<T>(
    systemInstruction: string,
    prompt: string,
    feature?: AiFeature,
    userId?: string,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.withErrorHandling(async () => {
        const model = this.getClient().getGenerativeModel({
          model: 'gemini-3.6-flash',
          systemInstruction,
          generationConfig: {
            temperature: 0.2, // Low temperature for more deterministic JSON
            responseMimeType: 'application/json',
          },
        });

        return await model.generateContent(prompt);
      });

      const text = result.response.text();
      const latencyMs = Date.now() - startTime;
      const promptTokens = result.response.usageMetadata?.promptTokenCount ?? 0;
      const responseTokens = result.response.usageMetadata?.candidatesTokenCount ?? 0;

      await this.logUsage(feature, userId, true, latencyMs, promptTokens, responseTokens, undefined, 'gemini-3.6-flash');

      // Clean up markdown fences if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedText) as T;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logUsage(feature, userId, false, latencyMs, 0, 0, err.message || String(err), 'gemini-3.6-flash');
      throw err;
    }
  }

  /**
   * Basic text generation without JSON constraints.
   */
  async generateText(
    systemInstruction: string,
    prompt: string,
    feature?: AiFeature,
    userId?: string,
  ): Promise<string> {
    const startTime = Date.now();
    try {
      const result = await this.withErrorHandling(async () => {
        const model = this.getClient().getGenerativeModel({
          model: 'gemini-3.6-flash',
          systemInstruction,
        });

        return await model.generateContent(prompt);
      });

      const text = result.response.text().trim();
      const latencyMs = Date.now() - startTime;
      const promptTokens = result.response.usageMetadata?.promptTokenCount ?? 0;
      const responseTokens = result.response.usageMetadata?.candidatesTokenCount ?? 0;

      await this.logUsage(feature, userId, true, latencyMs, promptTokens, responseTokens, undefined, 'gemini-3.6-flash');

      return text;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logUsage(feature, userId, false, latencyMs, 0, 0, err.message || String(err), 'gemini-3.6-flash');
      throw err;
    }
  }

  async chat(
    systemPrompt: string,
    history: { role: 'user' | 'model'; text: string }[],
    message: string,
    feature?: AiFeature,
    userId?: string,
  ) {
    const startTime = Date.now();
    try {
      const result = await this.withErrorHandling(async () => {
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
        return await chatSession.sendMessage(message);
      });

      const text = result.response.text();
      const latencyMs = Date.now() - startTime;
      const promptTokens = result.response.usageMetadata?.promptTokenCount ?? 0;
      const responseTokens = result.response.usageMetadata?.candidatesTokenCount ?? 0;

      await this.logUsage(feature, userId, true, latencyMs, promptTokens, responseTokens, undefined, 'gemini-flash-latest');

      return text;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logUsage(feature, userId, false, latencyMs, 0, 0, err.message || String(err), 'gemini-flash-latest');
      throw err;
    }
  }

  async extractBlogFromDocument(file: Express.Multer.File, userId?: string): Promise<any> {
    let extractedText = '';

    try {
      if (file.mimetype === 'application/pdf') {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(file.buffer);
        extractedText = data.text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/msword') {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      } else if (file.mimetype === 'application/vnd.ms-powerpoint' || file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        throw new BadRequestException('PowerPoint parsing is not natively supported. Please export it to PDF first.');
      } else {
        throw new BadRequestException('Unsupported file format. Please upload a PDF or Word document.');
      }
    } catch (err: any) {
      throw new BadRequestException('Failed to extract text from the document. Please ensure it is a valid file. Details: ' + err.message);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new BadRequestException('No text could be extracted from this document.');
    }

    const systemPrompt = `You are an expert copywriter and SEO specialist. Extract and format a professional blog post from the provided document text.
You MUST return a JSON object with EXACTLY these keys:
- title: (string) A catchy, relevant title for the blog post.
- excerpt: (string) A brief, engaging 1-2 sentence summary.
- body: (string) The full content, formatted beautifully in HTML. Use <h2> and <h3> for headings. Wrap paragraphs in <p>. Do NOT include <html> or <body> tags, just the inner HTML.
- category: (string) Choose ONE category that fits best from: 'technology', 'career', 'news', 'health', 'general'.
- seoTitle: (string) SEO optimized title (max 60 chars).
- seoKeywords: (string) Comma separated keywords.
- seoDescription: (string) Meta description (max 160 chars).
- readTimeMinutes: (number) Estimated read time in minutes.`;

    const prompt = `Here is the text extracted from the document:

${extractedText.substring(0, 50000)}

Generate the blog post JSON according to the system instructions.`;

    return this.generateJson<any>(systemPrompt, prompt, AiFeature.CHATBOT, userId);
  }
}
