import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

// Early connection attempt with basic retry logic
if (process.env.NODE_ENV === 'production') {
    const connectWithRetry = async (retries = 5) => {
        for (let i = 0; i < retries; i++) {
            try {
                await prisma.$connect();
                console.log('[DB] Connected successfully');
                return;
            } catch (err) {
                console.error(`[DB] Connection attempt ${i + 1} failed:`, (err as any).message);
                if (i === retries - 1) throw err;
                await new Promise(res => setTimeout(res, 5000));
            }
        }
    };
    connectWithRetry().catch(err => console.error('[DB] Final connection failure:', err.message));
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
