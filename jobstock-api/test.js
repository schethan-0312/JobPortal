import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();
prisma.order.findUnique({where:{id:'cmtmvzpof0001pkv3wzkc0au9'}}).then(console.log).finally(() => process.exit(0));
