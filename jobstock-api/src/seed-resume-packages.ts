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
      featuresJson: {
        description: 'Standard resume building tools',
        durationType: 'Days',
        duration: 365,
        features: [
          'ATS-friendly template',
          'Keyword optimization',
          'Formatting',
          'PDF Download'
        ]
      }
    }
  });

  await prisma.package.create({
    data: {
      name: 'Pro Resume',
      audience: 'RESUME',
      priceInPaisa: 29900,
      featuresJson: {
        description: 'Advanced resume building tools',
        durationType: 'Days',
        duration: 365,
        features: [
          'Everything in Smart Resume',
          'Industry-specific versions',
          'Cover Letter creation',
          'Editable DOC version'
        ]
      }
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
