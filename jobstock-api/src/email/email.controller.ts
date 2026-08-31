import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service.js';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('test')
  async testEmail(@Query('to') to?: string) {
    const targetEmail = to || process.env.SMTP_USER || process.env.EMAIL_USERNAME;
    if (!targetEmail) {
      throw new BadRequestException('Please provide a target email using ?to=youremail@gmail.com');
    }

    const transporter = this.emailService.getTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'SMTP transporter could not be initialized. Please check SMTP_USER and SMTP_PASS in .env.',
      };
    }

    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    try {
      const info = await transporter.sendMail({
        from: `"JobStock" <${from}>`,
        to: targetEmail,
        subject: 'JobStock Email Test Notification',
        text: 'This is a test notification from JobStock User Dashboard email system.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0b8260;">JobStock Email System Active! ??</h2>
            <p>Your SMTP credentials are configured correctly and real-time emails are working.</p>
            <p><strong>Sent To:</strong> ${targetEmail}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
      });

      return {
        success: true,
        message: `Test email sent successfully to ${targetEmail}`,
        messageId: info.messageId,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Failed to send test email',
        error: err?.message || String(err),
      };
    }
  }
}
