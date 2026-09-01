import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import pg from 'pg';
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const userHash = await bcrypt.hash('Yogitha@123', 12);
  
  await prisma.user.updateMany({
    where: { email: 'admin@gmail.com' },
    data: { passwordHash: adminHash }
  });
  
  await prisma.user.updateMany({
    where: { email: 'nammuhm370@gmail.com' },
    data: { passwordHash: userHash }
  });
  
  console.log('Passwords updated to match user request.');
  await prisma.$disconnect();
  process.exit(0);
}
main();
