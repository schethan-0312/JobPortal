import { Injectable, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private client: GoogleGenerativeAI | null = null;

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
    try {
      return await operation();
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('429')) {
        throw new HttpException('AI services are currently busy due to high demand. Please wait a minute and try again.', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw err;
    }
  }

  /**
   * Sends a prompt to Gemini and parses the response as JSON. Gemini is asked
   * to return only JSON, but we strip markdown code fences defensively since
   * LLMs sometimes include them anyway.
   */
  async generateJson<T>(systemInstruction: string, prompt: string): Promise<T> {
    return this.withErrorHandling(async () => {
      const model = this.getClient().getGenerativeModel({
        model: 'gemini-3.6-flash',
        systemInstruction,
        generationConfig: {
          temperature: 0.2, // Low temperature for more deterministic JSON
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Clean up markdown fences if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedText) as T;
    });
  }

  /**
   * Basic text generation without JSON constraints.
   */
  async generateText(systemInstruction: string, prompt: string): Promise<string> {
    return this.withErrorHandling(async () => {
      const model = this.getClient().getGenerativeModel({
        model: 'gemini-3.6-flash',
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    });
  }

  async chat(systemPrompt: string, history: { role: 'user' | 'model'; text: string }[], message: string) {
    return this.withErrorHandling(async () => {
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
      return result.response.text();
    });
  }
}
