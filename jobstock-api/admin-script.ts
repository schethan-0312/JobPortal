import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    console.log("Admin found:", admin.email);
    const newPass = await bcrypt.hash("admin123", 12);
    await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: newPass } });
    console.log("Updated password to admin123");
  } else {
    console.log("No admin found, creating one...");
    const newPass = await bcrypt.hash("admin123", 12);
    const newAdmin = await prisma.user.create({
      data: {
        email: "admin@jobstock.com",
        passwordHash: newPass,
        role: "ADMIN"
      }
    });
    console.log("Created admin:", newAdmin.email, "password: admin123");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
