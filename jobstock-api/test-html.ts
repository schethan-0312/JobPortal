import 'dotenv/config';
import { EmailService } from './src/email/email.service.js';

class MockEmailService extends EmailService {
  constructor() {
    super(null as any, { get: () => 'test' } as any);
  }
  public getHtml() {
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.jobstock.com';
    return this['wrapInTemplate'](
      '?? New Resume Package Available!',
      `<p>Hi</p>`,
      { text: '?? View Resume Packages', url: `${frontendUrl}/candidate-resume-packages` }
    );
  }
}
console.log(new MockEmailService().getHtml());
