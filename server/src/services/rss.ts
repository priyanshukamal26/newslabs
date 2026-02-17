/// <reference path="../types.d.ts" />
import Parser from 'rss-parser';

const parser = new Parser();

export interface FeedItem {
    title?: string;
    link?: string;
    content?: string;
    contentSnippet?: string;
    pubDate?: string;
    source?: string;
}

export class RssService {
    async fetchFeed(url: string): Promise<FeedItem[]> {
        try {
            const feed = await parser.parseURL(url);
            console.log(`Fetched ${feed.items.length} items from ${feed.title}`);
            return feed.items.map((item: any) => ({
                title: item.title,
                link: item.link,
                content: item.content,
                contentSnippet: item.contentSnippet,
                pubDate: item.pubDate,
                source: feed.title || 'Unknown Source'
            }));
        } catch (error) {
            console.error(`Error fetching feed ${url}:`, error);
            return [];
        }
    }
}

export const rssService = new RssService();
