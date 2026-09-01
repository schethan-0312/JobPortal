import * as fs from 'fs';

const path = 'src/email/email.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace sendEmployerVerificationStatus
const verifyRegex = /async sendEmployerVerificationStatus\[\\s\\S]*?catch \\(e\\) \\{\\s*this\\.logger\\.error\\('Failed to send employer verification email', e\\);\\s*}\\s*}/;

const newVerify = `async sendEmployerVerificationStatus(email: string, companyName: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
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
      message = \\`
        <p style="font-size: 15px; color: #333;">Great news! Your company <strong>\${companyName}</strong> has been successfully verified by our admin team.</p>
        <p style="font-size: 15px; color: #333;">You now have full access to your employer dashboard and can start posting jobs immediately. Welcome aboard! \\uD83D\\uDE80</p>
      \\`;
    } else if (status === 'REJECTED') {
      subject = '\\u274C Verification Rejected';
      title = '\\u26A0\\uFE0F Verification Rejected';
      message = \\`
        <p style="font-size: 15px; color: #333;">Unfortunately, the verification request for your company <strong>\${companyName}</strong> was rejected by our admin team.</p>
        <p style="font-size: 15px; color: #333;">This could be due to missing documentation, invalid details, or policy violations. \\uD83D\\uDED1</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Need help?</strong> Please contact our admin team for further information and guidance on how to resolve this at: <br/>
        <a href="mailto:\${adminEmail}" style="color: #0b8260; font-weight: bold;">\${adminEmail}</a> \\uD83D\\uDCE7</p>
      \\`;
    } else if (status === 'SUSPENDED') {
      subject = '\\uD83D\\uDEAB Account Suspended';
      title = '\\uD83D\\uDEA8 Account Suspended';
      message = \\`
        <p style="font-size: 15px; color: #333;">Your employer account for <strong>\${companyName}</strong> has been suspended.</p>
        <p style="font-size: 15px; color: #333;">You will not be able to post jobs or access premium features during this time. \\u26D4</p>
        <p style="font-size: 15px; color: #333; margin-top: 20px;"><strong>Next steps:</strong> Please contact our admin team for further information regarding your suspension at: <br/>
        <a href="mailto:\${adminEmail}" style="color: #0b8260; font-weight: bold;">\${adminEmail}</a> \\uD83D\\uDCE7</p>
      \\`;
    }

    const html = this.wrapInTemplate(
      title,
      message,
      status === 'VERIFIED' ? { text: 'Go to Dashboard', url: \\`\${frontendUrl}/employer-dashboard\\` } : undefined
    );

    try {
      await transporter.sendMail({ from: \\`"JobStock Admin" <\${from}>\\`, to: email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send employer verification email', e);
    }
  }`;

// I will use regex manually in the script
content = content.replace(/async sendEmployerVerificationStatus[\s\S]*?catch \(e\) {\s*this\.logger\.error\('Failed to send employer verification email', e\);\s*}\s*}/g, newVerify);

// Fix localhost
content = content.replace(/http:\/\/localhost:3000/g, 'https://www.jobstock.com');

// Replace sendNewEmployerAlert 
const newAlert = `async sendNewEmployerAlert(opts: { employerName: string }) {
    const transporter = this.getTransporter();
    if (!transporter) return;
    const adminEmail = process.env.EMAIL_USERNAME || process.env.SMTP_USER;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    if (!adminEmail) return;

    const html = this.wrapInTemplate(
      '\\uD83D\\uDE80 New Employer Registration',
      \\`<p style="font-size: 16px; color: #333;"><strong>\\uD83C\\uDF89 Congratulations!</strong> You have a brand new employer registration on your platform.</p>
       <div style="padding: 18px; background-color: #f0fdf4; border-radius: 8px; border-left: 5px solid #0b8260; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
         <p style="margin: 0 0 10px 0; font-size: 16px; color: #166534;">\\uD83C\\uDFE2 <strong>\${opts.employerName}</strong> has just signed up!</p>
         <p style="margin: 0 0 10px 0; color: #15803d; font-size: 14px;">\\u2705 They are currently waiting for admin verification.</p>
         <p style="margin: 0; color: #15803d; font-size: 14px;">\\uD83D\\uDD0D Please review their profile to unlock their ability to post jobs.</p>
       </div>
       <p style="color: #666; font-size: 14px;">Keep up the great work! \\uD83C\\uDF1F</p>\\`,
      { text: '\\uD83D\\uDC49 Review Employer Now', url: \\`\${process.env.FRONTEND_URL || 'https://www.jobstock.com'}/admin-employers\\` }
    );

    try {
      const subjectLine = "\\uD83C\\uDF89 New Employer: " + opts.employerName;
      await transporter.sendMail({ from: \\`"JobStock Admin" <\${from}>\\`, to: adminEmail, subject: subjectLine, html });
    } catch (e) {
      this.logger.error('Failed to send admin employer alert', e);
    }
  }`;

content = content.replace(/async sendNewEmployerAlert[\s\S]*?catch \(e\) {\s*this\.logger\.error\('Failed to send admin employer alert', e\);\s*}\s*}/g, newAlert);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed everything!');
