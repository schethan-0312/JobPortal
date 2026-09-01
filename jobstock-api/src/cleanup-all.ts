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
  // Find all employers including yogithamgowdayogitha@gmail.com
  const allEmployers = await prisma.user.findMany({
    where: { 
      role: 'EMPLOYER'
    }
  });
  
  for (const emp of allEmployers) {
    await prisma.user.delete({ where: { id: emp.id } });
  }
  
  // Also specifically check if the email exists as ANY role (e.g. candidate)
  const thatSpecificEmail = await prisma.user.findUnique({
    where: { email: 'yogithamgowdayogitha@gmail.com' }
  });
  if (thatSpecificEmail) {
    await prisma.user.delete({ where: { id: thatSpecificEmail.id } });
  }
  
  console.log(`Deleted all employers and yogithamgowdayogitha@gmail.com if it existed.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
