const fs = require('fs');

const path = 'src/email/email.service.ts';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = \
    const html = this.wrapInTemplate(
      'New Employer Registration',
      \\\<p style="font-size: 16px; color: #333;"><strong>Congratulations!</strong> You have a new employer registration.</p>
       <div style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #0b8260; margin: 20px 0;">
         <p style="margin: 0; font-size: 15px; color: #166534;"><strong>\</strong> has just signed up to use JobStock.</p>
         <p style="margin: 8px 0 0 0; color: #15803d;">Please review their profile and verify their account so they can start posting jobs.</p>
       </div>\\\,
      { text: 'Review Employer', url: \\\\/admin-employers\\\ }
    );
\;

const newBlock = \
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
\;

// Actually regex replacement is safer to handle slight spacing issues
// But string replacement should work if it's exact.
// Let's do a regex replacement on the function body instead to be perfectly safe.
content = content.replace(/async sendNewEmployerAlert[\\s\\S]*?catch\\s*\\(e\\)\\s*{\\s*this\\.logger\\.error\\('Failed to send admin employer alert', e\\);\\s*}\\s*}/g,
\sync sendNewEmployerAlert(opts: { employerName: string }) {
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
      // Hardcode the emoji string to avoid regex parsing issues, and use unicode escapes to prevent powershell mangling
      const subj = "\\uD83C\\uDF89 New Employer: " + opts.employerName;
      await transporter.sendMail({ from: \\\"JobStock Admin" <\>\\\, to: adminEmail, subject: subj, html });
    } catch (e) {
      this.logger.error('Failed to send admin employer alert', e);
    }
  }\
);

fs.writeFileSync(path, content, 'utf8');
console.log('Updated sendNewEmployerAlert with emojis!');
