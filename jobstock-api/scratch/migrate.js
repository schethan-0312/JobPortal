import pkg from '../generated/prisma/index.js';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');`);
    console.log("Created AuthProvider enum");
  } catch (e) {
    console.log("Enum might exist:", e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "googleId" TEXT;`);
    console.log("Added googleId column");
  } catch (e) {
    console.log("googleId might exist:", e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");`);
    console.log("Created index for googleId");
  } catch (e) {
    console.log("Index might exist:", e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL';`);
    console.log("Added authProvider column");
  } catch (e) {
    console.log("authProvider might exist:", e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;`);
    console.log("Dropped NOT NULL constraint on passwordHash");
  } catch (e) {
    console.log("Constraint might be dropped:", e.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
