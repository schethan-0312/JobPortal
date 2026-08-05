import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  const email = 'admin@gmail.com';
  const password = 'Admin@123';
  const passwordHash = await bcrypt.hash(password, 10);
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Updating existing admin user');
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: 'ADMIN', adminRole: 'SUPER_ADMIN', isEmailVerified: true }
    });
  } else {
    console.log('Creating new admin user');
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
        adminRole: 'SUPER_ADMIN',
        isEmailVerified: true
      }
    });
  }
  console.log(`Admin user ready: ${email} / ${password}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
