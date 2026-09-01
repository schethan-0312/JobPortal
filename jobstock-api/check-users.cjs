const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { id: true, email: true, role: true } })
  .then(users => { console.log(users); process.exit(0); });
