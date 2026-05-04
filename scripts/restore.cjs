const fs = require('fs');

const contentStr = `import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { store, Article } from '../services/store';
import { rssService } from '../services/rss';
import { aiService } from '../services/ai';
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

const classifierPath = path.resolve(process.cwd(), 'src/data/classifier.json');
const classifier = new natural.BayesClassifier();
let isClassifierTrained = false;

function initClassifier() {
    if (isClassifierTrained) return;
    try {
        if (fs.existsSync(classifierPath)) {
            natural.BayesClassifier.load(classifierPath, null, (err, savedClassifier) => {
                if (err) throw err;
                if (savedClassifier) {
                    classifier.classifier = savedClassifier.classifier;
                    classifier.docs = savedClassifier.docs;
                    classifier.features = savedClassifier.features;
                    isClassifierTrained = true;
                    console.log("NLP Classifier v4 loaded from disk.");
                }
            });
            if (isClassifierTrained) return;
        }
    } catch (e) {
        console.warn('Could not load classifier, training...', e);
    }

    try {
        const trainingDataPath = path.resolve(process.cwd(), 'src/data/training.json');
        if (fs.existsSync(trainingDataPath)) {
            const rawData = fs.readFileSync(trainingDataPath, 'utf-8');
            const trainingData = JSON.parse(rawData);
            trainingData.forEach((item: any) => {
                classifier.addDocument(item.text, item.category);
            });
        }
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            for (const keyword of keywords) {
                classifier.addDocument(keyword, category);
            }
        }
        classifier.train();
        isClassifierTrained = true;
        classifier.save(classifierPath, (err) => {
            if (err) console.error("Failed to save:", err);
            else console.log("NLP Classifier v4 saved.");
        });
        console.log("NLP Classifier trained.");
    } catch (error) {
        console.error("Failed to train NLP classifier:", error);
    }
}

function categorizeArticle(title: string, contentStr?: string, sourceName?: string): { primary: string; topics: string[] } {
    initClassifier();

    const fallbackContent = contentStr || "";
    const normalizedTitle = title.toLowerCase();
    const normalizedContent = fallbackContent.toLowerCase();
    const titleWords: string[] = normalizedTitle.match(/\\b\\w+\\b/g) || [];
    const contentWords: string[] = normalizedContent.match(/\\b\\w+\\b/g) || [];

    let sourceBiasCategory: string | null = null;
    if (sourceName) {
        const lowerSource = sourceName.toLowerCase();
        for (const [key, cat] of Object.entries(sourceBias)) {
            if (lowerSource.includes(key.toLowerCase())) {
                sourceBiasCategory = cat;
                break;
            }
        }
    }

    const acronyms: string[] = ['ai', 'ux', 'ui', 'ml', 'vr', 'ar'];
    let bestMatch = "Uncategorized";
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        let score = 0;
        if (sourceBiasCategory === category) score += 30;

        for (const keyword of keywords) {
            const isAcronym = acronyms.indexOf(keyword) !== -1;
            if (keyword.includes(' ')) {
                const regex = new RegExp(\`\\\\b\${keyword.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')}\\\\b\`, 'i');
                if (regex.test(normalizedTitle)) score += keyword.length * 10;
                else if (regex.test(normalizedContent)) score += keyword.length * 5;
            } else {
                if (titleWords.includes(keyword)) {
                    score += keyword.length * 10;
                    if (isAcronym) score += 20;
                } else if (!isAcronym && normalizedTitle.includes(keyword)) {
                    score += keyword.length * 5;
                }
                if (contentWords.includes(keyword)) {
                    score += keyword.length * 2;
                    if (isAcronym) score += 5;
                } else if (!isAcronym && normalizedContent.includes(keyword)) {
                    score += keyword.length;
                }
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = category;
        }
    }

    const keywordPrimary = bestScore >= 5 ? bestMatch : "Uncategorized";
    let primary = keywordPrimary;
    const finalTopics = new Set<string>();

    const combinedText = \`\${normalizedTitle} \${normalizedContent}\`;
    let nlpLabel: string | null = null;

    if (combinedText.trim().length > 10) {
        const classifications = classifier.getClassifications(combinedText);
        const topClass = classifications[0];
        const topScore = topClass?.value ?? 0;

        if (topClass) {
            const requiredThreshold = NLP_SOFT_CATEGORIES.has(topClass.label) ? NLP_SOFT_THRESHOLD : NLP_CONFIDENCE_THRESHOLD;
            if (topScore >= requiredThreshold) nlpLabel = topClass.label;
        }
        if (primary === "Uncategorized" && nlpLabel) primary = nlpLabel;
        if (nlpLabel) finalTopics.add(nlpLabel);
        
        const secondClass = classifications[1];
        if (secondClass && nlpLabel && secondClass.value >= NLP_CONFIDENCE_THRESHOLD * 0.8) {
            finalTopics.add(secondClass.label);
        }
    }

    if (primary === "Uncategorized" && sourceBiasCategory) primary = sourceBiasCategory;

    if (primary === "Uncategorized") {
        const worldCues = ["war", "attack", "strike", "troops", "conflict", "bombing", "invasion", "missile", "ceasefire", "refugee", "famine", "iran", "ukraine", "russia", "israel", "gaza", "pakistan", "north korea", "military", "airstrike", "diplomatic"];
        const hasWorldCue = worldCues.some(cue => normalizedTitle.includes(cue) || normalizedContent.includes(cue));
        primary = hasWorldCue ? "World" : "General";
    }

    if (primary !== "Uncategorized") finalTopics.add(primary);

    return { primary, topics: Array.from(finalTopics) };
}

export function getNlpStatus(): 'ready' | 'training' | 'failed' {
    if (isClassifierTrained) return 'ready';
    try {
        initClassifier();
        return isClassifierTrained ? 'ready' : 'training';
    } catch {
        return 'failed';
    }
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
        const wordCount = (text || '').split(/\\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return \`\${minutes} min\`;
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const categorizeInBackground = async (articleIds: string[]) => {
        console.log(\`Starting background categorization for \${articleIds.length} articles...\`);
        for (let i = 0; i < articleIds.length; i++) {
            const id = articleIds[i];
            const article = store.getArticleById(id);
            if (!article) continue;
            try {
                if (i > 0) await delay(4000); 
                console.log(\`[Categorize] \${i+1}/\${articleIds.length}: \${article.title?.substring(0, 30)}...\`);
                const result = await aiService.categorize(article.title || '', article.contentSnippet || article.content || '');
                store.updateArticle(id, { topic: result.topic, timeToRead: result.timeToRead, categorizing: false });
            } catch (error) {
                store.updateArticle(id, { categorizing: false });
            }
        }
    };

    const updateFeeds = async (feedSources: Array<{ url: string; sourceType: 'system' | 'user'; userId?: string; category?: string | null }>) => {
        const feeds = feedSources;
        const newArticleIds: string[] = [];

        const fetchPromises = feeds.map(async (feedSource) => {
            try {
                const items = await rssService.fetchFeed(feedSource.url);
                return { feedSource, items, status: 'fulfilled' as const };
            } catch (error) {
                return { feedSource, error, status: 'rejected' as const };
            }
        });

        const results = await Promise.allSettled(fetchPromises);

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
                        const classification = categorizeArticle(item.title || '', item.contentSnippet || item.content || '', feedTitle);

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
                            categorizing: true,
                            sourceType: feedSource.sourceType,
                            sourceUrl: feedSource.url,
                            sourceOwnerUserId: feedSource.sourceType === 'user' ? (feedSource.userId || null) : null,
                            feedCategory: feedSource.category || null,
                        } as Article);
                        newArticleIds.push(id);
                    }
                }
            }
        }

        if (newArticleIds.length > 0) {
            categorizeInBackground(newArticleIds);
        }

        return newArticleIds.length;
    };

    server.get('/feed', async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = getUserIdFromRequest(request);
        let userFeeds: Array<{ url: string; category: string | null }> = [];
        if (userId) {
            await ensureUserFeedsInitialized(userId);
            userFeeds = await prisma.userFeed.findMany({ where: { userId, isActive: true }, select: { url: true, category: true } });
        }
        const feedSources = [
            ...store.getSystemFeeds().map(feed => ({ url: feed.url, sourceType: 'system' as const, category: feed.category })),
            ...userFeeds.map(feed => ({ url: feed.url, sourceType: 'user' as const, userId: userId || undefined, category: feed.category })),
        ];

        if (store.getArticles().length === 0) {
            await updateFeeds(feedSources);
        } else {
            void updateFeeds(feedSources);
        }

        return userId
            ? store.getArticles().filter(a => a.sourceType === 'system' || a.sourceOwnerUserId === userId)
            : store.getArticles().filter(a => a.sourceType === 'system');
    });

    server.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = getUserIdFromRequest(request);
        let userFeeds: Array<{ url: string; category: string | null }> = [];
        if (userId) {
            await ensureUserFeedsInitialized(userId);
            userFeeds = await prisma.userFeed.findMany({ where: { userId, isActive: true }, select: { url: true, category: true } });
        }
        const feedSources = [
            ...store.getSystemFeeds().map(feed => ({ url: feed.url, sourceType: 'system' as const, category: feed.category })),
            ...userFeeds.map(feed => ({ url: feed.url, sourceType: 'user' as const, userId: userId || undefined, category: feed.category })),
        ];

        const newCount = await updateFeeds(feedSources);
        const visibleCount = userId
            ? store.getArticles().filter(a => a.sourceType === 'system' || a.sourceOwnerUserId === userId).length
            : store.getArticles().filter(a => a.sourceType === 'system').length;

        return { message: 'Refreshed', count: visibleCount, newCount };
    });

    server.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.body as { id: string };
        const article = store.getArticles().find(a => a.id === id);

        if (!article) return reply.status(404).send({ error: 'Article not found' });
        if (article.summary !== "Click to analyze") return article;

        try {
            const userId = getUserIdFromRequest(request);
            let analysis;
            let fallbackUsed = false;

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
                    };

                    try {
                        analysis = await aiService.summarizeStrict(article.contentSnippet || article.content || article.title || "", customOptions);
                    } catch (byokError) {
                        fallbackUsed = true;
                        analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "", {
                            provider: 'hybrid',
                            timeoutMs,
                            disableTimeout: preference.timeoutDisabled,
                        });
                    }
                } else {
                    analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "", { provider: 'hybrid', timeoutMs: 30000 });
                }
            } else {
                analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "", { provider: 'hybrid', timeoutMs: 30000 });
            }

            article.summary = analysis.summary;
            article.topic = analysis.topic;
            article.why = analysis.why;
            article.insights = analysis.insights;
            return { ...article, usedSystemFallback: fallbackUsed };
        } catch (error) {
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
            ? { name: emerging[0], growth: \`+\${Math.round((emerging[1] / total) * 100)}%\` }
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
}
`;
fs.writeFileSync('c:/Projects/NewsLabs/newslabs/server/src/routes/content.ts', contentStr);
