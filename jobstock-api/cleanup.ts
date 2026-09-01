import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emailToKeep = 'yogithamgowdayogitha@gmail.com';
  
  // Find all employers
  const otherEmployers = await prisma.user.findMany({
    where: { 
      role: 'EMPLOYER',
      email: { not: emailToKeep }
    }
  });
  
  for (const emp of otherEmployers) {
    await prisma.user.delete({ where: { id: emp.id } });
  }
  
  console.log(`Deleted ${otherEmployers.length} other employers.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
