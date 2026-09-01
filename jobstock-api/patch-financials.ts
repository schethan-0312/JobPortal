import * as fs from 'fs';

let service = fs.readFileSync('src/admin-financials/admin-financials.service.ts', 'utf8');
if (!service.includes('EmailService')) {
  service = service.replace(
    "import { AuditLogService } from '../audit-log/audit-log.service.js';",
    "import { AuditLogService } from '../audit-log/audit-log.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  service = service.replace(
    "private readonly auditLog: AuditLogService,",
    "private readonly auditLog: AuditLogService,\n    private readonly emailService: EmailService,"
  );
  
  // After `employerPackageSubscription.update`
  // The method looks like:
  // const updated = await this.prisma.employerPackageSubscription.update({ ... });
  // await this.auditLog.log({ ... });
  // return updated;
  
  service = service.replace(
    "    return updated;",
    `
    if (updated.status === 'ACTIVE') {
      const sub = await this.prisma.employerPackageSubscription.findUnique({
        where: { id: subscriptionId },
        include: { employer: { include: { user: true } }, package: true }
      });
      if (sub && sub.package && sub.employer?.user) {
        this.emailService.sendPackageAssignmentConfirmation({
          email: sub.employer.user.email,
          planName: sub.package.name,
          quota: sub.package.jobPostsQuota || 0,
          unlocks: sub.package.candidateContactUnlocks || 0
        }).catch(console.error);
      }
    }
    return updated;`
  );
  
  fs.writeFileSync('src/admin-financials/admin-financials.service.ts', service, 'utf8');
}

let module = fs.readFileSync('src/admin-financials/admin-financials.module.ts', 'utf8');
if (!module.includes('EmailModule')) {
  module = module.replace(
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';",
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  module = module.replace(
    "imports: [PrismaModule, AuditLogModule],",
    "imports: [PrismaModule, AuditLogModule, EmailModule],"
  );
  fs.writeFileSync('src/admin-financials/admin-financials.module.ts', module, 'utf8');
}
console.log('Financials patched');
