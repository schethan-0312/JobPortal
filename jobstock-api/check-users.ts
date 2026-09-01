import { PrismaClient } from './generated/prisma/client.js';

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log(users);
  await prisma.$disconnect();
}
main();
