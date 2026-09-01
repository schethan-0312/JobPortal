import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const admin = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' }});
  const user = await prisma.user.findUnique({ where: { email: 'nammuhm370@gmail.com' }});
  console.log('Admin:', admin?.role);
  console.log('User:', user?.role);
  
  await prisma.$disconnect();
  process.exit(0);
}
main();
