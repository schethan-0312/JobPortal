import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const newPass = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@jobstock.com' },
    update: { passwordHash: newPass, role: 'ADMIN', adminRole: 'SUPER_ADMIN' },
    create: {
      email: 'admin@jobstock.com',
      passwordHash: newPass,
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      isEmailVerified: true
    }
  });
  console.log('Restored admin@jobstock.com with password admin123');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
