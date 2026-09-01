import * as fs from 'fs';

let service = fs.readFileSync('src/admin-team/admin-team.service.ts', 'utf8');
if (!service.includes('EmailService')) {
  service = service.replace(
    "import { AuditLogService } from '../audit-log/audit-log.service.js';",
    "import { AuditLogService } from '../audit-log/audit-log.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  service = service.replace(
    "private readonly auditLog: AuditLogService,",
    "private readonly auditLog: AuditLogService,\n    private readonly emailService: EmailService,"
  );
  
  service = service.replace(
    "// password is returned directly to the inviting super admin to hand off",
    `
    this.emailService.sendAdminTeamInvitation({
      email: admin.email,
      role: admin.adminRole,
      tempPass: tempPassword
    }).catch(console.error);
    
    // password is returned directly to the inviting super admin to hand off`
  );
  
  fs.writeFileSync('src/admin-team/admin-team.service.ts', service, 'utf8');
}

let module = fs.readFileSync('src/admin-team/admin-team.module.ts', 'utf8');
if (!module.includes('EmailModule')) {
  module = module.replace(
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';",
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  module = module.replace(
    "imports: [PrismaModule, AuditLogModule],",
    "imports: [PrismaModule, AuditLogModule, EmailModule],"
  );
  fs.writeFileSync('src/admin-team/admin-team.module.ts', module, 'utf8');
}
console.log('Team patched');
