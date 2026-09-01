import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  let employerPkg = await prisma.package.findFirst({ where: { audience: 'EMPLOYER' } });
  
  if (!employerPkg) {
    console.log('Creating default Employer Package...');
    employerPkg = await prisma.package.create({
      data: {
        name: 'Basic Employer',
        audience: 'EMPLOYER',
        priceInPaisa: 0,
        durationType: 'MONTHS',
        duration: 12,
        postJobLimit: 100,
        applicantViewLimit: 1000,
        jobSeekerViewLimit: 1000
      }
    });
  }

  const employerId = 'cmth3xvac00014gv3qvz5rvn8'; // the employer ID from earlier
  
  // delete existing if any to avoid duplication errors (optional, we know they have 0)
  await prisma.employerPackageSubscription.deleteMany({ where: { employerId } });

  console.log('Assigning package to the employer...');
  await prisma.employerPackageSubscription.create({
    data: {
        employerId,
        packageId: employerPkg.id,
        status: 'ACTIVE',
        jobPostsUsed: 0,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  });
  console.log('Done!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
