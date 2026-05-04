const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to add column "reliability" to "UserFeed" table...');
    await prisma.$executeRawUnsafe('ALTER TABLE "UserFeed" ADD COLUMN "reliability" INTEGER DEFAULT 5');
    console.log('Successfully added column "reliability".');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Column "reliability" already exists.');
    } else {
      console.error('Failed to add column:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
