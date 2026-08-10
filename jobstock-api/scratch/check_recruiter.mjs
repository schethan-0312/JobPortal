import { PrismaClient } from '../generated/prisma/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
