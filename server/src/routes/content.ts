import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { store, Article } from '../services/store';
import { rssService } from '../services/rss';
import { aiService } from '../services/ai';
import { nlpService } from '../services/nlp';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '../middleware/auth';
import { decryptText } from '../services/crypto';
import { v4 as uuidv4 } from 'uuid';
import natural from 'natural';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const categoryKeywords: Record<string, string[]> = {
    "AI & ML": ["ai", "artificial intelligence", "machine learning", "deep learning", "neural", "llm", "gpt", "chatgpt", "openai", "anthropic", "gemini", "copilot", "model", "transformer", "groq", "claude", "diffusion", "generative", "nlp", "computer vision", "training", "inference", "agent", "rag", "prompt", "chatbot", "automation", "algorithm", "dataset", "mistral", "perplexity", "stable diffusion", "midjourney", "text to image"],

    "Science & Space": ["science", "research", "study", "discovery", "physics", "chemistry", "biology", "genome", "dna", "evolution", "experiment", "laboratory", "scientist", "nature", "cell", "quantum", "molecule", "fossil", "species", "organism", "ecology", "marine", "conservation", "biodiversity", "neuroscience", "cognitive", "gene", "protein", "bacteria", "virus", "mutation", "enzyme", "microscope", "telescope", "particle", "radiation", "element", "coral", "forest", "extinct", "mammal", "reptile", "amphibian", "insect", "bird", "wildlife", "animal", "plant", "tree", "ocean", "sea", "nasa", "spacex", "rocket", "satellite", "mars", "moon", "orbit", "astronaut", "galaxy", "asteroid", "launch", "cosmic", "starship", "isro", "chandrayaan", "gaganyaan", "jwst", "james webb", "hubble", "black hole", "supernova", "comet", "solar system", "exoplanet", "iss", "space station", "spacewalk", "lunar"],
    "Startups": ["startup", "founder", "venture", "funding", "seed", "series a", "series b", "ipo", "valuation", "unicorn", "accelerator", "incubator", "entrepreneur", "pitch", "y combinator", "techstars", "angel investor", "pre-seed", "series c", "fundraise", "raise", "mvp", "product market fit", "bootstrapped"],

    "Security": ["security", "hack", "breach", "vulnerability", "malware", "phishing", "ransomware", "encryption", "firewall", "cyber", "privacy", "zero-day", "exploit", "password", "authentication", "scam", "fraud", "data leak", "data breach", "spyware", "ddos", "botnet", "social engineering", "2fa", "mfa", "ssl", "tls", "certificate", "vpn", "threat intelligence", "penetration testing", "bug bounty", "cve", "patch", "identity theft", "surveillance", "backdoor", "trojan"],
    "Politics": ["politics", "election", "government", "congress", "senate", "president", "legislation", "policy", "democrat", "republican", "vote", "campaign", "regulation", "law", "court", "parliament", "biden", "trump", "minister", "diplomatic", "sanctions", "treaty", "nato", "un", "united nations", "geopolitics", "summit", "referendum", "coalition", "opposition", "ruling party", "white house", "kremlin"],
    "Business & Finance": ["business", "revenue", "profit", "market", "stock", "earnings", "ceo", "acquisition", "merger", "layoff", "company", "enterprise", "corporate", "industry", "economy", "trade", "gdp", "sensex", "nifty", "inflation", "bank", "rbi", "fed", "interest rate", "fiscal", "quarterly results", "wall street", "nasdaq", "nyse", "shares", "dividend", "ipo", "deal", "partnership", "contract", "supply chain", "manufacturing", "retail", "ecommerce", "amazon", "apple", "google", "microsoft", "meta", "tesla"],
    "Health": ["health", "medical", "doctor", "hospital", "disease", "treatment", "vaccine", "drug", "fda", "clinical", "patient", "diagnosis", "surgery", "mental health", "wellness", "fitness", "cancer", "covid", "pandemic", "symptoms", "therapy", "medicine", "pharmaceutical", "who", "world health organization", "cdc", "epidemic", "outbreak", "nutrition", "diet", "obesity", "diabetes", "heart", "lung", "brain", "blood", "chronic", "rare disease", "drug trial", "gene therapy"],
    "Sports": ["sports", "nba", "nfl", "mlb", "soccer", "football", "basketball", "tennis", "golf", "olympics", "championship", "tournament", "athlete", "coach", "game", "match", "score", "cricket", "ipl", "bcci", "kohli", "dhoni", "rohit", "messi", "ronaldo", "fifa", "wpl", "formula 1", "f1", "ufc", "boxing", "wrestling", "rugby", "hockey", "badminton", "marathon", "cycling", "swimming", "gymnastics", "league", "cup", "trophy", "semifinal", "final", "quarterfinal", "goal", "wicket", "innings", "penalty", "transfer window", "squad", "manager"],
    "Entertainment": ["movie", "film", "tv", "show", "netflix", "streaming", "music", "album", "concert", "celebrity", "actor", "director", "oscar", "emmy", "gaming", "playstation", "xbox", "nintendo", "bollywood", "hollywood", "actress", "cinema", "box office", "trailer", "series", "episode", "season", "premiere", "review", "award", "grammy", "bafta", "cannes", "sundance", "anime", "manga", "video game", "esports", "twitch", "youtube", "spotify", "apple music", "record label", "pop star", "rapper", "band", "debut"],
    "Climate & Environment": ["climate", "carbon", "emissions", "renewable", "solar", "wind", "energy", "sustainability", "pollution", "warming", "environmental", "green", "electric vehicle", "ev", "battery", "weather", "storm", "wildfire", "flood", "drought", "heatwave", "glacier", "arctic", "deforestation", "biodiversity", "net zero", "carbon footprint", "fossil fuel", "coal", "oil", "gas", "green energy", "paris agreement", "cop", "ipcc", "methane", "ozone", "sea level"],

    "India": ["india", "indian", "modi", "narendra modi", "pm modi", "bjp", "bharatiya janata party", "congress", "indian national congress", "rahul gandhi", "sonia gandhi", "priyanka gandhi", "amit shah", "rajnath singh", "nirmala sitharaman", "s jaishankar", "delhi", "new delhi", "mumbai", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad", "pune", "rupee", "rbi", "niti aayog", "finance ministry", "tata group", "reliance", "adani group", "infosys", "wipro", "tcs", "hdfc", "sbi", "bcci", "virat kohli", "rohit sharma", "ms dhoni", "team india", "bollywood", "tollywood", "indian cinema"],
    "World Affairs": ["war", "conflict", "attack", "strike", "missile", "troops", "army", "military", "ceasefire", "invasion", "bombing", "airstrike", "refugee", "displaced", "humanitarian", "crisis", "famine", "drought", "protest", "riot", "unrest", "revolution", "coup", "iran", "russia", "ukraine", "israel", "gaza", "china", "taiwan", "korea", "north korea", "middle east", "africa", "europe", "latin america", "southeast asia", "diplomat", "embassy", "foreign minister", "bilateral", "trade war", "sanctions", "nato", "g7", "g20", "un security council", "peacekeeping"],
    "General": ["report", "exclusive", "reveal", "investigation", "analysis", "opinion", "comment", "interview", "profile", "obituary", "correction", "update", "breaking", "latest"]
};

const sourceBias: Record<string, string> = {
    "sciencedaily": "Science & Space",
    "science daily": "Science & Space",
    "espn": "Sports",
    "techcrunch": "AI & ML",

    "bloomberg": "Business & Finance",
    "financial times": "Business & Finance",
    "forbes": "Business & Finance",
    "wired": "AI & ML",
    "the verge": "AI & ML",
    "the hindu": "India",
    "indian express": "India",
    "hindustan times": "India",
    "ndtv": "India",
    "times of india": "India",
    "india today": "India",
};

const NLP_CONFIDENCE_THRESHOLD = 0.25;
const NLP_SOFT_CATEGORIES = new Set([]);
const NLP_SOFT_THRESHOLD = 0.40;

// ── NLP-powered article classification ────────────────────────────────────────
// Primary classification now uses the TF-IDF + LogReg model via nlpService.
// The categoryKeywords map above is still used for secondary tag extraction
// inside nlpService itself (keyword fallback + secondary tag derivation).

function categorizeArticle(
    title: string,
    contentStr?: string,
    sourceName?: string
): { primary: string; topics: string[]; confidence: number; secondaryTags: string[]; classificationSignals: string[] } {
    const result = nlpService.classifyArticle(title, contentStr || '', sourceName);
    return {
        primary: result.primary,
        topics: [result.primary, ...result.secondaryTags],
        confidence: result.confidence,
        secondaryTags: result.secondaryTags,
        classificationSignals: result.classificationSignals || [],
    };
}

export function getNlpStatus() {
    return nlpService.getStatus();
}

async function ensureUserFeedsInitialized(userId: string): Promise<void> {
    const count = await prisma.userFeed.count({ where: { userId } });
    if (count > 0) return;

    const defaults = store.getSystemFeeds();
    await prisma.userFeed.createMany({
        data: defaults.map(feed => ({ userId, url: feed.url, displayName: feed.name, category: feed.category, isActive: true })),
        skipDuplicates: true,
    });
}

export async function contentRoutes(server: FastifyInstance) {
    const calculateReadingTime = (text: string): string => {
        const wordCount = (text || '').split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} min`;
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


    const updateFeeds = async (feedSources: Array<{ url: string; sourceType: 'system' | 'user'; userId?: string; category?: string | null; reliability?: number }>) => {
        const feeds = feedSources;
        const newArticleIds: string[] = [];

        const results = [];
        const chunkSize = 4; // Fetch feeds in chunks of 4 to prevent DNS timeout and socket exhaustion
        
        for (let i = 0; i < feeds.length; i += chunkSize) {
            const chunk = feeds.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async (feedSource) => {
                try {
                    console.log(`[updateFeeds] Fetching ${feedSource.url}`);
                    const items = await rssService.fetchFeed(feedSource.url);
                    console.log(`[updateFeeds] Received ${items.length} from ${feedSource.url}`);
                    return { feedSource, items, status: 'fulfilled' as const };
                } catch (error) {
                    console.log(`[updateFeeds] Exception on ${feedSource.url}`, error);
                    return { feedSource, error, status: 'rejected' as const };
                }
            });
            const chunkResults = await Promise.allSettled(chunkPromises);
            results.push(...chunkResults);
            
            // tiny delay between chunks just to be safe
            if (i + chunkSize < feeds.length) {
                await delay(300);
            }
        }

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
                const items = result.value.items;
                const feedSource = result.value.feedSource;
                for (const item of items) {
                    const exists = store.getArticles().find(a => a.link === item.link);
                    if (!exists) {
                        const id = uuidv4();
                        const timeToRead = calculateReadingTime(item.contentSnippet || item.content || '');
                        const feedTitle = (items as any)?.feedTitle || (items as any)?.[0]?.feedTitle || '';
                        const text = item.title || '';
                        const body = item.contentSnippet || item.content || '';

                        // NLP enrichment (async/sync mix)
                        const classification = categorizeArticle(text, body, feedTitle);
                        const sentimentResult = await nlpService.analyzeSentiment(`${text} ${body}`);
                        const opinionResult = nlpService.detectOpinionVsFact(text, body);
                        const reliabilityResult = nlpService.scoreReliability(text, body, feedTitle || item.source || '', item.pubDate, feedSource.reliability);

                        let biasIndicator: 'Neutral' | 'Slightly Opinionated' | 'Strongly Opinionated' = 'Neutral';
                        if (opinionResult.type === 'Opinion') {
                            biasIndicator = opinionResult.confidence > 0.75 ? 'Strongly Opinionated' : 'Slightly Opinionated';
                        } else if (sentimentResult.score < -0.5 || sentimentResult.score > 0.5) {
                            biasIndicator = 'Slightly Opinionated';
                        }

                        store.addArticle({
                            ...item,
                            id,
                            summary: "Click to analyze",
                            topic: classification.primary,
                            topics: classification.topics,
                            why: "Pending analysis",
                            insights: [],
                            timeToRead,
                            likes: 0,
                            categorizing: false,
                            sourceType: feedSource.sourceType,
                            sourceUrl: feedSource.url,
                            sourceOwnerUserId: feedSource.sourceType === 'user' ? (feedSource.userId || null) : null,
                            feedCategory: feedSource.category || null,
                            // NLP fields
                            sentiment: sentimentResult.sentiment,
                            sentimentScore: sentimentResult.score,
                            sentimentSignals: sentimentResult.signals,
                            articleType: opinionResult.type,
                            articleTypeConfidence: opinionResult.confidence,
                            opinionSignals: opinionResult.signals,
                            reliability: reliabilityResult.score,
                            reliabilityTier: reliabilityResult.tier,
                            reliabilitySignals: reliabilityResult.signals,
                            classificationConfidence: classification.confidence,
                            secondaryTags: classification.secondaryTags,
                            primaryCategory: classification.primary,
                            classificationSignals: classification.classificationSignals,
                            biasIndicator,
                        } as Article);
                        newArticleIds.push(id);
                    } else {
                        // Optionally debug log why it might be skipped
                        // console.log("Skipped duplicate link", item.link);
                    }
                }
            }
        }

        if (newArticleIds.length > 0) {
            console.log(`[NLP] Enriched ${newArticleIds.length} new articles.`);
        }

        return newArticleIds.length;
    };

    server.get('/feed', async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = getUserIdFromRequest(request);
        let userFeeds: Array<{ url: string; category: string | null; isActive: boolean; reliability: number }> = [];
        if (userId) {
            await ensureUserFeedsInitialized(userId);
            userFeeds = await prisma.userFeed.findMany({ where: { userId }, select: { url: true, category: true, isActive: true, reliability: true } });
        }
        
        const feedSources = userId
            ? userFeeds.filter(f => f.isActive).map(feed => ({ url: feed.url, sourceType: 'user' as const, userId: userId || undefined, category: feed.category, reliability: feed.reliability }))
            : store.getSystemFeeds().map(feed => ({ url: feed.url, sourceType: 'system' as const, category: feed.category, reliability: feed.reliability }));

        // Always fire-and-forget — articles stream in progressively as feeds resolve.
        // The frontend polls every 2s when the store is empty, so users see articles
        // appearing feed-by-feed rather than waiting for all feeds to complete.
        void updateFeeds(feedSources);

        if (userId) {
            const activeUrls = new Set(userFeeds.filter(f => f.isActive).map(f => f.url));
            return store.getArticles().filter(a => a.sourceUrl && activeUrls.has(a.sourceUrl));
        } else {
            return store.getArticles().filter(a => a.sourceType === 'system');
        }
    });

    server.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = getUserIdFromRequest(request);
        let userFeeds: Array<{ url: string; category: string | null; isActive: boolean; reliability: number }> = [];
        if (userId) {
            await ensureUserFeedsInitialized(userId);
            userFeeds = await prisma.userFeed.findMany({ where: { userId }, select: { url: true, category: true, isActive: true, reliability: true } });
        }
        
        console.log(`[refresh] Triggered by userId: ${userId}, loaded ${userFeeds.length} user feeds.`);

        const feedSources = userId
            ? userFeeds.filter(f => f.isActive).map(feed => ({ url: feed.url, sourceType: 'user' as const, userId: userId || undefined, category: feed.category, reliability: feed.reliability }))
            : store.getSystemFeeds().map(feed => ({ url: feed.url, sourceType: 'system' as const, category: feed.category, reliability: feed.reliability }));

        console.log(`[refresh] Built feedSources array of length: ${feedSources.length}`);

        const newCount = await updateFeeds(feedSources);
        
        let visibleCount = 0;
        if (userId) {
             const activeUrls = new Set(userFeeds.filter(f => f.isActive).map(f => f.url));
             visibleCount = store.getArticles().filter(a => a.sourceUrl && activeUrls.has(a.sourceUrl)).length;
        } else {
             visibleCount = store.getArticles().filter(a => a.sourceType === 'system').length;
        }

        console.log(`[refresh] Returned visibleCount: ${visibleCount}, newCount: ${newCount}`);
        return { message: 'Refreshed', count: visibleCount, newCount };
    });

    server.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id, summaryMode: requestedMode, forceMode, title, link } = request.body as {
            id: string;
            summaryMode?: 'concise' | 'balanced' | 'detailed';
            forceMode?: string;
            title?: string;
            link?: string;
        };
        let article = store.getArticles().find(a => a.id === id);

        if (!article && title) {
            // Reconstruct a minimal article for analysis if it was flushed from memory or never existed (e.g., old brief)
            article = {
                id,
                title,
                link: link || '',
                summary: "Click to analyze",
                topic: "News",
                contentSnippet: title,
                why: "",
                insights: [],
            } as unknown as Article;
        }

        if (!article) return reply.status(404).send({ error: 'Article not found' });

        // Return cached summary unless forced re-analysis
        if (article.summary !== "Click to analyze" && !forceMode && !requestedMode) return article;

        try {
            const userId = getUserIdFromRequest(request);
            let analysis;
            let fallbackUsed = false;

            // Determine user's saved summaryMode preference from DB
            let userSummaryMode: 'concise' | 'balanced' | 'detailed' = 'balanced';
            if (userId) {
                try {
                    const userRecord = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { summaryMode: true },
                    });
                    if (userRecord?.summaryMode) {
                        userSummaryMode = userRecord.summaryMode as 'concise' | 'balanced' | 'detailed';
                    }
                } catch { /* use default */ }
            }

            // Per-article override wins; otherwise use user's profile default
            const finalMode = requestedMode || userSummaryMode;

            if (userId) {
                const preference = await prisma.userAiPreference.findUnique({
                    where: { userId },
                    include: { activeCredential: true },
                });

                const hasVerifiedByok = Boolean(
                    preference?.byokEnabled &&
                    preference?.activeCredential &&
                    preference.activeCredential.isVerified
                );

                if (hasVerifiedByok && preference?.activeCredential) {
                    const timeoutMs = preference.timeoutDisabled ? undefined : preference.timeoutSeconds * 1000;
                    const customOptions = {
                        provider: preference.activeCredential.provider,
                        apiKey: decryptText(preference.activeCredential.encryptedApiKey),
                        model: preference.activeCredential.model,
                        baseUrl: preference.activeCredential.baseUrl || undefined,
                        timeoutMs,
                        disableTimeout: preference.timeoutDisabled,
                        summaryMode: finalMode,
                    };

                    try {
                        analysis = await aiService.summarizeStrict(article.contentSnippet || article.content || article.title || "", customOptions);
                    } catch (byokError) {
                        console.warn('BYOK failed, falling back to system AI:', byokError);
                        fallbackUsed = true;
                        analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "", {
                            provider: 'hybrid',
                            summaryMode: finalMode,
                            timeoutMs,
                            disableTimeout: preference.timeoutDisabled,
                        });
                    }
                } else {
                    // Authenticated user without BYOK — use their preferred provider + mode
                    const userProvider = (await prisma.user.findUnique({ where: { id: userId }, select: { aiProvider: true } }))?.aiProvider || 'hybrid';
                    analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "", {
                        provider: userProvider,
                        summaryMode: finalMode,
                        timeoutMs: 30000,
                    });
                }
            } else {
                analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "", {
                    provider: 'hybrid',
                    summaryMode: finalMode,
                    timeoutMs: 30000,
                });
            }

            // Only write-back to the in-memory cache if this is a normal analysis
            // (not a transient per-article mode override that differs from the cached version)
            const isOverride = requestedMode && requestedMode !== userSummaryMode;
            if (!isOverride || article.summary === "Click to analyze") {
                article.summary = analysis.summary;
                article.topic = analysis.topic;
                article.why = analysis.why;
                article.insights = analysis.insights;
            }

            return { ...article, summary: analysis.summary, insights: analysis.insights, why: analysis.why, topic: analysis.topic, usedSystemFallback: fallbackUsed };
        } catch (error) {
            console.error('Analysis failed:', error);
            return reply.status(500).send({ error: 'Analysis failed' });
        }
    });


    server.get('/trending', async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = getUserIdFromRequest(request);
        const articles = userId
            ? store.getArticles().filter(a => a.sourceType === 'system' || a.sourceOwnerUserId === userId)
            : store.getArticles().filter(a => a.sourceType === 'system');

        const titles = articles.slice(0, 50).map(a => a.title || '').filter(t => t.length > 5);

        if (titles.length === 0) {
            return { trends: ['Technology', 'Science', 'Innovation', 'AI', 'Research'] };
        }

        try {
            const trends = await aiService.analyzeTrending(titles);
            return { trends };
        } catch (error) {
            console.error("AI Trending failed", error);
            return { trends: ['Technology', 'Science', 'Innovation', 'AI', 'Research'] };
        }
    });

    server.get('/insights', async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = getUserIdFromRequest(request);
        const articles = userId
            ? store.getArticles().filter(a => a.sourceType === 'system' || a.sourceOwnerUserId === userId)
            : store.getArticles().filter(a => a.sourceType === 'system');

        const topicCounts: Record<string, number> = {};
        for (const a of articles) {
            const t = a.topic || 'Uncategorized';
            topicCounts[t] = (topicCounts[t] || 0) + 1;
        }

        const sorted = Object.entries(topicCounts).filter(([t]) => t !== 'Uncategorized').sort((a, b) => b[1] - a[1]);
        const total = articles.length || 1;

        const topTrend = sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : { name: 'Technology', count: 0 };
        const mostReadTopic = sorted[0] ? { name: sorted[0][0], percentage: Math.round((sorted[0][1] / total) * 100) } : { name: 'General', percentage: 0 };

        const emerging = sorted.filter(([_, c]) => c >= 2).pop();
        const emergingTopic = emerging
            ? { name: emerging[0], growth: `+${Math.round((emerging[1] / total) * 100)}%` }
            : { name: 'Niche Topics', growth: '+0%' };

        return { topTrend, mostReadTopic, emerging: emergingTopic };
    });

    let cachedBrief: { articles: any[], timestamp: number } | null = null;
    const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

    server.get('/daily-brief', async (request: FastifyRequest, reply: FastifyReply) => {
        const now = Date.now();
        if (cachedBrief && (now - cachedBrief.timestamp) < CACHE_DURATION_MS) {
            return {
                articles: cachedBrief.articles,
                cachedAt: new Date(cachedBrief.timestamp).toISOString(),
                expiresAt: new Date(cachedBrief.timestamp + CACHE_DURATION_MS).toISOString()
            };
        }

        const articles = store.getArticles();
        const categoriesOfInterest = ['AI & ML', 'Science & Space', 'India'];
        const selectedArticles = [];

        for (const category of categoriesOfInterest) {
            const categoryArticles = articles.filter(a => a.topic === category);
            const fallbackArticles = articles.filter(a => a.topic !== 'Uncategorized');
            const sourcePool = categoryArticles.length > 0 ? categoryArticles : fallbackArticles;

            if (sourcePool.length > 0) {
                const article = sourcePool[Math.floor(Math.random() * sourcePool.length)];
                selectedArticles.push({
                    id: article.id,
                    topic: article.topic || "News",
                    title: article.title || "Latest News",
                    time: article.timeToRead || "3 min",
                    summary: (article.summary && article.summary !== "Click to analyze") ? article.summary : "A notable update from your personalized news feed curated today.",
                    link: article.link
                });
            }
        }

        if (selectedArticles.length > 0) {
            cachedBrief = { articles: selectedArticles, timestamp: now };
        } else {
            selectedArticles.push(
                { topic: "AI & ML", title: "Wait for feed to load...", summary: "Fetching the latest news. Please refresh." },
                { topic: "Science & Space", title: "Wait for feed to load...", summary: "Fetching the latest news. Please refresh." },
                { topic: "Technology", title: "Wait for feed to load...", summary: "Fetching the latest news. Please refresh." }
            );
        }

        return {
            articles: selectedArticles,
            cachedAt: new Date(now).toISOString(),
            expiresAt: new Date(now + (selectedArticles[0]?.title === "Wait for feed to load..." ? 0 : CACHE_DURATION_MS)).toISOString()
        };
    });

    server.get('/nlp-status', async (_request: FastifyRequest, reply: FastifyReply) => {
        return getNlpStatus();
    });
}
