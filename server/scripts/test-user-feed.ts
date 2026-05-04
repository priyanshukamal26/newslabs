import { PrismaClient } from '@prisma/client';
import { rssService } from './src/services/rss';

const prisma = new PrismaClient();

async function run() {
    try {
        const userFeeds = await prisma.userFeed.findMany({ where: { isActive: true } });
        console.log(`Found ${userFeeds.length} user feeds active`);
        
        for (const feed of userFeeds) {
             console.log(`Fetching from user feed: ${feed.url}`);
             const items = await rssService.fetchFeed(feed.url);
             console.log(`Fetched ${items.length} items from ${feed.url}`);
             if (items.length > 0) {
                 console.log(`First item: ${items[0].title} | Link: ${items[0].link}`);
             }
        }
    } catch (err) {
        console.error("error", err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
