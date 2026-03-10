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
    private maxArticles = 5000;

    // constructor() {
    //     // More RSS feeds for broader coverage
    //     this.feeds.push('https://techcrunch.com/feed/');
    //     this.feeds.push('https://www.theverge.com/rss/index.xml');
    //     this.feeds.push('https://feeds.arstechnica.com/arstechnica/index');
    //     this.feeds.push('https://www.wired.com/feed/rss');
    //     this.feeds.push('https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml');
    //     this.feeds.push('https://feeds.bbci.co.uk/news/technology/rss.xml');
    //     this.feeds.push('https://www.sciencedaily.com/rss/all.xml');
    //     this.feeds.push('https://lifehacker.com/feed/rss');
    // }

    constructor() {
        // =======================
        // 🌍 GENERAL & WORLD NEWS
        // =======================

        // BBC News - Top Stories
        // Highly trusted UK public broadcaster. Balanced global coverage across politics,
        // world affairs, economics, conflicts, and breaking international events.
        this.feeds.push('https://feeds.bbci.co.uk/news/rss.xml');

        // BBC News - World
        // Dedicated international coverage. Diplomacy, geopolitics, wars,
        // global crises, multinational policy developments.
        this.feeds.push('https://feeds.bbci.co.uk/news/world/rss.xml');

        // Reuters - Top News
        // One of the most neutral global wire services. Fast, fact-based reporting.
        // Widely used by financial institutions, governments, and media houses.
        this.feeds.push('http://feeds.reuters.com/reuters/topNews');

        // CNN - Top Stories
        // US-based global broadcaster. Breaking news, politics,
        // global developments, and international affairs.
        this.feeds.push('https://rss.cnn.com/rss/cnn_topstories.rss');

        // Yahoo News - Latest
        // Aggregated global headlines from multiple partner publications.
        // Good for diversity and broader perspective.
        this.feeds.push('https://www.yahoo.com/news/rss');


        // =======================
        // 💻 TECHNOLOGY
        // =======================

        // TechCrunch (Official main feed)
        // Startup ecosystem, funding rounds, venture capital,
        // AI tools, SaaS, big tech acquisitions, product launches.
        this.feeds.push('https://techcrunch.com/feed/');

        // The Verge
        // Consumer technology, gadgets, product launches,
        // Apple/Google/Microsoft ecosystem coverage, tech culture.
        this.feeds.push('https://www.theverge.com/rss/index.xml');

        // Ars Technica
        // Deep technical journalism: cybersecurity, hardware,
        // operating systems, research-level analysis, space & science tech.
        this.feeds.push('https://feeds.arstechnica.com/arstechnica/index');

        // Wired (Official RSS)
        // Technology + culture + AI + long-form investigative reporting.
        // Focuses on digital society and emerging innovations.
        this.feeds.push('https://www.wired.com/rss/');

        // New York Times - Technology
        // Big tech regulation, AI governance, Silicon Valley policy,
        // corporate investigations, digital ethics.
        this.feeds.push('https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml');

        // BBC - Technology
        // Global tech regulation, cybersecurity issues,
        // internet safety, digital transformation.
        this.feeds.push('https://feeds.bbci.co.uk/news/technology/rss.xml');

        // CNN - Technology
        // US and global tech trends, AI updates,
        // product releases, breaking technology news.
        this.feeds.push('https://rss.cnn.com/rss/cnn_tech.rss');

        // Lifehacker
        // Productivity tools, consumer apps, digital lifestyle,
        // practical tech usage tips for everyday users.
        this.feeds.push('https://lifehacker.com/feed/rss');


        // =======================
        // 💼 BUSINESS & FINANCE
        // =======================

        // Reuters - Business
        // Markets, stock movement, corporate earnings,
        // mergers, macroeconomic developments.
        this.feeds.push('http://feeds.reuters.com/reuters/businessNews');

        // CNBC - Business
        // Global markets, investment analysis,
        // stock market commentary, financial strategy.
        this.feeds.push('https://www.cnbc.com/id/100003114/device/rss/rss.html');

        // BBC - Business
        // Global economic trends, trade policy,
        // employment data, corporate and small business reporting.
        this.feeds.push('https://feeds.bbci.co.uk/news/business/rss.xml');

        // CNN - Business (International)
        // International market news, economy,
        // corporate movements, financial analysis.
        this.feeds.push('https://rss.cnn.com/rss/edition_business.rss');


        // =======================
        // 🧬 SCIENCE & HEALTH
        // =======================

        // ScienceDaily - Top Research News
        // Academic research summaries, peer-reviewed findings,
        // medical breakthroughs, scientific innovations.
        this.feeds.push('https://feeds.sciencedaily.com/sciencedaily/top_news/rss.xml');

        // ScienceDaily - All Topics
        // Broader science coverage: health, physics,
        // climate science, neuroscience, environment.
        this.feeds.push('https://www.sciencedaily.com/rss/all.xml');

        // BBC - Science & Environment
        // Climate change policy, environmental studies,
        // global scientific discoveries, sustainability reporting.
        this.feeds.push('https://feeds.bbci.co.uk/news/science_and_environment/rss.xml');


        // =======================
        // ⚽ SPORTS
        // =======================

        // ESPN - General Sports
        // Global sports coverage: football (soccer), cricket,
        // NBA, tennis, Formula 1, international tournaments.
        this.feeds.push('https://sports.espn.go.com/espn/rss/news');


        // =======================
        // 🇮🇳 INDIAN NEWS SOURCES
        // =======================

        // Times of India - Main Feed
        // One of India's largest newspapers. National politics,
        // regional news, business, international coverage.
        this.feeds.push('https://timesofindia.indiatimes.com/rss.cms');

        // NDTV - Latest News
        // Indian politics, business, technology,
        // global affairs, policy developments.
        this.feeds.push('https://feeds.feedburner.com/NDTV-LatestNews');

        // Indian Express - Full Feed
        // Investigative journalism, governance analysis,
        // public policy, legal developments.
        this.feeds.push('https://indianexpress.com/feed/');

        // Firstpost
        // Indian politics, opinion pieces,
        // technology coverage, global commentary.
        this.feeds.push('https://www.firstpost.com/feed');

        // ABP News - Home
        // Indian national and regional news,
        // mass audience political reporting.
        this.feeds.push('https://www.abplive.com/home/feed');

        // ABP - India
        // India-focused national news updates.
        this.feeds.push('https://www.abplive.com/news/india/feed');

        // ABP - World
        // International coverage from Indian perspective.
        this.feeds.push('https://www.abplive.com/news/world/feed');

        // ABP - Sports
        // Indian + international sports coverage.
        this.feeds.push('https://www.abplive.com/sports/feed');

        // ABP - Bollywood
        // Indian entertainment industry, film releases,
        // celebrity news.
        this.feeds.push('https://www.abplive.com/entertainment/bollywood/feed');

        // Hindustan Times - Latest
        // Indian national news, business,
        // lifestyle, metro city reporting.
        this.feeds.push('https://www.hindustantimes.com/rss/latest-news/rssfeed.xml');
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
