import * as fs from 'fs';

// 1. Add EmailService import to admin-job-moderation.service.ts
let service = fs.readFileSync('src/admin-job-moderation/admin-job-moderation.service.ts', 'utf8');
if (!service.includes('EmailService')) {
  service = service.replace(
    "import { AuditLogService } from '../audit-log/audit-log.service.js';",
    "import { AuditLogService } from '../audit-log/audit-log.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  service = service.replace(
    "private readonly auditLog: AuditLogService,",
    "private readonly auditLog: AuditLogService,\n    private readonly emailService: EmailService,"
  );
  
  // Hook the email dispatch right after status update
  service = service.replace(
    "const updated = await this.prisma.job.update({ where: { id: jobId }, data: { status } });",
    `const updated = await this.prisma.job.update({ where: { id: jobId }, data: { status }, include: { employer: { include: { user: true } } } });
    if (status === 'APPROVED' || status === 'REJECTED') {
      this.emailService.sendJobModerationStatus({
        email: updated.employer.user.email,
        jobTitle: updated.title,
        companyName: updated.employer.companyName,
        status: status as any
      }).catch(console.error);
    }`
  );
  fs.writeFileSync('src/admin-job-moderation/admin-job-moderation.service.ts', service, 'utf8');
}

// 3. Update admin-job-moderation.module.ts
let module = fs.readFileSync('src/admin-job-moderation/admin-job-moderation.module.ts', 'utf8');
if (!module.includes('EmailModule')) {
  module = module.replace(
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';",
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  module = module.replace(
    "imports: [PrismaModule, AuditLogModule],",
    "imports: [PrismaModule, AuditLogModule, EmailModule],"
  );
  fs.writeFileSync('src/admin-job-moderation/admin-job-moderation.module.ts', module, 'utf8');
}
console.log('Job moderation patched');
