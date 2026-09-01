const fs = require('fs');

const path = 'src/email/email.service.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /async sendEmployerVerificationStatus\[\\s\\S\]*?catch \\(e\\) \\{\\s*this\\.logger\\.error\\('Failed to send employer verification email', e\\);\\s*\\}\\s*\\}/;

const newBlock = \sync sendEmployerVerificationStatus(email: string, companyName: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const adminEmail = process.env.EMAIL_USERNAME || process.env.SMTP_USER || 'support@jobstock.com';
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    let subject = 'Employer Verification Update';
    let title = 'JobStock Employer Update';
    let message = '';

    if (status === 'VERIFIED') {
      subject = '\\uD83C\\uDF89 Your Company is Verified!';
      title = '\\u2705 Verification Successful';
      message = \\\
        <p style="font-size: 15px; color: #333;">Great news! Your company <strong>\</strong> has been successfully verified by our admin team.</p>
        <p style="font-size: 15px; color: #333;">You now have full access to your employer dashboard and can start posting jobs immediately. Welcome aboard! \\uD83D\\uDE80</p>
      \\\;
    } else if (status === 'REJECTED') {
      subject = '\\u274C Verification Rejected';
      title = '\\u26A0\\uFE0F Verification Rejected';
      message = \\\
        <p style="font-size: 15px; color: #333;">Unfortunately, the verification request for your company <strong>\</strong> was rejected by our admin team.</p>
        <p style="font-size: 15px; color: #333;">This could be due to missing documentation, invalid details, or policy violations. \\uD83D\\uDED1</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Need help?</strong> Please contact our admin team for further information and guidance on how to resolve this at: <br/>
        <a href="mailto:\" style="color: #0b8260; font-weight: bold;">\</a> \\uD83D\\uDCE7</p>
      \\\;
    } else if (status === 'SUSPENDED') {
      subject = '\\uD83D\\uDEAB Account Suspended';
      title = '\\uD83D\\uDEA8 Account Suspended';
      message = \\\
        <p style="font-size: 15px; color: #333;">Your employer account for <strong>\</strong> has been suspended.</p>
        <p style="font-size: 15px; color: #333;">You will not be able to post jobs or access premium features during this time. \\u26D4</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Next steps:</strong> Please contact our admin team for further information regarding your suspension at: <br/>
        <a href="mailto:\" style="color: #0b8260; font-weight: bold;">\</a> \\uD83D\\uDCE7</p>
      \\\;
    }

    const html = this.wrapInTemplate(
      title,
      message,
      status === 'VERIFIED' ? { text: 'Go to Dashboard', url: \\\\/employer-dashboard\\\ } : undefined
    );

    try {
      await transporter.sendMail({ from: \\\"JobStock Admin" <\>\\\, to: email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send employer verification email', e);
    }
  }\;

const match = content.match(/async sendEmployerVerificationStatus[\\s\\S]*?catch \\(e\\) {\\s*this\\.logger\\.error\\('Failed to send employer verification email', e\\);\\s*}\\s*}/);
if (match) {
  content = content.replace(match[0], newBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed verification email!');
} else {
  console.log('Match not found!');
}
