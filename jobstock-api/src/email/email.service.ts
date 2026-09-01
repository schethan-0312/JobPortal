import * as path from 'path';
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
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const logoUrl = `${frontendUrl}/assets/img/logo.png`;
    
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f7f6;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #0b8260; padding: 20px; text-align: center;">
            <img src="${logoUrl}" alt="JobStock Logo" style="height: 40px; max-width: 100%; filter: brightness(0) invert(1);" />
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #0b8260; margin-top: 0;">Welcome to JobStock, ${name}! 🎉</h2>
            <p>Your registration was completely successful, and we are absolutely thrilled to have you on board.</p>
            <p>JobStock is your ultimate destination for finding the perfect job or the ideal candidate. We offer a comprehensive suite of tools designed to make your job search or hiring process as smooth and efficient as possible.</p>
            <p>Here is what you can do next:</p>
            <ul>
              <li>Complete your profile to stand out.</li>
              <li>Browse thousands of fresh job listings.</li>
              <li>Connect with top employers and candidates.</li>
            </ul>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <a href="${frontendUrl}/login" style="display: inline-block; padding: 10px 20px; background-color: #0b8260; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;">Get Started Now</a>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #666666; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0;"><strong>JobStock Job Portal</strong></p>
            <p style="margin: 0 0 10px 0;">Find your dream job with us. We connect talent with opportunity.</p>
            <p style="margin: 0 0 10px 0;">Contact Us: support@jobstock.com | <a href="${frontendUrl}" style="color: #0b8260; text-decoration: none;">Visit our website</a></p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} JobStock. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"JobStock" <${from}>`,
      to: email,
      subject: 'Welcome to JobStock!',
      text: `Welcome to JobStock, ${name}!\n\nYour registration was completely successful, and we are absolutely thrilled to have you on board.\n\nJobStock is your ultimate destination for finding the perfect job or the ideal candidate.\n\nHere is what you can do next:\n- Complete your profile to stand out.\n- Browse thousands of fresh job listings.\n- Connect with top employers and candidates.\n\nGet Started Now: ${frontendUrl}/login\n\nIf you have any questions or need assistance, feel free to reach out to our support team.\n\nBest regards,\nThe JobStock Team`,
      html: htmlTemplate.replace(logoUrl, 'cid:jobstocklogo'),
      attachments: [{
        filename: 'logo.png',
        path: path.join(process.cwd(), 'public', 'logo.png'),
        cid: 'jobstocklogo'
      }]
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

  async sendNewJobNotification(email: string, jobTitle: string, companyName: string, location: string, jobSlug: string) {
    if (!this.transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const subject = `New Job Opening: ${jobTitle} at ${companyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #0b8260;">New Job Opening</h2>
        <p>Hello,</p>
        <p><b>${companyName}</b> has just posted a new job opening that might interest you.</p>
        <p><b>Position:</b> ${jobTitle}</p>
        <p><b>Location:</b> ${location}</p>
        <br/>
        <a href="${frontendUrl}/job/${jobSlug}" style="display:inline-block;padding:10px 20px;background:#0b8260;color:#fff;text-decoration:none;border-radius:4px;">View Job Details</a>
        <p><br>Best regards,<br>The JobStock Team</p>
      </div>
    `;
    
    try {
      await this.transporter.sendMail({ from: `"JobStock" <${from}>`, to: email, subject, html });
      this.logger.log(`New job notification email sent to ${email}`);
    } catch (e) {
      this.logger.error(`Failed to send new job notification to ${email}`, e);
    }
  }
}
