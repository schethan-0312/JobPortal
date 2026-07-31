import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service.js';

export interface IntegrationStatus {
  name: string;
  status: 'up' | 'down' | 'not_configured';
  detail: string;
  checkedAt: string;
}

const CACHE_TTL_MS = 2 * 60 * 1000;

@Injectable()
export class AdminIntegrationsService {
  private cache: { at: number; data: IntegrationStatus[] } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<IntegrationStatus[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
      return this.cache.data;
    }

    const results = await Promise.all([
      this.checkGemini(),
      this.checkRazorpay(),
      this.checkTwilio(),
      this.checkGithub(),
      this.checkLinkedin(),
      this.checkWebPush(),
      this.checkDatabase(),
    ]);

    this.cache = { at: Date.now(), data: results };
    return results;
  }

  private now() {
    return new Date().toISOString();
  }

  private async checkGemini(): Promise<IntegrationStatus> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { name: 'Gemini AI', status: 'not_configured', detail: 'GEMINI_API_KEY not set', checkedAt: this.now() };
    }
    try {
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });
      await model.generateContent('Reply with just the word: OK');
      return { name: 'Gemini AI', status: 'up', detail: 'Test call succeeded', checkedAt: this.now() };
    } catch (err) {
      return { name: 'Gemini AI', status: 'down', detail: (err as Error).message, checkedAt: this.now() };
    }
  }

  private async checkRazorpay(): Promise<IntegrationStatus> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return { name: 'Razorpay', status: 'not_configured', detail: 'Keys not set', checkedAt: this.now() };
    }
    const mode = keyId.startsWith('rzp_live_') ? 'LIVE' : keyId.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN';
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      await razorpay.orders.all({ count: 1 });
      return { name: 'Razorpay', status: 'up', detail: `${mode} mode, API reachable`, checkedAt: this.now() };
    } catch (err) {
      return { name: 'Razorpay', status: 'down', detail: `${mode} mode — ${(err as Error).message}`, checkedAt: this.now() };
    }
  }

  private async checkTwilio(): Promise<IntegrationStatus> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token || !process.env.TWILIO_FROM_NUMBER) {
      return { name: 'Twilio (SMS/WhatsApp)', status: 'not_configured', detail: 'Dormant — no credentials set', checkedAt: this.now() };
    }
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { name: 'Twilio (SMS/WhatsApp)', status: 'up', detail: 'Account reachable', checkedAt: this.now() };
    } catch (err) {
      return { name: 'Twilio (SMS/WhatsApp)', status: 'down', detail: (err as Error).message, checkedAt: this.now() };
    }
  }

  private async checkGithub(): Promise<IntegrationStatus> {
    const configured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    return {
      name: 'GitHub OAuth',
      status: configured ? 'up' : 'not_configured',
      detail: configured ? 'Client ID/secret set' : 'Dormant — no credentials set',
      checkedAt: this.now(),
    };
  }

  private async checkLinkedin(): Promise<IntegrationStatus> {
    const configured = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    return {
      name: 'LinkedIn OAuth',
      status: configured ? 'up' : 'not_configured',
      detail: configured ? 'Client ID/secret set' : 'Dormant — no credentials set',
      checkedAt: this.now(),
    };
  }

  private async checkWebPush(): Promise<IntegrationStatus> {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const configured = Boolean(pub && priv && pub.length > 60 && priv.length > 30);
    return {
      name: 'Web Push (VAPID)',
      status: configured ? 'up' : 'not_configured',
      detail: configured ? 'Keys present and well-formed' : 'Missing or malformed VAPID keys',
      checkedAt: this.now(),
    };
  }

  private async checkDatabase(): Promise<IntegrationStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { name: 'Database (PostgreSQL)', status: 'up', detail: 'Connection healthy', checkedAt: this.now() };
    } catch (err) {
      return { name: 'Database (PostgreSQL)', status: 'down', detail: (err as Error).message, checkedAt: this.now() };
    }
  }
}
