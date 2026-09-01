const dotenv = require('dotenv');
dotenv.config();
const { EmailService } = require('./dist/src/email/email.service.js');
const service = new EmailService(null, { get: () => 'test' });
const html = service.wrapInTemplate(
  '?? New Resume Package Available!',
  <p>Hi</p>,
  { text: '?? View Resume Packages', url: \\/candidate-resume-packages\ }
);
console.log(html);
