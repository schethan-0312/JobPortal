async function main() {
  const { PrismaClient } = await import('./generated/prisma/index.js');
  const prisma = new PrismaClient();
  const assessments = await prisma.jobAssessment.findMany({
    include: { job: true }
  });
  console.log(JSON.stringify(assessments, null, 2));
  await prisma.$disconnect();
}
main();
