import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();

async function run() {
  const subs = await prisma.employerPackageSubscription.findMany({ 
    where: { refundRequested: true } 
  });
  
  for (const sub of subs) {
    const employer = await prisma.employer.findUnique({where:{id: sub.employerId}});
    if (!employer) continue;
    const order = await prisma.order.findFirst({ 
      where: { 
        userId: employer.userId, 
        packageId: sub.packageId, 
        status: 'PAID' 
      }, 
      orderBy: { createdAt: 'desc' } 
    });
    
    if (order && !order.refundRequested) {
      await prisma.order.update({ 
        where: { id: order.id }, 
        data: { refundRequested: true, refundReason: sub.refundReason } 
      });
      console.log('Updated order', order.id);
    }
  }
}

run().catch(console.error).finally(() => process.exit(0));
