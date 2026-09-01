const fs = require('fs');
let text = fs.readFileSync('src/email/email.service.ts', 'utf8');

const strToFind = \  async sendEmployerVerificationStatus(email: string, companyName: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    if (!this.transporter) return;
    const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USERNAME || process.env.SMTP_USER)?.trim();
    
    let subject = 'Employer Verification Update';
    let message = '';
    
    if (status === 'VERIFIED') {
      subject = 'Your Company is Verified';
      message = \\\<p>Good news, <b>\</b> has been successfully verified! You can now access your dashboard and post jobs.</p>\\\;
    } else if (status === 'REJECTED') {
      subject = 'Verification Rejected';
      message = \\\<p>Unfortunately, your verification for <b>\</b> was rejected. Please review your documents and contact support.</p>\\\;
    } else if (status === 'SUSPENDED') {
      subject = 'Account Suspended';
      message = \\\<p>Your account for <b>\</b> has been suspended. Please contact support.</p>\\\;
    }
    
    const html = \\\<h2>JobStock Employer Update</h2>\\\ + message;
    
    try {
      await this.transporter.sendMail({ from, to: email, subject, html });
    } catch (e) {
      this.logger.error('Failed to send employer verification email', e);
    }
  }\;

const idx = text.indexOf(strToFind);
if (idx !== -1) {
    text = text.substring(0, idx) + text.substring(idx + strToFind.length);
    fs.writeFileSync('src/email/email.service.ts', text, 'utf8');
    console.log("Removed successfully.");
} else {
    console.log("Not found.");
}
