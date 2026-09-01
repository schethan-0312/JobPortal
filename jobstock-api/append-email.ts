import * as fs from 'fs';
import * as path from 'path';

const emailServicePath = path.join(process.cwd(), 'src/email/email.service.ts');
let content = fs.readFileSync(emailServicePath, 'utf8');

if (content.includes('sendJobModerationStatus')) {
  console.log('Already appended');
  process.exit(0);
}

content = content.trim().replace(/}\s*$/, '');

const newMethods = `
  // =========================================================================
  // ADMIN DASHBOARD EMAIL TRIGGERS
  // =========================================================================

  async sendJobModerationStatus(opts: { email: string; jobTitle: string; companyName: string; status: 'APPROVED' | 'REJECTED' }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const subject = opts.status === 'APPROVED' 
      ? \`Job Approved: \${opts.jobTitle}\` 
      : \`Action Required: Job Rejected (\${opts.jobTitle})\`;

    const body = opts.status === 'APPROVED'
      ? \`<p>Great news! Your job listing for <strong>\${opts.jobTitle}</strong> has been approved and is now live.</p>\`
      : \`<p>Your job listing for <strong>\${opts.jobTitle}</strong> was reviewed and unfortunately rejected because it doesn't meet our guidelines. Please review and update your listing.</p>\`;

    const html = this.wrapInTemplate(
      opts.status === 'APPROVED' ? 'Job Approved' : 'Job Rejected',
      body,
      { text: 'Go to Dashboard', url: \`\${frontendUrl}/employer-manage-job\` }
    );

    try {
      await transporter.sendMail({ from: \`"JobStock Admin" <\${from}>\`, to: opts.email, subject, html });
      this.logger.log(\`Job moderation email sent to \${opts.email} (\${opts.status})\`);
    } catch (e) {
      this.logger.error(\`Failed to send job moderation email\`, e);
    }
  }

  async sendSupportTicketUpdate(opts: { email: string; ticketId: string; subject: string; snippet: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = this.wrapInTemplate(
      'Support Ticket Update',
      \`<p>An admin has updated your support ticket (<strong>#\${opts.ticketId.slice(0, 8)}: \${opts.subject}</strong>).</p>
       <div style="background-color: #f8fafc; border-left: 4px solid #0b8260; padding: 16px; margin: 20px 0; font-style: italic;">
         "\${opts.snippet}"
       </div>\`,
      { text: 'View Ticket', url: \`\${frontendUrl}\` }
    );

    try {
      await transporter.sendMail({ from: \`"JobStock Support" <\${from}>\`, to: opts.email, subject: \`Ticket Update: \${opts.subject}\`, html });
      this.logger.log(\`Support ticket update sent to \${opts.email}\`);
    } catch (e) {
      this.logger.error(\`Failed to send ticket update email\`, e);
    }
  }

  async sendPackageAssignmentConfirmation(opts: { email: string; planName: string; quota: number; unlocks: number }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = this.wrapInTemplate(
      'Package Activated',
      \`<p>An administrator has manually activated or renewed your premium package.</p>
       <p><strong>Plan:</strong> \${opts.planName}</p>
       <p><strong>Job Quota:</strong> \${opts.quota}</p>
       <p><strong>Contact Unlocks:</strong> \${opts.unlocks}</p>\`,
      { text: 'View Subscription', url: \`\${frontendUrl}/employer-packages\` }
    );

    try {
      await transporter.sendMail({ from: \`"JobStock Billing" <\${from}>\`, to: opts.email, subject: \`Package Activated: \${opts.planName}\`, html });
    } catch (e) {
      this.logger.error(\`Failed to send package assignment email\`, e);
    }
  }

  async sendAdminTeamInvitation(opts: { email: string; role: string; tempPass: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = this.wrapInTemplate(
      'Admin Invitation',
      \`<p>You have been invited to join the JobStock Admin Team.</p>
       <p><strong>Role:</strong> \${opts.role}</p>
       <p><strong>Temporary Password:</strong> \${opts.tempPass}</p>
       <p>Please log in and change your password immediately.</p>\`,
      { text: 'Admin Login', url: \`\${frontendUrl}/login\` }
    );

    try {
      await transporter.sendMail({ from: \`"JobStock Admin" <\${from}>\`, to: opts.email, subject: \`Invitation to JobStock Admin Team\`, html });
    } catch (e) {
      this.logger.error(\`Failed to send admin invite\`, e);
    }
  }

  async sendProctoringNotice(opts: { email: string; testName: string; decision: string; instructions: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();

    const html = this.wrapInTemplate(
      'Proctoring Notice',
      \`<p>Your recent assessment for <strong>\${opts.testName}</strong> has been reviewed by our proctoring team.</p>
       <p><strong>Decision:</strong> \${opts.decision}</p>
       <p>\${opts.instructions}</p>\`
    );

    try {
      await transporter.sendMail({ from: \`"JobStock Proctoring" <\${from}>\`, to: opts.email, subject: \`Proctoring Notice: \${opts.testName}\`, html });
    } catch (e) {
      this.logger.error(\`Failed to send proctoring notice\`, e);
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
      \`<p><strong>Alert Type:</strong> \${opts.type}</p>
       <div style="padding: 10px; background: #fee2e2; color: #991b1b; border-radius: 4px;">\${opts.details}</div>\`
    );

    try {
      await transporter.sendMail({ from: \`"JobStock System" <\${from}>\`, to: adminEmail, subject: \`[ALERT] \${opts.type}\`, html });
    } catch (e) {
      this.logger.error(\`Failed to send admin alert\`, e);
    }
  }
}
`;

fs.writeFileSync(emailServicePath, content + '\n' + newMethods, 'utf8');
console.log('Appended methods to email.service.ts');
