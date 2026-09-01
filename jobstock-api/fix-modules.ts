import * as fs from 'fs';
import * as path from 'path';

function addEmailModule(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add the import statement if not exists
  if (!content.includes("import { EmailModule }")) {
    content = "import { EmailModule } from '../email/email.module.js';\n" + content;
  }
  
  // Check if `imports:` exists
  if (content.includes('imports: [')) {
    // If it's already there, skip
    if (!content.includes('EmailModule]')) {
      content = content.replace(/imports:\s*\[/, 'imports: [EmailModule, ');
    }
  } else {
    // Add imports array before providers
    content = content.replace('providers: [', 'imports: [EmailModule],\n  providers: [');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

addEmailModule('src/reports/reports.module.ts');
addEmailModule('src/support/support.module.ts');
addEmailModule('src/admin-employer-management/admin-employer-management.module.ts');
addEmailModule('src/admin-financials/admin-financials.module.ts');
addEmailModule('src/admin-job-moderation/admin-job-moderation.module.ts');
addEmailModule('src/admin-proctoring/admin-proctoring.module.ts');
addEmailModule('src/admin-support/admin-support.module.ts');
addEmailModule('src/admin-team/admin-team.module.ts');
console.log('Fixed module imports');
