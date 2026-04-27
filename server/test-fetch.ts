import { PrismaClient } from '@prisma/client';
import { rssService } from './src/services/rss';
import { store } from './src/services/store';

const prisma = new PrismaClient();

async function run() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) return console.log("No user.");
        const userId = user.id;

        const userFeeds = await prisma.userFeed.findMany({ where: { userId, isActive: true } });
        console.log(`Loaded ${userFeeds.length} user feeds.`);
        
        const feedSources = userFeeds.map(feed => ({ url: feed.url, sourceType: 'user' as const, userId, category: feed.category }));
        
        // Mock updateFeeds logic
        const fetchPromises = feedSources.map(async (feedSource) => {
            try {
                const items = await rssService.fetchFeed(feedSource.url);
                return { feedSource, items, status: 'fulfilled' as const };
            } catch (error) {
                return { feedSource, error, status: 'rejected' as const };
            }
        });

        const results = await Promise.allSettled(fetchPromises);
        let totalItems = 0;
        let successfulFeeds = 0;
        let activeUrls = new Set(userFeeds.map(f => f.url));
        
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
                const items = result.value.items;
                const sourceUrl = result.value.feedSource.url;
                totalItems += items.length;
                if (items.length > 0) successfulFeeds++;
                
                for (let item of items) {
                     store.addArticle({ ...item, id: Math.random().toString(), link: item.link || Math.random().toString(), sourceUrl, sourceType: 'user', summary: '', topic: '', why: '', timeToRead: '' } as any);
                }
            } else {
                console.log("Failed to fetch a feed", result.status === 'fulfilled' ? result.value.error : result.reason);
            }
        }
        console.log(`Successfully fetched ${totalItems} items across ${successfulFeeds} feeds.`);

        const visible = store.getArticles().filter(a => a.sourceUrl && activeUrls.has(a.sourceUrl));
        console.log(`Visible articles via activeUrls filter: ${visible.length}`);
        
    } finally {
        await prisma.$disconnect();
    }
}
run();
