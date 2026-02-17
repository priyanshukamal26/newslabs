import { rssService } from '../services/rss';
import { aiService } from '../services/ai';

async function main() {
    console.log('Testing RSS Service...');
    const feedUrl = 'https://feeds.feedburner.com/TechCrunch/'; // Example feed
    const items = await rssService.fetchFeed(feedUrl);
    console.log(`Fetched ${items.length} items.`);

    if (items.length > 0 && items[0].contentSnippet) {
        console.log('\nTesting AI Service with first article...');
        console.log(`Title: ${items[0].title}`);

        // Mocking Ollama call if it's not running or just to test flow
        // In real usage, this will call Ollama
        try {
            const analysis = await aiService.summarize(items[0].contentSnippet);
            console.log('AI Analysis Result:', JSON.stringify(analysis, null, 2));
        } catch (e) {
            console.error("AI Service failed (is Ollama running?)", e);
        }
    }
}

main().catch(console.error);
