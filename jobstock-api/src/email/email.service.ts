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

  public getTransporter(): nodemailer.Transporter | null {
    if (!this.transporter) {
      this.initTransporter();
    }
    return this.transporter;
  }

  public initTransporter() {
    const host = (process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com')?.trim();
    const portStr = (process.env.EMAIL_PORT || process.env.SMTP_PORT || '587')?.trim();
    const port = portStr ? parseInt(portStr, 10) : 587;
    const user = (process.env.EMAIL_USERNAME || process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
    const pass = (process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS)?.trim();

    if (!user || !pass) {
      this.logger.warn('Email configuration missing in .env (SMTP_USER or SMTP_PASS). EmailService is disabled.');
      return;
    }

    try {
      if (host?.includes('gmail') || user?.includes('gmail')) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user,
            pass,
          },
        });
        this.logger.log(`Email transporter initialized for ${user} via Gmail service`);
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: process.env.SMTP_SECURE === 'true' || port === 465,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.logger.log(`Email transporter initialized for ${user} via ${host}:${port}`);
      }
    } catch (err) {
      this.logger.error('Failed to initialize nodemailer transporter', err);
    }
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
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
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
  async sendEmployerReopened(email: string, companyName: string) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    const html = this.wrapInTemplate(
      '🎉 Account Reopened',
      `<p style="font-size: 16px; color: #333;">Great news! Your company <strong>${companyName}</strong> has been <strong>successfully reopened</strong> by our admin team! 🎊</p>
       <p style="font-size: 15px; color: #333;">Your suspension has been lifted, and you once again have full access to your employer dashboard.</p>
       <div style="padding: 20px; background-color: #f0fdf4; border-radius: 8px; border-left: 5px solid #0b8260; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
         <p style="margin: 0; font-size: 15px; color: #166534;">✅ <strong>You can now resume posting jobs, viewing candidates, and managing your account!</strong></p>
       </div>
       <p style="color: #555; font-size: 15px;">Welcome back to JobStock! 🌟</p>`,
      { text: '👉 Go to Dashboard', url: `${frontendUrl}/employer-dashboard` }
    );

    try {
      await transporter.sendMail({ from: `"JobStock Admin" <${from}>`, to: email, subject: '🎉 Your Company Account is Reopened!', html });
    } catch (e) {
      this.logger.error('Failed to send reopened email', e);
    }
  }

  async sendEmployerVerificationStatus(email: string, companyName: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const adminEmail = process.env.EMAIL_USERNAME || process.env.SMTP_USER || 'support@jobstock.com';
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    let subject = 'Employer Verification Update';
    let title = 'JobStock Employer Update';
    let message = '';

    if (status === 'VERIFIED') {
      subject = '🎉 Your Company is Verified!';
      title = '✅ Verification Successful';
      message = `
        <p style="font-size: 15px; color: #333;">Great news! Your company <strong>${companyName}</strong> has been successfully verified by our admin team.</p>
        <p style="font-size: 15px; color: #333;">You now have full access to your employer dashboard and can start posting jobs immediately. Welcome aboard! 🚀</p>
      `;
    } else if (status === 'REJECTED') {
      subject = '❌ Verification Rejected';
      title = '⚠️ Verification Rejected';
      message = `
        <p style="font-size: 15px; color: #333;">Unfortunately, the verification request for your company <strong>${companyName}</strong> was rejected by our admin team.</p>
        <p style="font-size: 15px; color: #333;">This could be due to missing documentation, invalid details, or policy violations. 🛑</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Need help?</strong> Please contact our admin team for further information and guidance on how to resolve this at: <br/>
        <a href="mailto:${adminEmail}" style="color: #0b8260; font-weight: bold;">${adminEmail}</a> 📧</p>
      `;
    } else if (status === 'SUSPENDED') {
      subject = '🚫 Account Suspended';
      title = '🚨 Account Suspended';
      message = `
        <p style="font-size: 15px; color: #333;">Your employer account for <strong>${companyName}</strong> has been suspended.</p>
        <p style="font-size: 15px; color: #333;">You will not be able to post jobs or access premium features during this time. ⛔</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Next steps:</strong> Please contact our admin team for further information regarding your suspension at: <br/>
        <a href="mailto:${adminEmail}" style="color: #0b8260; font-weight: bold;">${adminEmail}</a> 📧</p>
      `;
    }

    const html = this.wrapInTemplate(
      title,
      message,
      status === 'VERIFIED' ? { text: 'Go to Dashboard', url: `${frontendUrl}/employer-dashboard` } : undefined
    );

    try {
      await transporter.sendMail({ from: `"JobStock Admin" <${from}>`, to: email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send employer verification email', e);
    }
  }

  private wrapInTemplate(title: string, contentHtml: string, cta?: { text: string; url: string }): string {
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const ctaHtml = cta
      ? `<div style="text-align: center; margin: 30px 0 10px;">
          <a href="${cta.url}" style="display: inline-block; padding: 14px 28px; background-color: #0b8260; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 4px rgba(11, 130, 96, 0.2);">${cta.text}</a>
        </div>`
      : '';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748; line-height: 1.6; margin: 0; padding: 0; background-color: #f7fafc;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #0b8260 0%, #075e45 100%); padding: 24px 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">JobStock</h1>
          </div>
          <div style="padding: 32px 30px;">
            <h2 style="color: #1a202c; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">${title}</h2>
            ${contentHtml}
            ${ctaHtml}
          </div>
          <div style="background-color: #edf2f7; padding: 20px 30px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 6px 0;"><strong>JobStock Job Portal</strong> — Connecting Talent with Opportunity</p>
            <p style="margin: 0 0 6px 0;">You received this notification regarding your activity on JobStock.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} JobStock. All rights reserved. | <a href="${frontendUrl}" style="color: #0b8260; text-decoration: none;">Visit JobStock</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async sendApplicationSubmittedEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    location?: string | null;
    jobType?: string | null;
    category?: string | null;
    salaryText?: string | null;
    workMode?: string | null;
    jobSlug?: string | null;
    jobId?: string;
    applicationId?: string;
    appliedAt?: Date;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`[EmailService] SMTP not configured. Could not send application confirmation to ${opts.candidateEmail}`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const formattedDate = (opts.appliedAt || new Date()).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const jobUrl = opts.jobSlug
      ? `${frontendUrl}/job-detail/${opts.jobSlug}`
      : `${frontendUrl}/candidate-applied-jobs`;

    const content = `
      <p>Hi <strong>${opts.candidateName || 'Candidate'}</strong>,</p>
      <p>Your application has been successfully submitted for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong>! 🎉</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #0b8260; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; color: #0b8260; font-size: 18px;">${opts.jobTitle}</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4a5568;">
          <tr>
            <td style="padding: 4px 0; font-weight: bold; width: 140px;">🏢 Company:</td>
            <td style="padding: 4px 0; color: #1a202c;">${opts.companyName}</td>
          </tr>
          ${opts.location ? `<tr><td style="padding: 4px 0; font-weight: bold;">📍 Location:</td><td style="padding: 4px 0; color: #1a202c;">${opts.location}${opts.workMode ? ` (${opts.workMode.replace('_', ' ')})` : ''}</td></tr>` : ''}
          ${opts.jobType ? `<tr><td style="padding: 4px 0; font-weight: bold;">💼 Job Type:</td><td style="padding: 4px 0; color: #1a202c;">${opts.jobType.replace('_', ' ')}</td></tr>` : ''}
          ${opts.category ? `<tr><td style="padding: 4px 0; font-weight: bold;">📁 Category:</td><td style="padding: 4px 0; color: #1a202c;">${opts.category}</td></tr>` : ''}
          ${opts.salaryText ? `<tr><td style="padding: 4px 0; font-weight: bold;">💰 Compensation:</td><td style="padding: 4px 0; color: #0b8260; font-weight: 600;">${opts.salaryText}</td></tr>` : ''}
          ${opts.applicationId ? `<tr><td style="padding: 4px 0; font-weight: bold;">🔖 Application ID:</td><td style="padding: 4px 0; color: #718096; font-family: monospace;">${opts.applicationId}</td></tr>` : ''}
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">📅 Submitted On:</td>
            <td style="padding: 4px 0; color: #718096;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <p style="color: #4a5568; font-size: 14px; margin-bottom: 8px;">The hiring team at <strong>${opts.companyName}</strong> has received your profile and resume. You can track all status updates live in your dashboard.</p>
    `;

    const html = this.wrapInTemplate(
      'Application Sent Successfully!',
      content,
      { text: 'View Applied Jobs Dashboard', url: `${frontendUrl}/candidate-applied-jobs` }
    );

    try {
      this.logger.log(`Dispatching application confirmation to candidate: ${opts.candidateEmail} for job: "${opts.jobTitle}"`);
      await transporter.sendMail({
        from: `"JobStock Applications" <${from}>`,
        to: opts.candidateEmail,
        subject: `Application Sent: ${opts.jobTitle} at ${opts.companyName}`,
        html,
      });
      this.logger.log(`Application confirmation email successfully sent to ${opts.candidateEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send application confirmation email to ${opts.candidateEmail}`, error);
    }
  }

  async sendApplicationStatusUpdateEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    newStatus: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`[EmailService] SMTP not configured. Could not send status update to ${opts.candidateEmail}`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    let statusTitle = `Application Status: ${opts.newStatus}`;
    let statusBadgeColor = '#0b8260';
    let messageBody = `<p>There is an update on your application for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong>.</p>`;

    if (opts.newStatus === 'SHORTLISTED') {
      statusTitle = `🎉 You've been Shortlisted by ${opts.companyName}!`;
      statusBadgeColor = '#2563eb';
      messageBody = `
        <p>Great news, <strong>${opts.candidateName}</strong>!</p>
        <p><strong>${opts.companyName}</strong> has reviewed your profile and shortlisted your application for the <strong>${opts.jobTitle}</strong> position. The hiring team was impressed with your credentials and will be in touch with next steps.</p>
      `;
    } else if (opts.newStatus === 'INTERVIEW') {
      statusTitle = `📅 Interview Invitation: ${opts.jobTitle}`;
      statusBadgeColor = '#7c3aed';
      messageBody = `
        <p>Exciting news, <strong>${opts.candidateName}</strong>!</p>
        <p><strong>${opts.companyName}</strong> has invited you for an interview for the <strong>${opts.jobTitle}</strong> role. Please check your dashboard or messages for scheduling details.</p>
      `;
    } else if (opts.newStatus === 'OFFERED') {
      statusTitle = `🏆 Congratulations! Job Offer Received for ${opts.jobTitle}`;
      statusBadgeColor = '#059669';
      messageBody = `
        <p>Wonderful news, <strong>${opts.candidateName}</strong>!</p>
        <p><strong>${opts.companyName}</strong> has extended a Job Offer for the position of <strong>${opts.jobTitle}</strong>. Congratulations on this major milestone!</p>
      `;
    } else if (opts.newStatus === 'REJECTED') {
      statusTitle = `Update on your application for ${opts.jobTitle}`;
      statusBadgeColor = '#dc2626';
      messageBody = `
        <p>Dear <strong>${opts.candidateName}</strong>,</p>
        <p>Thank you for taking the time to apply for the <strong>${opts.jobTitle}</strong> position at <strong>${opts.companyName}</strong>. After careful consideration, the hiring team has decided to move forward with other candidates at this time.</p>
        <p>We encourage you to keep exploring and applying to new opportunities on JobStock.</p>
      `;
    } else if (opts.newStatus === 'REVIEWED') {
      statusTitle = `Recruiter Action: Application Reviewed by ${opts.companyName}`;
      statusBadgeColor = '#0284c7';
      messageBody = `
        <p>Hi <strong>${opts.candidateName}</strong>,</p>
        <p>A recruiter from <strong>${opts.companyName}</strong> has reviewed your application for <strong>${opts.jobTitle}</strong>.</p>
      `;
    }

    const content = `
      ${messageBody}
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: ${statusBadgeColor}; color: #ffffff; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 8px;">
          ${opts.newStatus}
        </div>
        <h4 style="margin: 6px 0 2px 0; color: #1a202c;">${opts.jobTitle}</h4>
        <p style="margin: 0; font-size: 14px; color: #718096;">🏢 ${opts.companyName}</p>
      </div>
    `;

    const html = this.wrapInTemplate(
      statusTitle,
      content,
      { text: 'View Application Status', url: `${frontendUrl}/candidate-applied-jobs` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Notifications" <${from}>`,
        to: opts.candidateEmail,
        subject: `Update: Application for ${opts.jobTitle} at ${opts.companyName} is ${opts.newStatus}`,
        html,
      });
      this.logger.log(`Status update email sent to ${opts.candidateEmail} (${opts.newStatus})`);
    } catch (error) {
      this.logger.error(`Failed to send status update email to ${opts.candidateEmail}`, error);
    }
  }

  async sendApplicationWithdrawnEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const content = `
      <p>Hi <strong>${opts.candidateName}</strong>,</p>
      <p>This is a confirmation that you have withdrawn your application for the <strong>${opts.jobTitle}</strong> role at <strong>${opts.companyName}</strong>.</p>
      <p>You can discover and apply for other exciting opportunities anytime on JobStock.</p>
    `;

    const html = this.wrapInTemplate(
      'Application Withdrawn',
      content,
      { text: 'Explore New Jobs', url: `${frontendUrl}/jobs` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock" <${from}>`,
        to: opts.candidateEmail,
        subject: `Application Withdrawn: ${opts.jobTitle} at ${opts.companyName}`,
        html,
      });
    } catch (e) {
      this.logger.error('Failed to send application withdrawn email', e);
    }
  }

  async sendRecruiterMessageNotificationEmail(opts: {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    senderCompany?: string | null;
    messageSnippet: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`[EmailService] SMTP not configured. Could not send message notification to ${opts.recipientEmail}`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const senderDisplay = opts.senderCompany ? `${opts.senderName} from ${opts.senderCompany}` : opts.senderName;

    const content = `
      <p>Hi <strong>${opts.recipientName}</strong>,</p>
      <p><strong>${senderDisplay}</strong> sent you a new message on JobStock:</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #0b8260; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #2d3748;">
        "${opts.messageSnippet.length > 250 ? opts.messageSnippet.slice(0, 250) + '...' : opts.messageSnippet}"
      </div>
      <p style="color: #718096; font-size: 14px;">Prompt replies increase your recruiter response score. Reply to start the conversation.</p>
    `;

    const html = this.wrapInTemplate(
      `New Message from ${senderDisplay}`,
      content,
      { text: 'Open Messages & Reply', url: `${frontendUrl}/candidate-messages` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Messenger" <${from}>`,
        to: opts.recipientEmail,
        subject: `💬 New Message from ${senderDisplay}`,
        html,
      });
      this.logger.log(`Message notification email sent to ${opts.recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send message notification email to ${opts.recipientEmail}`, error);
    }
  }

  async sendSkillAssessmentResultEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    skillName: string;
    score: number;
    totalQuestions: number;
    passed: boolean;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`[EmailService] SMTP not configured. Could not send skill assessment email to ${opts.candidateEmail}`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const percentage = Math.round((opts.score / opts.totalQuestions) * 100);

    const content = `
      <p>Hi <strong>${opts.candidateName}</strong>,</p>
      <p>${opts.passed ? '🎉 Congratulations on passing your skill assessment!' : 'You have completed your skill assessment.'}</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #1a202c; font-size: 18px;">${opts.skillName} Assessment</h3>
        <div style="font-size: 32px; font-weight: 800; color: ${opts.passed ? '#0b8260' : '#d97706'}; margin-bottom: 6px;">
          ${opts.score} / ${opts.totalQuestions} (${percentage}%)
        </div>
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: ${opts.passed ? '#0b8260' : '#dc2626'};">
          ${opts.passed ? '✓ PASSED & VERIFIED' : 'NOT PASSED (Try again in 7 days)'}
        </p>
      </div>
      ${opts.passed ? '<p style="color: #4a5568; font-size: 14px;">This skill verification badge is now highlighted on your candidate profile to attract top employers.</p>' : '<p style="color: #718096; font-size: 14px;">Brush up on your skills and retake the assessment to boost your profile rating.</p>'}
    `;

    const html = this.wrapInTemplate(
      opts.passed ? `🎖️ Skill Certified: ${opts.skillName}` : `Assessment Result: ${opts.skillName}`,
      content,
      { text: 'View Skills in Dashboard', url: `${frontendUrl}/candidate-skill-assessment` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Assessments" <${from}>`,
        to: opts.candidateEmail,
        subject: `Skill Assessment Result: ${opts.skillName} (${percentage}%)`,
        html,
      });
      this.logger.log(`Skill assessment result email sent to ${opts.candidateEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send skill assessment email to ${opts.candidateEmail}`, error);
    }
  }

  async sendMockInterviewReportEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    jobRole: string;
    overallRating: number;
    overallSummary: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`[EmailService] SMTP not configured. Could not send mock interview email to ${opts.candidateEmail}`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const stars = '★'.repeat(opts.overallRating) + '☆'.repeat(5 - opts.overallRating);

    const content = `
      <p>Hi <strong>${opts.candidateName}</strong>,</p>
      <p>Your AI Mock Interview for <strong>${opts.jobRole}</strong> has been evaluated!</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 6px 0; color: #1a202c; font-size: 16px;">Target Role: ${opts.jobRole}</h3>
        <div style="color: #f59e0b; font-size: 24px; letter-spacing: 2px; margin-bottom: 12px;">${stars} <span style="font-size: 15px; color: #4a5568; font-weight: bold;">(${opts.overallRating}/5 Rating)</span></div>
        <h4 style="margin: 12px 0 6px 0; font-size: 14px; color: #2d3748;">Key Feedback & Suggestions:</h4>
        <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.5;">${opts.overallSummary}</p>
      </div>
      <p style="color: #718096; font-size: 14px;">Review per-question feedback and expert suggestions in your dashboard to ace your next real interview.</p>
    `;

    const html = this.wrapInTemplate(
      '📊 Your AI Mock Interview Feedback is Ready',
      content,
      { text: 'View Full Interview Analysis', url: `${frontendUrl}/candidate-mock-interview` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock AI Coach" <${from}>`,
        to: opts.candidateEmail,
        subject: `📊 Mock Interview Feedback: ${opts.jobRole} (${opts.overallRating}/5)`,
        html,
      });
      this.logger.log(`Mock interview report email sent to ${opts.candidateEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send mock interview report email to ${opts.candidateEmail}`, error);
    }
  }

  async sendJobAlertCreatedEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    keyword?: string | null;
    category?: string | null;
    location?: string | null;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const content = `
      <p>Hi <strong>${opts.candidateName}</strong>,</p>
      <p>Your new job alert has been successfully configured! We will notify you whenever fresh matching openings are posted.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #0b8260; padding: 14px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        ${opts.keyword ? `<p style="margin: 0 0 4px 0; font-size: 14px;">🔍 <strong>Keywords:</strong> ${opts.keyword}</p>` : ''}
        ${opts.category ? `<p style="margin: 0 0 4px 0; font-size: 14px;">📁 <strong>Category:</strong> ${opts.category}</p>` : ''}
        ${opts.location ? `<p style="margin: 0; font-size: 14px;">📍 <strong>Location:</strong> ${opts.location}</p>` : ''}
      </div>
    `;

    const html = this.wrapInTemplate(
      '🔔 Job Alert Created',
      content,
      { text: 'Manage Job Alerts', url: `${frontendUrl}/candidate-alert-job` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Alerts" <${from}>`,
        to: opts.candidateEmail,
        subject: `🔔 Job Alert Active: ${opts.keyword || opts.category || 'Matching Jobs'}`,
        html,
      });
    } catch (e) {
      this.logger.error('Failed to send job alert creation email', e);
    }
  }

  async sendProfileViewedEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    companyName: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const content = `
      <p>Hi <strong>${opts.candidateName}</strong>,</p>
      <p>A recruiter from <strong>${opts.companyName}</strong> just viewed your profile on JobStock! 👁️</p>
      <p style="color: #4a5568; font-size: 14px;">Recruiters are actively searching for candidates matching your skill set. Make sure your resume and projects are up-to-date to maximize your chances.</p>
    `;

    const html = this.wrapInTemplate(
      `Recruiter Action: ${opts.companyName} viewed your profile`,
      content,
      { text: 'Boost Profile & View Jobs', url: `${frontendUrl}/candidate-profile` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Activity" <${from}>`,
        to: opts.candidateEmail,
        subject: `👁️ Recruiter Action: ${opts.companyName} viewed your profile`,
        html,
      });
    } catch (e) {
      this.logger.error('Failed to send profile viewed email', e);
    }
  }


  async sendNewJobFollowerEmail(opts: {
    candidateEmail: string;
    candidateName: string;
    companyName: string;
    companyEmail?: string;
    jobTitle: string;
    jobLocation?: string;
    jobType?: string;
    salary?: string;
    jobSlug: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const content = `
      <p>Hi <strong>${opts.candidateName}</strong>,</p>
      <p><strong>${opts.companyName}</strong>, a company you follow on JobStock, just posted an exciting new job opportunity! 🚀</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #0b8260; padding: 14px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1a202c; font-size: 16px;">💼 ${opts.jobTitle}</h4>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #4a5568;">🏢 <strong>Company:</strong> ${opts.companyName}</p>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #4a5568;">📍 <strong>Location:</strong> ${opts.jobLocation || 'Remote / Unspecified'}</p>
        ${opts.jobType ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #4a5568;">⏰ <strong>Job Type:</strong> ${opts.jobType.replace(/_/g, ' ')}</p>` : ''}
        ${opts.salary ? `<p style="margin: 0; font-size: 14px; color: #4a5568;">💰 <strong>Salary:</strong> ${opts.salary}</p>` : ''}
      </div>
      <p style="color: #4a5568; font-size: 14px;">As a follower, you are among the first to be notified. Be an early applicant to increase your chances of being shortlisted!</p>
    `;

    const html = this.wrapInTemplate(
      `New Job Opening at ${opts.companyName}`,
      content,
      { text: 'View & Quick Apply Now', url: `${frontendUrl}/job-detail/${opts.jobSlug}` }
    );

    try {
      await transporter.sendMail({
        from: opts.companyEmail ? `"${opts.companyName} via JobStock" <${from}>` : `"JobStock Updates" <${from}>`,
        replyTo: opts.companyEmail || from,
        to: opts.candidateEmail,
        subject: `🚀 New Job Opening from ${opts.companyName}: ${opts.jobTitle}`,
        html,
      });
      this.logger.log(`Follower new job email sent to ${opts.candidateEmail} for job: ${opts.jobTitle}`);
    } catch (e) {
      this.logger.error(`Failed to send new job follower email to ${opts.candidateEmail}`, e);
    }
  }


  async sendNewJobNotification(email: string, jobTitle: string, companyName: string, location: string, jobSlug: string) {
    if (!this.transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    
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

  // ADMIN DASHBOARD EMAIL TRIGGERS
  // =========================================================================

  async sendJobModerationStatus(opts: { email: string; jobTitle: string; companyName: string; status: 'APPROVED' | 'REJECTED' }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    let subject = 'Job Moderation Update';
    let message = '';
    
    if (opts.status === 'APPROVED') {
      subject = '✅ Your Job is Approved & Live';
      message = `
        <p>Good news! Your job listing for <strong>${opts.jobTitle}</strong> has been approved.</p>
        <p>It is now live on JobStock and visible to candidates.</p>
      `;
    } else {
      subject = '⚠️ Job Listing Rejected';
      message = `
        <p>Unfortunately, your job listing for <strong>${opts.jobTitle}</strong> was rejected by our moderation team.</p>
        <p>Please review our posting guidelines and contact support if you have questions.</p>
      `;
    }

    const html = this.wrapInTemplate(
      'Job Moderation Status',
      message,
      opts.status === 'APPROVED' ? { text: 'View Job', url: `${frontendUrl}/employer-manage-jobs` } : undefined
    );

    try {
      await transporter.sendMail({ from: `"JobStock Admin" <${from}>`, to: opts.email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send job moderation status', e);
    }
  }

  async sendSupportTicketUpdate(opts: { email: string; subject: string; snippet: string; status?: string; ticketId?: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    const html = this.wrapInTemplate(
      'Support Ticket Update',
      `<p>Your support ticket <strong>"${opts.subject}"</strong> has a new update.</p>
       <div style="padding: 10px; background: #f8fafc; border-left: 4px solid #0b8260; font-style: italic;">"${opts.snippet}"</div>
       <p><strong>Current Status:</strong> ${opts.status || 'Updated'}</p>`,
      { text: 'View Ticket', url: `${frontendUrl}/candidate-support` }
    );

    try {
      await transporter.sendMail({ from: `"JobStock Support" <${from}>`, to: opts.email, subject: `Update on: ${opts.subject}`, html });
    } catch (e) {
      this.logger.error('Failed to send support ticket update', e);
    }
  }

  async sendPackageAssignmentConfirmation(opts: { email: string; companyName?: string; planName?: string; packageName?: string; quota: number; unlocks: number }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    
    const pName = opts.planName || opts.packageName || 'Premium';
    
    const html = this.wrapInTemplate(
      'Premium Package Activated',
      `<p>Hi <strong>${opts.companyName || 'Employer'}</strong>,</p>
       <p>An admin has successfully activated your <strong>${pName}</strong> package.</p>
       <ul>
         <li>Job Posts Quota: <strong>${opts.quota}</strong></li>
         <li>Candidate Contact Unlocks: <strong>${opts.unlocks}</strong></li>
       </ul>
       <p>Enjoy your premium features!</p>`
    );

    try {
      await transporter.sendMail({ from: `"JobStock Admin" <${from}>`, to: opts.email, subject: `Package Activated: ${pName}`, html });
    } catch (e) {
      this.logger.error('Failed to send package assignment email', e);
    }
  }

  async sendAdminTeamInvitation(opts: { email: string; role: string; tempPass: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    const html = this.wrapInTemplate(
      'Admin Invitation',
      `<p>You have been invited to join the JobStock Admin Team.</p>
       <p><strong>Role:</strong> ${opts.role}</p>
       <p><strong>Temporary Password:</strong> ${opts.tempPass}</p>
       <p>Please log in and change your password immediately.</p>`,
      { text: 'Admin Login', url: `${frontendUrl}/login` }
    );

    try {
      await transporter.sendMail({ from: `"JobStock Admin" <${from}>`, to: opts.email, subject: `Invitation to JobStock Admin Team`, html });
    } catch (e) {
      this.logger.error('Failed to send admin invite', e);
    }
  }

  async sendProctoringNotice(opts: { email: string; testName: string; decision: string; instructions: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const html = this.wrapInTemplate(
      'Proctoring Notice',
      `<p>Your recent assessment for <strong>${opts.testName}</strong> has been reviewed by our proctoring team.</p>
       <p><strong>Decision:</strong> ${opts.decision}</p>
       <p>${opts.instructions}</p>`
    );

    try {
      await transporter.sendMail({ from: `"JobStock Proctoring" <${from}>`, to: opts.email, subject: `Proctoring Notice: ${opts.testName}`, html });
    } catch (e) {
      this.logger.error('Failed to send proctoring notice', e);
    }
  }

  async sendAdminAlert(opts: { type: string; details: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const adminEmail = process.env.EMAIL_USERNAME || process.env.SMTP_USER;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    if (!adminEmail) return;

    const html = this.wrapInTemplate(
      'System Alert',
      `<p><strong>Alert Type:</strong> ${opts.type}</p>
       <div style="padding: 10px; background: #fee2e2; color: #991b1b; border-radius: 4px;">${opts.details}</div>`
    );

    try {
      await transporter.sendMail({ from: `"JobStock System" <${from}>`, to: adminEmail, subject: `[ALERT] ${opts.type}`, html });
    } catch (e) {
      this.logger.error('Failed to send admin alert', e);
    }
  }

  async sendNewEmployerAlert(opts: { employerName: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const adminEmail = process.env.EMAIL_USERNAME || process.env.SMTP_USER;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    if (!adminEmail) return;

    const html = this.wrapInTemplate(
      '🚀 New Employer Registration',
      `<p style="font-size: 16px; color: #333;"><strong>🎉 Congratulations!</strong> You have a brand new employer registration on your platform.</p>
       <div style="padding: 18px; background-color: #f0fdf4; border-radius: 8px; border-left: 5px solid #0b8260; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
         <p style="margin: 0 0 10px 0; font-size: 16px; color: #166534;">🏢 <strong>${opts.employerName}</strong> has just signed up!</p>
         <p style="margin: 0 0 10px 0; color: #15803d; font-size: 14px;">✅ They are currently waiting for admin verification.</p>
         <p style="margin: 0; color: #15803d; font-size: 14px;">🔍 Please review their profile to unlock their ability to post jobs.</p>
       </div>
       <p style="color: #666; font-size: 14px;">Keep up the great work! 🌟</p>`,
      { text: '👉 Review Employer Now', url: `${process.env.FRONTEND_URL || 'https://www.jobstock.com'}/admin-employers` }
    );

    try {
      const subjectLine = "\uD83C\uDF89 New Employer: " + opts.employerName;
      await transporter.sendMail({ from: `"JobStock Admin" <${from}>`, to: adminEmail, subject: subjectLine, html });
    } catch (e) {
      this.logger.error('Failed to send admin employer alert', e);
    }
  }

  async sendNewPackageNotification(opts: { email: string; companyName: string; packageName: string; priceInPaisa: number; duration: number; durationType: string; features: string[] }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    const price = opts.priceInPaisa > 0 ? `₹${(opts.priceInPaisa / 100).toFixed(2)}` : 'FREE';
    const featuresList = opts.features.map(f => `<li style="margin-bottom: 5px;">✅ ${f}</li>`).join('');

    const html = this.wrapInTemplate(
      '🚀 New Employer Package Available!',
      `<p style="font-size: 16px; color: #333;">Hi <strong>${opts.companyName}</strong>, 👋</p>
       <p style="font-size: 15px; color: #333;">We've just rolled out a brand new package to help you hire top talent faster! 🎉</p>
       
       <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 5px solid #0b8260; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
         <h3 style="margin: 0 0 15px 0; color: #0b8260; font-size: 18px;">💎 ${opts.packageName}</h3>
         <p style="margin: 0 0 10px 0; font-size: 15px; color: #333;"><strong>💰 Price:</strong> ${price}</p>
         <p style="margin: 0 0 15px 0; font-size: 15px; color: #333;"><strong>⏱️ Duration:</strong> ${opts.duration} ${opts.durationType}</p>
         
         <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">✨ Key Features Included:</p>
         <ul style="margin: 0; padding-left: 20px; color: #444; font-size: 14px;">
           ${featuresList}
         </ul>
       </div>
       
       <p style="color: #555; font-size: 15px;">Upgrade your plan today and start connecting with amazing candidates! 🌟</p>`,
      { text: '👉 View Packages', url: `${frontendUrl}/employer-packages` }
    );

    try {
      await transporter.sendMail({ from: `"JobStock" <${from}>`, to: opts.email, subject: `🔥 New Premium Package: ${opts.packageName}`, html });
    } catch (e) {
      this.logger.error('Failed to send new package notification', e);
    }
  }

  async sendNewCandidatePackageNotification(opts: { email: string; candidateName: string; packageName: string; priceInPaisa: number; duration: number; durationType: string; features: string[] }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    const price = opts.priceInPaisa > 0 ? `₹${(opts.priceInPaisa / 100).toFixed(2)}` : 'FREE';
    const featuresList = opts.features.map(f => `<li style="margin-bottom: 5px;">✅ ${f}</li>`).join('');

    const html = this.wrapInTemplate(
      '🚀 New Resume Package Available!',
      `<p style="font-size: 16px; color: #333;">Hi <strong>${opts.candidateName}</strong>, 👋</p>
       <p style="font-size: 15px; color: #333;">We've just rolled out a brand new package to help you stand out to recruiters and land your dream job faster! 🎉</p>
       
       <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 5px solid #0b8260; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
         <h3 style="margin: 0 0 15px 0; color: #0b8260; font-size: 18px;">💎 ${opts.packageName}</h3>
         <p style="margin: 0 0 10px 0; font-size: 15px; color: #333;"><strong>💰 Price:</strong> ${price}</p>
         <p style="margin: 0 0 15px 0; font-size: 15px; color: #333;"><strong>⏱️ Duration:</strong> ${opts.duration} ${opts.durationType}</p>
         
         <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">✨ Key Features Included:</p>
         <ul style="margin: 0; padding-left: 20px; color: #444; font-size: 14px;">
           ${featuresList}
         </ul>
       </div>
       
       <p style="color: #555; font-size: 15px;">Upgrade your plan today to give your resume the spotlight it deserves! 🌟</p>`,
      { text: '👉 View Resume Packages', url: `${frontendUrl}/candidate-resume-packages` }
    );

    try {
      await transporter.sendMail({ from: `"JobStock" <${from}>`, to: opts.email, subject: `🔥 New Resume Package: ${opts.packageName}`, html });
    } catch (e) {
      this.logger.error('Failed to send new candidate package notification', e);
    }
  }

  async sendFollowRequestEmail(opts: {
    toEmail: string;
    recipientName: string;
    requesterName: string;
    requesterHeadline?: string | null;
    requesterProfileUrl: string;
    dashboardRequestsUrl: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const content = `
      <p style="font-size: 16px; color: #333;">Hi <strong>${opts.recipientName}</strong>, 👋</p>
      <p style="font-size: 15px; color: #333;"><strong>${opts.requesterName}</strong> (${opts.requesterHeadline || 'Candidate on JobStock'}) has sent you a connection / follow request!</p>
      
      <div style="padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #0b8260; margin: 20px 0;">
        <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #1a202c;">🤝 Expand your professional network</p>
        <p style="margin: 0; font-size: 14px; color: #4a5568;">Accepting this request allows you to connect, view each other's career updates, and collaborate.</p>
      </div>
      
      <p style="font-size: 14px; color: #555;">You can accept or decline this request directly from your candidate dashboard.</p>
    `;

    const html = this.wrapInTemplate(
      `🤝 New Follow Request from ${opts.requesterName}`,
      content,
      { text: '👉 Review & Accept Request', url: opts.dashboardRequestsUrl }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Network" <${from}>`,
        to: opts.toEmail,
        subject: `🤝 ${opts.requesterName} sent you a follow request on JobStock`,
        html,
      });
      this.logger.log(`Follow request email sent to ${opts.toEmail} from ${opts.requesterName}`);
    } catch (e) {
      this.logger.error(`Failed to send follow request email to ${opts.toEmail}`, e);
    }
  }

  async sendFollowAcceptedEmail(opts: {
    toEmail: string;
    recipientName: string;
    acceptorName: string;
    acceptorProfileUrl: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const content = `
      <p style="font-size: 16px; color: #333;">Hi <strong>${opts.recipientName}</strong>, 👋</p>
      <p style="font-size: 15px; color: #333;">Great news! <strong>${opts.acceptorName}</strong> accepted your follow request on JobStock. 🎉</p>
      
      <div style="padding: 16px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #15803d; font-weight: bold;">🎉 You are now connected with ${opts.acceptorName}!</p>
      </div>
      
      <p style="font-size: 14px; color: #555;">You can now view each other's activity, profiles, and stay in touch.</p>
    `;

    const html = this.wrapInTemplate(
      `🎉 ${opts.acceptorName} accepted your follow request!`,
      content,
      { text: '👉 View Connected Profile', url: opts.acceptorProfileUrl }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Network" <${from}>`,
        to: opts.toEmail,
        subject: `🎉 ${opts.acceptorName} accepted your follow request on JobStock`,
        html,
      });
      this.logger.log(`Follow accepted email sent to ${opts.toEmail} for ${opts.acceptorName}`);
    } catch (e) {
      this.logger.error(`Failed to send follow accepted email to ${opts.toEmail}`, e);
    }
  }

  async sendFollowRejectedEmail(opts: {
    toEmail: string;
    recipientName: string;
    rejectorName: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const content = `
      <p style="font-size: 16px; color: #333;">Hi <strong>${opts.recipientName}</strong>,</p>
      <p style="font-size: 15px; color: #333;">Your follow request to <strong>${opts.rejectorName}</strong> was not accepted at this time.</p>
      <p style="font-size: 14px; color: #555;">Don't worry, there are thousands of other candidates and companies to connect with on JobStock!</p>
    `;

    const html = this.wrapInTemplate(
      `Update on your follow request on JobStock`,
      content,
      { text: '👉 Explore More Candidates', url: `${frontendUrl}/candidates` }
    );

    try {
      await transporter.sendMail({
        from: `"JobStock Network" <${from}>`,
        to: opts.toEmail,
        subject: `Update on your connection request on JobStock`,
        html,
      });
      this.logger.log(`Follow rejected email sent to ${opts.toEmail}`);
    } catch (e) {
      this.logger.error(`Failed to send follow rejected email to ${opts.toEmail}`, e);
    }
  }
}
