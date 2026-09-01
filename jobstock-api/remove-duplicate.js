const fs = require('fs');

const path = 'src/email/email.service.ts';
let content = fs.readFileSync(path, 'utf8');

// The original one we want to remove looks like:
/*
  async sendEmployerVerificationStatus(email: string, companyName: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    if (!this.transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    
    let subject = 'Employer Verification Update';
    let message = '';
    
    if (status === 'VERIFIED') {
      subject = 'Your Company is Verified';
      message = \<p>Good news, <b>\</b> has been successfully verified! You can now access your dashboard and post jobs.</p>\;
    } else if (status === 'REJECTED') {
      subject = 'Verification Rejected';
      message = \<p>Unfortunately, your verification for <b>\</b> was rejected. Please review your documents and contact support.</p>\;
    } else if (status === 'SUSPENDED') {
      subject = 'Account Suspended';
      message = \<p>Your account for <b>\</b> has been suspended. Please contact support.</p>\;
    }
    
    const html = \<h2>JobStock Employer Update</h2>\ + message;
    
    try {
      await this.transporter.sendMail({ from, to: email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send employer verification email', e);
    }
  }
*/

const oldFuncRegex = /async sendEmployerVerificationStatus\(email: string, companyName: string, status: 'VERIFIED' \| 'REJECTED' \| 'SUSPENDED'\) \{\s*if \(\!this\.transporter\) return;\s*const from = [^]*?<h2>JobStock Employer Update<\/h2>[^]*?Failed to send employer verification email', e\);\s*}\s*}/;

if (oldFuncRegex.test(content)) {
  content = content.replace(oldFuncRegex, '');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Removed duplicate!');
} else {
  console.log('Not found!');
}
