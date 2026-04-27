import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Adding summaryMode to User...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "summaryMode" text NOT NULL DEFAULT 'balanced'`);
        console.log("Success.");
    } catch(e) {
        console.error("Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
