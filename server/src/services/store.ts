import { FeedItem } from './rss';

export interface Article extends FeedItem {
    id: string;
    summary: string;
    topic: string;
    why: string;
    insights: string[];
    timeToRead: string;
    isRead?: boolean;
    isSaved?: boolean;
    isLiked?: boolean;
    likes: number;
    categorizing?: boolean;
}

export class Store {
    private articles: Article[] = [];
    private feeds: string[] = [];
    private maxArticles = 150;

    constructor() {
        // More RSS feeds for broader coverage
        this.feeds.push('https://techcrunch.com/feed/');
        this.feeds.push('https://www.theverge.com/rss/index.xml');
        this.feeds.push('https://feeds.arstechnica.com/arstechnica/index');
        this.feeds.push('https://www.wired.com/feed/rss');
        this.feeds.push('https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml');
        this.feeds.push('https://feeds.bbci.co.uk/news/technology/rss.xml');
        this.feeds.push('https://www.sciencedaily.com/rss/all.xml');
        this.feeds.push('https://lifehacker.com/feed/rss');
    }

    addArticle(article: Article) {
        // Don't add duplicates
        const exists = this.articles.find(a => a.link === article.link);
        if (exists) return;

        this.articles.unshift(article); // newest first

        // Trim to max but keep at least 100
        if (this.articles.length > this.maxArticles) {
            this.articles = this.articles.slice(0, this.maxArticles);
        }
    }

    getArticles() {
        return this.articles;
    }

    getArticleById(id: string) {
        return this.articles.find(a => a.id === id) || null;
    }

    updateArticle(id: string, fields: Partial<Article>) {
        const article = this.articles.find(a => a.id === id);
        if (article) {
            Object.assign(article, fields);
        }
        return article;
    }

    getFeeds() {
        return this.feeds;
    }

    getArticleCount() {
        return this.articles.length;
    }
}

export const store = new Store();
