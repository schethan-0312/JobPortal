import { Injectable, Logger } from '@nestjs/common';

/**
 * SMS/WhatsApp delivery via Twilio. Follows the same dormant-until-configured
 * pattern as GitHub/LinkedIn OAuth and Razorpay: the code path is fully built,
 * but does nothing until real TWILIO_* credentials are supplied in .env.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  isConfigured() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER,
    );
  }

  private async send(to: string, body: string, from: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Twilio send failed (${res.status}): ${text}`);
    }
  }

  /** Fire-and-forget. Never throws — a failed SMS should never break the calling flow. */
  async sendSms(to: string, body: string) {
    if (!this.isConfigured()) return;
    try {
      await this.send(to, body, process.env.TWILIO_FROM_NUMBER!);
    } catch (err) {
      this.logger.warn(`SMS send failed: ${(err as Error).message}`);
    }
  }

  /** Fire-and-forget. Requires a Twilio WhatsApp-enabled sender number. */
  async sendWhatsapp(to: string, body: string) {
    if (!this.isConfigured()) return;
    try {
      await this.send(`whatsapp:${to}`, body, `whatsapp:${process.env.TWILIO_FROM_NUMBER!}`);
    } catch (err) {
      this.logger.warn(`WhatsApp send failed: ${(err as Error).message}`);
    }
  }
}
