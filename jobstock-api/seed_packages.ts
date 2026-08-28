import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.package.createMany({
    data: [
      {
        name: "Basic Hire",
        audience: "EMPLOYER",
        priceInPaisa: 99900,
        durationType: "DAYS",
        duration: 30,
        postJobLimit: 5,
        applicantViewLimit: 100,
        jobSeekerViewLimit: 50,
        chatEnabled: false,
        filterShortlistEnabled: true,
        scheduleInterviewsEnabled: false,
        companyBrandingEnabled: false,
        verifiedRecruiterBadgeEnabled: false,
        isActive: true,
      },
      {
        name: "Pro Recruit",
        audience: "EMPLOYER",
        priceInPaisa: 249900,
        durationType: "MONTHS",
        duration: 3,
        postJobLimit: 20,
        applicantViewLimit: 500,
        jobSeekerViewLimit: 200,
        chatEnabled: true,
        filterShortlistEnabled: true,
        scheduleInterviewsEnabled: true,
        companyBrandingEnabled: true,
        verifiedRecruiterBadgeEnabled: false,
        isActive: true,
      },
      {
        name: "Enterprise HR",
        audience: "EMPLOYER",
        priceInPaisa: 999900,
        durationType: "YEARS",
        duration: 1,
        postJobLimit: 999999, // Unlimited
        applicantViewLimit: 999999, // Unlimited
        jobSeekerViewLimit: 999999, // Unlimited
        chatEnabled: true,
        filterShortlistEnabled: true,
        scheduleInterviewsEnabled: true,
        companyBrandingEnabled: true,
        verifiedRecruiterBadgeEnabled: true,
        isActive: true,
      },
      {
        name: "Premium Plan",
        audience: "EMPLOYER",
        priceInPaisa: 149900,
        durationType: "MONTHS",
        duration: 1,
        postJobLimit: 10,
        applicantViewLimit: 250,
        jobSeekerViewLimit: 100,
        chatEnabled: true,
        filterShortlistEnabled: true,
        scheduleInterviewsEnabled: true,
        companyBrandingEnabled: false,
        verifiedRecruiterBadgeEnabled: false,
        isActive: true,
      }
    ],
    skipDuplicates: true
  });
  console.log("4 packages created.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
