import { PrismaClient } from './generated/prisma/client.js';
import bcryptPkg from 'bcrypt';
const bcrypt = bcryptPkg;
const prisma = new PrismaClient();
async function main() {
    const email = 'admin@jobstock.com';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: 'ADMIN',
            adminRole: 'SUPER_ADMIN',
        },
        create: {
            email,
            passwordHash,
            role: 'ADMIN',
            adminRole: 'SUPER_ADMIN',
            isEmailVerified: true,
        },
    });
    console.log(`Admin user seeded/updated: ${admin.email} / ${password}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
