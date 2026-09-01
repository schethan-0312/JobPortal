import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Resume Packages...');

  await prisma.package.create({
    data: {
      name: 'Smart Resume',
      audience: 'RESUME',
      priceInPaisa: 9900,
      durationType: 'DAYS',
      duration: 365
    }
  });

  await prisma.package.create({
    data: {
      name: 'Pro Resume',
      audience: 'RESUME',
      priceInPaisa: 29900,
      durationType: 'DAYS',
      duration: 365
    }
  });

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
