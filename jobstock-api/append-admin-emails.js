const fs = require('fs');

let content = fs.readFileSync('src/email/email.service.ts', 'utf8');
content = content.replace(/}\\s*$/, ''); // remove last brace

const adminEmails = \
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
      subject = '? Your Job is Approved & Live';
      message = \\\
        <p>Good news! Your job listing for <strong>\</strong> has been approved.</p>
        <p>It is now live on JobStock and visible to candidates.</p>
      \\\;
    } else {
      subject = '?? Job Listing Rejected';
      message = \\\
        <p>Unfortunately, your job listing for <strong>\</strong> was rejected by our moderation team.</p>
        <p>Please review our posting guidelines and contact support if you have questions.</p>
      \\\;
    }

    const html = this.wrapInTemplate(
      'Job Moderation Status',
      message,
      opts.status === 'APPROVED' ? { text: 'View Job', url: \\\\/employer-manage-jobs\\\ } : undefined
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock Admin" <\>\\\, to: opts.email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send job moderation status', e);
    }
  }

  async sendSupportTicketUpdate(opts: { email: string; subject: string; snippet: string; status: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    const html = this.wrapInTemplate(
      'Support Ticket Update',
      \\\<p>Your support ticket <strong>"\"</strong> has a new update.</p>
       <div style="padding: 10px; background: #f8fafc; border-left: 4px solid #0b8260; font-style: italic;">"\"</div>
       <p><strong>Current Status:</strong> \</p>\\\,
      { text: 'View Ticket', url: \\\\/candidate-support\\\ }
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock Support" <\>\\\, to: opts.email, subject: \\\Update on: \\\\, html });
    } catch (e) {
      this.logger.error('Failed to send support ticket update', e);
    }
  }

  async sendPackageAssignmentConfirmation(opts: { email: string; companyName: string; packageName: string; quota: number; unlocks: number }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    
    const html = this.wrapInTemplate(
      'Premium Package Activated',
      \\\<p>Hi <strong>\</strong>,</p>
       <p>An admin has successfully activated your <strong>\</strong> package.</p>
       <ul>
         <li>Job Posts Quota: <strong>\</strong></li>
         <li>Candidate Contact Unlocks: <strong>\</strong></li>
       </ul>
       <p>Enjoy your premium features!</p>\\\
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock Admin" <\>\\\, to: opts.email, subject: \\\Package Activated: \\\\, html });
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
      \\\<p>You have been invited to join the JobStock Admin Team.</p>
       <p><strong>Role:</strong> \</p>
       <p><strong>Temporary Password:</strong> \</p>
       <p>Please log in and change your password immediately.</p>\\\,
      { text: 'Admin Login', url: \\\\/login\\\ }
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock Admin" <\>\\\, to: opts.email, subject: \\\Invitation to JobStock Admin Team\\\, html });
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
      \\\<p>Your recent assessment for <strong>\</strong> has been reviewed by our proctoring team.</p>
       <p><strong>Decision:</strong> \</p>
       <p>\</p>\\\
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock Proctoring" <\>\\\, to: opts.email, subject: \\\Proctoring Notice: \\\\, html });
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
      \\\<p><strong>Alert Type:</strong> \</p>
       <div style="padding: 10px; background: #fee2e2; color: #991b1b; border-radius: 4px;">\</div>\\\
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock System" <\>\\\, to: adminEmail, subject: \\\[ALERT] \\\\, html });
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
      '?? New Employer Registration',
      \\\<p style="font-size: 16px; color: #333;"><strong>?? Congratulations!</strong> You have a brand new employer registration on your platform.</p>
       <div style="padding: 18px; background-color: #f0fdf4; border-radius: 8px; border-left: 5px solid #0b8260; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
         <p style="margin: 0 0 10px 0; font-size: 16px; color: #166534;">?? <strong>\</strong> has just signed up!</p>
         <p style="margin: 0 0 10px 0; color: #15803d; font-size: 14px;">? They are currently waiting for admin verification.</p>
         <p style="margin: 0; color: #15803d; font-size: 14px;">?? Please review their profile to unlock their ability to post jobs.</p>
       </div>
       <p style="color: #666; font-size: 14px;">Keep up the great work! ??</p>\\\,
      { text: '?? Review Employer Now', url: \\\\/admin-employers\\\ }
    );

    try {
      const subjectLine = "\\uD83C\\uDF89 New Employer: " + opts.employerName;
      await transporter.sendMail({ from: \\\"JobStock Admin" <\>\\\, to: adminEmail, subject: subjectLine, html });
    } catch (e) {
      this.logger.error('Failed to send admin employer alert', e);
    }
  }
}
\;

fs.writeFileSync('src/email/email.service.ts', content + adminEmails, 'utf8');

// Replace localhost again in the old wrapInTemplate
let content2 = fs.readFileSync('src/email/email.service.ts', 'utf8');
content2 = content2.replace(/http:\/\/localhost:3000/g, 'https://www.jobstock.com');
fs.writeFileSync('src/email/email.service.ts', content2, 'utf8');

console.log('Restored all admin emails!');
