const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      employer: true,
      candidateProfile: true,
    },
  });
  console.log("USERS:", JSON.stringify(users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    candidatePhoto: u.candidateProfile?.profilePhotoUrl,
    employerLogo: u.employer?.logoUrl,
    companyName: u.employer?.companyName,
    fullName: u.candidateProfile?.fullName
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
