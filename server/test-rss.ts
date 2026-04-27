import { rssService } from './src/services/rss';

async function test() {
    try {
        const url = 'https://www.dnaindia.com/feeds/india.xml';
        console.log(`Fetching from ${url}...`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Text preview:", text.substring(0, 100));

        const Parser = require('rss-parser');
        const parser = new Parser();
        const feed = await parser.parseString(text);
        console.log("Feed items:", feed.items.length);
        if (feed.items.length > 0) {
            console.log("First item:", JSON.stringify(feed.items[0], null, 2));
        }
    } catch (err) {
        console.error("Error fetching feed:", err);
    }
}

test();
