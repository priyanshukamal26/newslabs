import { PrismaClient } from '@prisma/client';
import { testDispatch } from './services/scheduler.service';
import { sendTelegram } from './services/notifier.service';

const prisma = new PrismaClient();

async function run() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found");
            return;
        }
        
        console.log(`Testing dispatch for user ${user.id}`);
        const result = await testDispatch(user.id, 'telegram');
        console.log("Success:", result);
    } catch (e: any) {
        console.error("Error thrown by testDispatch:", e.message);
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
