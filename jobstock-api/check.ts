import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: '73nammu@gmail.com' },
    include: {
      employer: {
        include: {
          subscriptions: true
        }
      }
    }
  });
  console.dir(user, { depth: null });
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
