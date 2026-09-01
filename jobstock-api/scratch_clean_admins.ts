import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@gmail.com';
  const password = 'Admin@123';
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('Deleting all admins except the primary one...');
  const deleted = await prisma.user.deleteMany({
    where: {
      role: 'ADMIN',
      email: {
        not: email
      }
    }
  });
  console.log(`Deleted ${deleted.count} extra admin(s).`);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Updating existing admin user to ensure password is correct...');
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: 'ADMIN', adminRole: 'SUPER_ADMIN', isEmailVerified: true }
    });
  } else {
    console.log('Creating new primary admin user...');
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
  console.log(`\nWorking Admin Details:\nEmail: ${email}\nPassword: ${password}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
