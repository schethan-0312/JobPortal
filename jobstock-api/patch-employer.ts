import * as fs from 'fs';

// 1. Add EmailService import to admin-employer-management.service.ts
let service = fs.readFileSync('src/admin-employer-management/admin-employer-management.service.ts', 'utf8');
if (!service.includes('EmailService')) {
  service = service.replace(
    "import { PrismaService } from '../prisma/prisma.service.js';",
    "import { PrismaService } from '../prisma/prisma.service.js';\nimport { EmailService } from '../email/email.service.js';"
  );
  service = service.replace(
    "constructor(private readonly prisma: PrismaService) {}",
    "constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}"
  );
  
  service = service.replace(/}\s*$/, `
  async setStatus(employerId: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    const employer = await this.prisma.employer.update({
      where: { id: employerId },
      data: { status: status as any },
      include: { user: true }
    });
    
    // Trigger email in background
    this.emailService.sendEmployerVerificationStatus(employer.user.email, employer.companyName, status).catch(e => console.error(e));
    
    return employer;
  }
}
`);
  fs.writeFileSync('src/admin-employer-management/admin-employer-management.service.ts', service, 'utf8');
}

// 2. Add endpoint to admin-employer-management.controller.ts
let controller = fs.readFileSync('src/admin-employer-management/admin-employer-management.controller.ts', 'utf8');
if (!controller.includes('@Patch(\':id/status\')')) {
  controller = controller.replace(
    "import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';",
    "import { Controller, Get, Param, Query, UseGuards, Patch, Body } from '@nestjs/common';"
  );
  controller = controller.replace(/}\s*$/, `
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body('status') status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    return this.service.setStatus(id, status);
  }
}
`);
  fs.writeFileSync('src/admin-employer-management/admin-employer-management.controller.ts', controller, 'utf8');
}

// 3. Update admin-employer-management.module.ts
let module = fs.readFileSync('src/admin-employer-management/admin-employer-management.module.ts', 'utf8');
if (!module.includes('EmailModule')) {
  module = module.replace(
    "import { PrismaModule } from '../prisma/prisma.module.js';",
    "import { PrismaModule } from '../prisma/prisma.module.js';\nimport { EmailModule } from '../email/email.module.js';"
  );
  module = module.replace(
    "imports: [PrismaModule],",
    "imports: [PrismaModule, EmailModule],"
  );
  fs.writeFileSync('src/admin-employer-management/admin-employer-management.module.ts', module, 'utf8');
}
console.log('Employer status patched');
