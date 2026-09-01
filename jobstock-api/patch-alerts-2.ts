import * as fs from 'fs';

// 1. Patch auth.service.ts for employer registration alert
let auth = fs.readFileSync('src/auth/auth.service.ts', 'utf8');
if (!auth.includes('sendAdminAlert')) {
  auth = auth.replace(
    "await this.emailService.sendWelcomeEmail(dto.email, dto.fullName);",
    `await this.emailService.sendWelcomeEmail(dto.email, dto.fullName);\n    if (dto.role === 'EMPLOYER') {\n      this.emailService.sendAdminAlert({\n        type: 'New Employer Registered',\n        details: \`Employer \${dto.fullName} has registered and may require verification.\`\n      }).catch(console.error);\n    }`
  );
  fs.writeFileSync('src/auth/auth.service.ts', auth, 'utf8');
}

// 2. Patch support.service.ts for high-priority tickets
let support = fs.readFileSync('src/support/support.service.ts', 'utf8');
if (!support.includes('sendAdminAlert')) {
  support = support.replace(
    "import { PrismaService } from '../prisma/prisma.service.js';",
    "import { PrismaService } from '../prisma/prisma.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  support = support.replace(
    "constructor(private readonly prisma: PrismaService) {}",
    "constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}"
  );
  support = support.replace(
    "include: { messages: true },\n    });\n  }",
    `include: { messages: true },\n    });\n    \n    this.emailService.sendAdminAlert({\n      type: 'New Support Ticket',\n      details: \`A new support ticket "\${dto.subject}" was submitted by \${userId}.\`\n    }).catch(console.error);\n    return ticket;\n  }`
  );
  support = support.replace("return this.prisma.supportTicket.create({", "const ticket = await this.prisma.supportTicket.create({");
  fs.writeFileSync('src/support/support.service.ts', support, 'utf8');
}
let supportModule = fs.readFileSync('src/support/support.module.ts', 'utf8');
if (!supportModule.includes('EmailModule')) {
  supportModule = supportModule.replace(
    "import { PrismaModule } from '../prisma/prisma.module.js';",
    "import { PrismaModule } from '../prisma/prisma.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  supportModule = supportModule.replace(
    "imports: [PrismaModule],",
    "imports: [PrismaModule, EmailModule],"
  );
  fs.writeFileSync('src/support/support.module.ts', supportModule, 'utf8');
}

// 3. Patch reports.service.ts for job flagged
let reports = fs.readFileSync('src/reports/reports.service.ts', 'utf8');
if (!reports.includes('sendAdminAlert')) {
  reports = reports.replace(
    "import { PrismaService } from '../prisma/prisma.service.js';",
    "import { PrismaService } from '../prisma/prisma.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  reports = reports.replace(
    "constructor(private readonly prisma: PrismaService) {}",
    "constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}"
  );
  reports = reports.replace(
    "    return this.prisma.report.create({",
    "    const report = await this.prisma.report.create({"
  );
  reports = reports.replace(
    "reason: dto.reason,\n      },\n    });",
    `reason: dto.reason,\n      },\n    });\n\n    const reportCount = await this.prisma.report.count({ where: { jobId: dto.jobId } });\n    if (reportCount >= 3) {\n      this.emailService.sendAdminAlert({ type: 'Job Flagged Multiple Times', details: \`Job ID \${dto.jobId} has been flagged \${reportCount} times.\` }).catch(console.error);\n    }\n    return report;`
  );
  fs.writeFileSync('src/reports/reports.service.ts', reports, 'utf8');
}
let reportsModule = fs.readFileSync('src/reports/reports.module.ts', 'utf8');
if (!reportsModule.includes('EmailModule')) {
  reportsModule = reportsModule.replace(
    "import { PrismaModule } from '../prisma/prisma.module.js';",
    "import { PrismaModule } from '../prisma/prisma.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  reportsModule = reportsModule.replace(
    "imports: [PrismaModule],",
    "imports: [PrismaModule, EmailModule],"
  );
  fs.writeFileSync('src/reports/reports.module.ts', reportsModule, 'utf8');
}
console.log('Incoming alerts patched');
