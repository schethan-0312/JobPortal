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
  
  const hash = await bcrypt.hash('password123', 12);
  
  await prisma.user.updateMany({
    data: { passwordHash: hash }
  });
  
  console.log('All passwords reset to password123');
  await prisma.$disconnect();
  process.exit(0);
}
main();
