import * as fs from 'fs';

// 1. Fix admin-financials.service.ts
let financials = fs.readFileSync('src/admin-financials/admin-financials.service.ts', 'utf8');
financials = financials.replace("quota: sub.package.jobPostsQuota || 0,", "quota: sub.package.postJobLimit || 0,");
financials = financials.replace("unlocks: sub.package.candidateContactUnlocks || 0", "unlocks: sub.package.jobSeekerViewLimit || 0");
fs.writeFileSync('src/admin-financials/admin-financials.service.ts', financials, 'utf8');

// 2. Fix admin-job-moderation.service.ts
let jobs = fs.readFileSync('src/admin-job-moderation/admin-job-moderation.service.ts', 'utf8');
jobs = jobs.replace("if (status === 'APPROVED' || status === 'REJECTED') {", "if (status === 'OPEN' || status === 'FLAGGED') {");
jobs = jobs.replace("status: status as any", "status: status === 'OPEN' ? 'APPROVED' : 'REJECTED'");
fs.writeFileSync('src/admin-job-moderation/admin-job-moderation.service.ts', jobs, 'utf8');

// 3. Fix admin-team.service.ts
let team = fs.readFileSync('src/admin-team/admin-team.service.ts', 'utf8');
team = team.replace("role: admin.adminRole,", "role: admin.adminRole || 'ADMIN',");
fs.writeFileSync('src/admin-team/admin-team.service.ts', team, 'utf8');
console.log('Fixed typescript errors');
