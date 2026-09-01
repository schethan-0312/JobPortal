const fs = require('fs');
let content = fs.readFileSync('src/email/email.service.ts', 'utf8');

const newFunc = \
  async sendEmployerReopened(email: string, companyName: string) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    const html = this.wrapInTemplate(
      '?? Account Reopened',
      \\\<p style="font-size: 16px; color: #333;">Great news! Your company <strong>\</strong> has been <strong>successfully reopened</strong> by our admin team! ??</p>
       <p style="font-size: 15px; color: #333;">Your suspension has been lifted, and you once again have full access to your employer dashboard.</p>
       <div style="padding: 20px; background-color: #f0fdf4; border-radius: 8px; border-left: 5px solid #0b8260; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
         <p style="margin: 0; font-size: 15px; color: #166534;">? <strong>You can now resume posting jobs, viewing candidates, and managing your account!</strong></p>
       </div>
       <p style="color: #555; font-size: 15px;">Welcome back to JobStock! ??</p>\\\,
      { text: '?? Go to Dashboard', url: \\\\/employer-dashboard\\\ }
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock Admin" <\>\\\, to: email, subject: '?? Your Company Account is Reopened!', html });
    } catch (e) {
      this.logger.error('Failed to send reopened email', e);
    }
  }
\;

content = content.replace('async sendEmployerVerificationStatus', newFunc + '\\n  async sendEmployerVerificationStatus');
fs.writeFileSync('src/email/email.service.ts', content);
