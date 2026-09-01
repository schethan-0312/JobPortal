import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  await prisma.user.deleteMany({
    where: { role: 'EMPLOYER' }
  });
  console.log("Deleted all employers!");
  await prisma.$disconnect();
  process.exit(0);
}
main();
