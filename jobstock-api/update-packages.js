const fs = require('fs');

const path = 'src/packages/packages.service.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes("import { EmailService }")) {
  content = content.replace("import { PrismaService } from '../prisma/prisma.service.js';", "import { PrismaService } from '../prisma/prisma.service.js';\nimport { EmailService } from '../email/email.service.js';");
}

// 2. Add to constructor
content = content.replace("constructor(private readonly prisma: PrismaService) {}", "constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}");

// 3. Update createPackage
const oldCreate = /createPackage\\([\\s\\S]*?\\) {\\s*return this\\.prisma\\.package\\.create\\({[\\s\\S]*?}\\);\\s*}/;

const newCreate = \sync createPackage(data: {
    name: string;
    audience: 'CANDIDATE' | 'EMPLOYER' | 'RESUME';
    priceInPaisa: number;
    durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
    duration?: number;
    postJobLimit?: number;
    applicantViewLimit?: number;
    jobSeekerViewLimit?: number;
    chatEnabled?: boolean;
    filterShortlistEnabled?: boolean;
    scheduleInterviewsEnabled?: boolean;
    companyBrandingEnabled?: boolean;
    verifiedRecruiterBadgeEnabled?: boolean;
    isActive?: boolean;
  }) {
    const pkg = await this.prisma.package.create({
      data: {
        name: data.name,
        audience: data.audience,
        priceInPaisa: Number(data.priceInPaisa),
        durationType: data.durationType ?? 'MONTHS',
        duration: data.duration !== undefined ? Number(data.duration) : 1,
        postJobLimit: data.postJobLimit !== undefined ? Number(data.postJobLimit) : 0,
        applicantViewLimit: data.applicantViewLimit !== undefined ? Number(data.applicantViewLimit) : 0,
        jobSeekerViewLimit: data.jobSeekerViewLimit !== undefined ? Number(data.jobSeekerViewLimit) : 0,
        chatEnabled: data.chatEnabled ?? false,
        filterShortlistEnabled: data.filterShortlistEnabled ?? false,
        scheduleInterviewsEnabled: data.scheduleInterviewsEnabled ?? false,
        companyBrandingEnabled: data.companyBrandingEnabled ?? false,
        verifiedRecruiterBadgeEnabled: data.verifiedRecruiterBadgeEnabled ?? false,
        isActive: data.isActive ?? true,
      },
    });

    if (pkg.audience === 'EMPLOYER' || pkg.audience === 'RESUME') {
      const features = [];
      if (pkg.postJobLimit > 0) features.push(\\\Post up to \ Jobs\\\);
      if (pkg.applicantViewLimit > 0) features.push(\\\View up to \ Applicants\\\);
      if (pkg.jobSeekerViewLimit > 0) features.push(\\\Contact \ Candidates directly\\\);
      if (pkg.chatEnabled) features.push('Direct Chat with Candidates');
      if (pkg.filterShortlistEnabled) features.push('Advanced Shortlisting & Filters');
      if (pkg.scheduleInterviewsEnabled) features.push('Integrated Interview Scheduling');
      if (pkg.companyBrandingEnabled) features.push('Premium Company Branding');
      if (pkg.verifiedRecruiterBadgeEnabled) features.push('Verified Recruiter Badge');
      if (features.length === 0) features.push('Access to premium platform features');

      // Async background fetch and email so we don't block
      setImmediate(async () => {
        try {
          const employers = await this.prisma.user.findMany({
            where: { role: 'EMPLOYER' },
            include: { employerProfile: true }
          });

          for (const emp of employers) {
            if (!emp.email) continue;
            const companyName = emp.employerProfile?.companyName || 'Employer';
            await this.emailService.sendNewPackageNotification({
              email: emp.email,
              companyName,
              packageName: pkg.name,
              priceInPaisa: pkg.priceInPaisa,
              duration: pkg.duration,
              durationType: pkg.durationType,
              features
            });
          }
        } catch (e) {
          console.error('Failed to broadcast new package to employers', e);
        }
      });
    }

    return pkg;
  }\;

const match = content.match(/createPackage\([\s\S]*?\) {\s*return this\.prisma\.package\.create\(\{[\s\S]*?\}\);\s*}/);
if (match) {
  content = content.replace(match[0], newCreate);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed packages.service.ts!');
} else {
  console.log('Not found!');
}
