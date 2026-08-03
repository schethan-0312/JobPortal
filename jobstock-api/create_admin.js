import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@jobstock.com';
  const password = 'AdminPassword123!';
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
