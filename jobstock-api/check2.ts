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
  const packages = await prisma.package.findMany({ where: { audience: 'EMPLOYER' } });
  console.log('Employer Packages:', packages.map(p => p.name));
  
  if (packages.length > 0) {
    console.log('Giving ' + packages[0].name + ' to the user...');
    await prisma.employerPackageSubscription.create({
        data: {
            employerId: 'cmth3xvac00014gv3qvz5rvn8',
            packageId: packages[0].id,
            status: 'ACTIVE',
            jobPostsUsed: 0,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
    });
    console.log('Subscription added!');
  } else {
    console.log('No Employer packages found!');
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
