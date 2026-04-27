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
}

export interface SystemFeed {
    url: string;
    name: string;
    category: string;
}

export const SYSTEM_FEEDS: SystemFeed[] = [
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News', category: 'World' },
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'World' },
    { url: 'http://feeds.reuters.com/reuters/topNews', name: 'Reuters Top News', category: 'World' },
    { url: 'https://rss.cnn.com/rss/cnn_topstories.rss', name: 'CNN Top Stories', category: 'World' },
    { url: 'https://www.yahoo.com/news/rss', name: 'Yahoo News', category: 'World' },

    { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'Technology' },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'Technology' },
    { url: 'https://www.wired.com/rss/', name: 'Wired', category: 'Technology' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NYT Technology', category: 'Technology' },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Technology', category: 'Technology' },
    { url: 'https://rss.cnn.com/rss/cnn_tech.rss', name: 'CNN Technology', category: 'Technology' },

    { url: 'http://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', category: 'Business' },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC', category: 'Business' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', category: 'Business' },
    { url: 'https://rss.cnn.com/rss/edition_business.rss', name: 'CNN Business', category: 'Business' },

    { url: 'https://feeds.sciencedaily.com/sciencedaily/top_news/rss.xml', name: 'ScienceDaily Top', category: 'Science' },
    { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'ScienceDaily All', category: 'Science' },
    { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', name: 'BBC Science', category: 'Science' },

    { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu National', category: 'India' },
    { url: 'https://www.thehindu.com/sport/?service=rss', name: 'The Hindu Sports', category: 'India' },
    { url: 'https://timesofindia.indiatimes.com/rss.cms', name: 'Times of India', category: 'India' },
    { url: 'https://indianexpress.com/feed/', name: 'Indian Express', category: 'India' },
    { url: 'https://indianexpress.com/section/business/feed/', name: 'Indian Express Business', category: 'India' },
    { url: 'https://www.firstpost.com/feed', name: 'Firstpost', category: 'India' },
    { url: 'https://www.abplive.com/news/world/feed', name: 'ABP World', category: 'India' },
    { url: 'https://www.hindustantimes.com/rss/latest-news/rssfeed.xml', name: 'Hindustan Times', category: 'India' },
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
