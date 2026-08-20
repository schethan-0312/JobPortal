import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
async function main() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log(admins.map(a => ({ email: a.email, adminRole: a.adminRole })));
  await prisma.$disconnect();
}
main();
