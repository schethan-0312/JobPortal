import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USERNAME;
    const pass = process.env.EMAIL_PASSWORD;

    if (!host || !user || !pass) {
      this.logger.warn('Email configuration missing in .env. EmailService is disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: port ? parseInt(port, 10) : 587,
      secure: port === '465', // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendSubscriberConfirmation(email: string) {
    if (!this.transporter) {
      this.logger.warn('EmailService is not configured. Cannot send subscriber confirmation.');
      return;
    }

    const from = process.env.EMAIL_FROM || process.env.EMAIL_USERNAME;
    const mailOptions = {
      from: `"JobStock" <${from}>`,
      to: email,
      subject: 'Thanks for subscribing to JobStock!',
      text: 'Hi there,\n\nThanks for subscribing to JobStock! We will keep you updated with the latest news and updates.\n\nBest regards,\nThe JobStock Team',
      html: '<p>Hi there,</p><p>Thanks for subscribing to JobStock! We will keep you updated with the latest news and updates.</p><br><p>Best regards,<br>The JobStock Team</p>',
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Subscriber confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send subscriber confirmation email to ${email}`, error);
    }
  }

  async sendAdminNotification(subscriberEmail: string) {
    if (!this.transporter) {
      this.logger.warn('EmailService is not configured. Cannot send admin notification.');
      return;
    }

    const adminEmail = process.env.EMAIL_USERNAME; // Sending the notification to the sender's own email inbox by default
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USERNAME;

    if (!adminEmail) return;

    const mailOptions = {
      from: `"JobStock System" <${from}>`,
      to: adminEmail,
      subject: 'New Newsletter Subscriber!',
      text: `A new user has subscribed to the newsletter: ${subscriberEmail}`,
      html: `<p>A new user has subscribed to the newsletter: <strong>${subscriberEmail}</strong></p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Admin notification email sent for new subscriber ${subscriberEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send admin notification email for ${subscriberEmail}`, error);
    }
  }
}
