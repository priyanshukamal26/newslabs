/// <reference path="../types.d.ts" />
import Parser from 'rss-parser';

import he from 'he';

const parser = new Parser();

export interface FeedItem {
    title?: string;
    link?: string;
    content?: string;
    contentSnippet?: string;
    pubDate?: string;
    source?: string;
    sourceUrl?: string;
}

export class RssService {
    async fetchFeed(url: string): Promise<FeedItem[]> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.text();

            if (typeof data !== 'string') {
                 // Handle cases where response might be an object
                 throw new Error('Response data is not a string');
            }

            const feed = await (parser as any).parseString(data);
            
            console.log(`Fetched ${feed.items.length} items from ${feed.title || url}`);
            return feed.items.map((item: any) => ({
                title: item.title ? he.decode(item.title) : undefined,
                link: item.link,
                content: item.content,
                contentSnippet: item.contentSnippet ? he.decode(item.contentSnippet) : undefined,
                pubDate: item.pubDate,
                source: feed.title || 'Unknown Source',
                sourceUrl: url,
            }));
        } catch (error: any) {
            console.error(`Error fetching feed ${url}:`, error.message);
            return [];
        }
    }
}

export const rssService = new RssService();
