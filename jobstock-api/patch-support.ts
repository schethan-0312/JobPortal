import * as fs from 'fs';

let service = fs.readFileSync('src/admin-support/admin-support.service.ts', 'utf8');
if (!service.includes('EmailService')) {
  service = service.replace(
    "import { AuditLogService } from '../audit-log/audit-log.service.js';",
    "import { AuditLogService } from '../audit-log/audit-log.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  service = service.replace(
    "private readonly auditLog: AuditLogService,",
    "private readonly auditLog: AuditLogService,\n    private readonly emailService: EmailService,"
  );
  
  // In `update` (closing/resolving)
  service = service.replace(
    "const updated = await this.prisma.supportTicket.update({",
    `const updated = await this.prisma.supportTicket.update({`
  );
  // Wait, I need to reliably inject after the `update` block.
  // Instead of regex, let's just use string replace.
  
  service = service.replace(
    "    return updated;",
    `    if (dto.status && (dto.status === 'RESOLVED' || dto.status === 'CLOSED')) {
      const ticketWithUser = await this.prisma.supportTicket.findUnique({ where: { id: ticketId }, include: { user: true } });
      if (ticketWithUser) {
        this.emailService.sendSupportTicketUpdate({
          email: ticketWithUser.user.email,
          ticketId: ticketId,
          subject: ticketWithUser.subject,
          snippet: \`Your ticket has been marked as \${dto.status}.\`
        }).catch(console.error);
      }
    }
    return updated;`
  );

  // In `reply` method
  service = service.replace(
    "    return newMessage;",
    `    const ticketWithUser = await this.prisma.supportTicket.findUnique({ where: { id: ticketId }, include: { user: true } });
    if (ticketWithUser) {
      this.emailService.sendSupportTicketUpdate({
        email: ticketWithUser.user.email,
        ticketId: ticketId,
        subject: ticketWithUser.subject,
        snippet: dto.content.length > 200 ? dto.content.substring(0, 200) + '...' : dto.content
      }).catch(console.error);
    }
    return newMessage;`
  );
  
  fs.writeFileSync('src/admin-support/admin-support.service.ts', service, 'utf8');
}

let module = fs.readFileSync('src/admin-support/admin-support.module.ts', 'utf8');
if (!module.includes('EmailModule')) {
  module = module.replace(
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';",
    "import { AuditLogModule } from '../audit-log/audit-log.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  module = module.replace(
    "imports: [PrismaModule, AuditLogModule],",
    "imports: [PrismaModule, AuditLogModule, EmailModule],"
  );
  fs.writeFileSync('src/admin-support/admin-support.module.ts', module, 'utf8');
}
console.log('Support ticket patched');
