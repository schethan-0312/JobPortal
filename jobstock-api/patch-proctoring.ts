import * as fs from 'fs';

let service = fs.readFileSync('src/admin-proctoring/admin-proctoring.service.ts', 'utf8');
if (!service.includes('EmailService')) {
  service = service.replace(
    "import { AuditLogService } from '../audit-log/audit-log.service.js';",
    "import { AuditLogService } from '../audit-log/audit-log.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  service = service.replace(
    "private readonly auditLog: AuditLogService,",
    "private readonly auditLog: AuditLogService,\n    private readonly emailService: EmailService,"
  );
  
  // In `invalidateAssessment`
  service = service.replace(
    "    return updated;\n  }\n\n  async invalidateInterview",
    `
    const assessmentWithUser = await this.prisma.skillAssessment.findUnique({ where: { id: assessmentId }, include: { candidate: { include: { user: true } } } });
    if (assessmentWithUser && assessmentWithUser.candidate.user.email) {
      this.emailService.sendProctoringNotice({
        email: assessmentWithUser.candidate.user.email,
        testName: assessmentWithUser.skill + ' Assessment',
        decision: 'INVALIDATED due to policy violations',
        instructions: 'Please contact support if you believe this is an error or to file an appeal.'
      }).catch(console.error);
    }
    return updated;
  }

  async invalidateInterview`
  );

  // In `invalidateInterview`
  service = service.replace(
    "    return updated;\n  }\n}",
    `
    const interviewWithUser = await this.prisma.mockInterview.findUnique({ where: { id: interviewId }, include: { candidate: { include: { user: true } } } });
    if (interviewWithUser && interviewWithUser.candidate.user.email) {
      this.emailService.sendProctoringNotice({
        email: interviewWithUser.candidate.user.email,
        testName: 'Mock Interview (' + interviewWithUser.jobRole + ')',
        decision: 'INVALIDATED due to policy violations',
        instructions: 'Please contact support if you believe this is an error or to file an appeal.'
      }).catch(console.error);
    }
    return updated;
  }
}`
  );
  
  fs.writeFileSync('src/admin-proctoring/admin-proctoring.service.ts', service, 'utf8');
}

let module = fs.readFileSync('src/admin-proctoring/admin-proctoring.module.ts', 'utf8');
if (!module.includes('EmailModule')) {
  module = module.replace(
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';",
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  module = module.replace(
    "imports: [PrismaModule, AuditLogModule],",
    "imports: [PrismaModule, AuditLogModule, EmailModule],"
  );
  fs.writeFileSync('src/admin-proctoring/admin-proctoring.module.ts', module, 'utf8');
}
console.log('Proctoring patched');
