import { FeedItem } from './rss';

export interface Article extends FeedItem {
    id: string;
    summary: string;
    topic: string;
    topics?: string[];
    why: string;
    insights: string[];
    timeToRead: string;
    isRead?: boolean;
    isSaved?: boolean;
    isLiked?: boolean;
    likes: number;
    categorizing?: boolean;
    sourceType: 'system' | 'user';
    sourceUrl?: string;
    sourceOwnerUserId?: string | null;
    feedCategory?: string | null;
    // NLP enrichment fields (optional, populated on article creation)
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    sentimentScore?: number;
    sentimentSignals?: string[];
    articleType?: 'Opinion' | 'Factual';
    articleTypeConfidence?: number;
    opinionSignals?: string[];
    reliability?: number;
    reliabilityTier?: 'High' | 'Medium' | 'Low';
    reliabilitySignals?: string[];
    classificationConfidence?: number;
    secondaryTags?: string[];
    primaryCategory?: string;   // stable NLP model category (never overwritten by AI)
    classificationSignals?: string[];
    biasIndicator?: 'Neutral' | 'Slightly Opinionated' | 'Strongly Opinionated';
}

export interface SystemFeed {
    url: string;
    name: string;
    category: string;
    reliability: number;
}

export const SYSTEM_FEEDS: SystemFeed[] = [
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News', category: 'World Affairs', reliability: 9 },
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'World Affairs', reliability: 8 },
    { url: 'http://feeds.reuters.com/reuters/topNews', name: 'Reuters Top News', category: 'World Affairs', reliability: 7 },
    { url: 'https://rss.cnn.com/rss/cnn_topstories.rss', name: 'CNN Top Stories', category: 'World Affairs', reliability: 7 },
    { url: 'https://www.yahoo.com/news/rss', name: 'Yahoo News', category: 'World Affairs', reliability: 7 },

    { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'Technology', reliability: 9 },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'Technology', reliability: 8 },
    { url: 'https://www.wired.com/rss/', name: 'Wired', category: 'Technology', reliability: 7 },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NYT Technology', category: 'Technology', reliability: 5 },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Technology', category: 'Technology', reliability: 8 },
    { url: 'https://rss.cnn.com/rss/cnn_tech.rss', name: 'CNN Technology', category: 'Technology', reliability: 6 },
    { url: 'https://www.xda-developers.com/feed/', name: 'XDA-Developers', category: 'Technology', reliability: 8 },

    { url: 'http://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', category: 'Business & Finance', reliability: 8 },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC', category: 'Business & Finance', reliability: 7 },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', category: 'Business & Finance', reliability: 8 },
    { url: 'https://rss.cnn.com/rss/edition_business.rss', name: 'CNN Business', category: 'Business & Finance', reliability: 6 },

    { url: 'https://feeds.sciencedaily.com/sciencedaily/top_news/rss.xml', name: 'ScienceDaily Top', category: 'Science & Space', reliability: 6 },
    { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'ScienceDaily All', category: 'Science & Space', reliability: 7 },
    { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', name: 'BBC Science', category: 'Science & Space', reliability: 8 },

    { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu National', category: 'India', reliability: 6 },
    { url: 'https://www.thehindu.com/sport/?service=rss', name: 'The Hindu Sports', category: 'India', reliability: 6 },
    { url: 'https://timesofindia.indiatimes.com/rss.cms', name: 'Times of India', category: 'India', reliability: 5 },
    { url: 'https://indianexpress.com/feed/', name: 'Indian Express', category: 'India', reliability: 5 },
    { url: 'https://indianexpress.com/section/business/feed/', name: 'Indian Express Business', category: 'India', reliability: 6 },
    { url: 'https://www.firstpost.com/feed', name: 'Firstpost', category: 'India', reliability: 6 },
    { url: 'https://www.abplive.com/news/world/feed', name: 'ABP World', category: 'India', reliability: 5 },
    { url: 'https://www.hindustantimes.com/rss/latest-news/rssfeed.xml', name: 'Hindustan Times', category: 'India', reliability: 5 },
];

export class Store {
    private articles: Article[] = [];
    private feeds: string[] = SYSTEM_FEEDS.map(f => f.url);
    private maxArticles = 5000;

    addArticle(article: Article) {
        const exists = this.articles.find(a => a.link === article.link);
        if (exists) return;

        this.articles.unshift(article);
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

    getSystemFeeds() {
        return SYSTEM_FEEDS;
    }

    getArticleCount() {
        return this.articles.length;
    }
}

export const store = new Store();
