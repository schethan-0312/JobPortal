import * as fs from 'fs';

const path = 'src/email/email.service.ts';
let content = fs.readFileSync(path, 'utf8');

const oldFuncRegex = /async sendEmployerVerificationStatus\\(email: string, companyName: string, status: 'VERIFIED' \\| 'REJECTED' \\| 'SUSPENDED'\\) \\{\\s*if \\(\\!this\\.transporter\\) return;\\s*const from = [^]*?<h2>JobStock Employer Update<\\/h2>[^]*?Failed to send employer verification email', e\\);\\s*}\\s*}/;

if (oldFuncRegex.test(content)) {
  content = content.replace(oldFuncRegex, '');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Removed duplicate!');
} else {
  console.log('Not found!');
}
