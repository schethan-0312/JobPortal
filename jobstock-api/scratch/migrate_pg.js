import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:root@localhost:5000/jobstock?schema=public'
});

async function main() {
  await client.connect();

  try {
    await client.query(`CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');`);
    console.log("Created AuthProvider enum");
  } catch (e) {
    console.log("Enum might exist:", e.message);
  }

  try {
    await client.query(`ALTER TABLE "User" ADD COLUMN "googleId" TEXT;`);
    console.log("Added googleId column");
  } catch (e) {
    console.log("googleId might exist:", e.message);
  }

  try {
    await client.query(`CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");`);
    console.log("Created index for googleId");
  } catch (e) {
    console.log("Index might exist:", e.message);
  }

  try {
    await client.query(`ALTER TABLE "User" ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL';`);
    console.log("Added authProvider column");
  } catch (e) {
    console.log("authProvider might exist:", e.message);
  }

  try {
    await client.query(`ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;`);
    console.log("Dropped NOT NULL constraint on passwordHash");
  } catch (e) {
    console.log("Constraint might be dropped:", e.message);
  }

  await client.end();
}

main().catch(console.error);
