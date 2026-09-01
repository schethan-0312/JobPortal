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
  const newPass = await bcrypt.hash('Admin@123', 10);
  await prisma.user.update({
    where: { email: 'admin@gmail.com' },
    data: { passwordHash: newPass }
  });
  console.log('Password for admin@gmail.com set to Admin@123');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
