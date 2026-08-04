import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  /**
   * Sends a prompt to Gemini and parses the response as JSON. Gemini is asked
   * to return only JSON, but we strip markdown code fences defensively since
   * models sometimes wrap output in ```json blocks regardless of instructions.
   */
  async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const model = this.getClient().getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    const model = this.getClient().getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  }

  async chat(systemPrompt: string, history: { role: 'user' | 'model'; text: string }[], message: string) {
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
  }
}
