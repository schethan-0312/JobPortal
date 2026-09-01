const fs = require('fs');

const path = 'src/email/email.service.ts';
let content = fs.readFileSync(path, 'utf8');

const replacement = \sync sendEmployerVerificationStatus(email: string, companyName: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    const adminEmail = process.env.EMAIL_USERNAME || process.env.SMTP_USER || 'support@jobstock.com';
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';

    let subject = 'Employer Verification Update';
    let title = 'JobStock Employer Update';
    let message = '';

    if (status === 'VERIFIED') {
      subject = '?? Your Company is Verified!';
      title = '? Verification Successful';
      message = \\\
        <p style="font-size: 15px; color: #333;">Great news! Your company <strong>\</strong> has been successfully verified by our admin team.</p>
        <p style="font-size: 15px; color: #333;">You now have full access to your employer dashboard and can start posting jobs immediately. Welcome aboard! ??</p>
      \\\;
    } else if (status === 'REJECTED') {
      subject = '? Verification Rejected';
      title = '?? Verification Rejected';
      message = \\\
        <p style="font-size: 15px; color: #333;">Unfortunately, the verification request for your company <strong>\</strong> was rejected by our admin team.</p>
        <p style="font-size: 15px; color: #333;">This could be due to missing documentation, invalid details, or policy violations. ??</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Need help?</strong> Please contact our admin team for further information and guidance on how to resolve this at: <br/>
        <a href="mailto:\" style="color: #0b8260; font-weight: bold;">\</a> ??</p>
      \\\;
    } else if (status === 'SUSPENDED') {
      subject = '?? Account Suspended';
      title = '?? Account Suspended';
      message = \\\
        <p style="font-size: 15px; color: #333;">Your employer account for <strong>\</strong> has been suspended.</p>
        <p style="font-size: 15px; color: #333;">You will not be able to post jobs or access premium features during this time. ?</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Next steps:</strong> Please contact our admin team for further information regarding your suspension at: <br/>
        <a href="mailto:\" style="color: #0b8260; font-weight: bold;">\</a> ??</p>
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

content = content.replace(/async sendEmployerVerificationStatus[\\s\\S]*?catch \\(e\\) {\\s*this\\.logger\\.error\\('Failed to send employer verification email', e\\);\\s*}\\s*}/, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed verification email!');
