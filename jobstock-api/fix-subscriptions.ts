import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeSubs = await prisma.employerPackageSubscription.findMany({
    where: { status: 'ACTIVE' },
    include: { employer: true }
  });

  console.log(`Found ${activeSubs.length} active subscriptions.`);

  let fixed = 0;
  for (const sub of activeSubs) {
    // find the most recent order for this package and user
    const order = await prisma.order.findFirst({
      where: { 
        userId: sub.employer.userId,
        packageId: sub.packageId,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (order && order.status === 'REFUNDED') {
      console.log(`Subscription ${sub.id} belongs to a REFUNDED order. Fixing...`);
      await prisma.employerPackageSubscription.update({
        where: { id: sub.id },
        data: { status: 'REFUNDED', expiresAt: new Date() }
      });
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} subscriptions.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
