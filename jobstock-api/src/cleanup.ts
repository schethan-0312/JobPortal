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
  const emailToKeep = 'yogithamgowdayogitha@gmail.com';
  
  const otherEmployers = await prisma.user.findMany({
    where: { 
      role: 'EMPLOYER',
      email: { not: emailToKeep }
    }
  });
  
  for (const emp of otherEmployers) {
    await prisma.user.delete({ where: { id: emp.id } });
  }
  
  console.log(`Deleted ${otherEmployers.length} other employers.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
