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
    const host = (process.env.EMAIL_HOST || process.env.SMTP_HOST)?.trim();
    const port = (process.env.EMAIL_PORT || process.env.SMTP_PORT)?.trim();
    const user = (process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const pass = (process.env.EMAIL_PASSWORD || process.env.SMTP_PASS)?.trim();

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

    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
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

    const adminEmail = process.env.EMAIL_USERNAME || process.env.SMTP_USER; // Sending the notification to the sender's own email inbox by default
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

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

  async sendPasswordResetOtp(email: string, otp: string) {
    if (!this.transporter) {
      this.logger.warn(`EmailService is not configured. Password reset OTP for ${email} is: ${otp}`);
      return;
    }

    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const mailOptions = {
      from: `"JobStock Security" <${from}>`,
      to: email,
      subject: 'Password Reset OTP',
      text: `Hello,\n\nYou requested a password reset for your JobStock account. Your 6-digit One-Time Password (OTP) is:\n\n${otp}\n\nThis OTP is valid for 5 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nThe JobStock Team`,
      html: `<p>Hello,</p><p>You requested a password reset for your JobStock account. Your 6-digit One-Time Password (OTP) is:</p><h2 style="font-size:32px;letter-spacing:5px;text-align:center;color:#007bff;margin:20px 0;">${otp}</h2><p>This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p><br><p>Best regards,<br>The JobStock Team</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP to ${email}`, error);
      this.logger.warn(`Fallback: Password reset OTP for ${email} is: ${otp}`);
    }
  }
  async sendSignupOtp(email: string, otp: string) {
    if (!this.transporter) {
      this.logger.warn(`EmailService is not configured. Signup OTP for ${email} is: ${otp}`);
      return;
    }

    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const mailOptions = {
      from: `"JobStock Verification" <${from}>`,
      to: email,
      subject: 'Verify Your Email',
      text: `Hello,\n\nYour 6-digit One-Time Password (OTP) for JobStock registration is:\n\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nBest regards,\nThe JobStock Team`,
      html: `<p>Hello,</p><p>Your 6-digit One-Time Password (OTP) for JobStock registration is:</p><h2 style="font-size:32px;letter-spacing:5px;text-align:center;color:#28a745;margin:20px 0;">${otp}</h2><p>This OTP is valid for 5 minutes.</p><br><p>Best regards,<br>The JobStock Team</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Signup OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send signup OTP to ${email}`, error);
      this.logger.warn(`Fallback: Signup OTP for ${email} is: ${otp}`);
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    if (!this.transporter) {
      this.logger.warn(`EmailService is not configured. Could not send welcome email to ${email}`);
      return;
    }

    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const mailOptions = {
      from: `"JobStock" <${from}>`,
      to: email,
      subject: 'Welcome to JobStock!',
      text: `Hello ${name},\n\nRegistration successful! Welcome to JobStock. We are thrilled to have you on board.\n\nBest regards,\nThe JobStock Team`,
      html: `<p>Hello <strong>${name}</strong>,</p><p>Registration successful! Welcome to JobStock. We are thrilled to have you on board.</p><br><p>Best regards,<br>The JobStock Team</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    }
  }
  async sendEmployerVerificationStatus(email: string, companyName: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    if (!this.transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    
    let subject = 'Employer Verification Update';
    let message = '';
    
    if (status === 'VERIFIED') {
      subject = 'Your Company is Verified';
      message = `<p>Good news, <b>${companyName}</b> has been successfully verified! You can now access your dashboard and post jobs.</p>`;
    } else if (status === 'REJECTED') {
      subject = 'Verification Rejected';
      message = `<p>Unfortunately, your verification for <b>${companyName}</b> was rejected. Please review your documents and contact support.</p>`;
    } else if (status === 'SUSPENDED') {
      subject = 'Account Suspended';
      message = `<p>Your account for <b>${companyName}</b> has been suspended. Please contact support.</p>`;
    }
    
    const html = `<h2>JobStock Employer Update</h2>` + message;
    
    try {
      await this.transporter.sendMail({ from, to: email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send employer verification email', e);
    }
  }
}
