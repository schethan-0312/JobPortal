const { PrismaClient } = require('./node_modules/@prisma/client/default.js');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { id: true, email: true, role: true } })
  .then(users => { console.log(users); process.exit(0); });
