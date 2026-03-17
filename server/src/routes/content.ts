import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { store, Article } from '../services/store';
import { rssService } from '../services/rss';
import { aiService } from '../services/ai';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import natural from 'natural';
import fs from 'fs';
import path from 'path';

// =============================================================================
// HYBRID CATEGORIZATION ENGINE v4
// Multi-layer approach: Source Bias → Keyword Scoring → NLP with Confidence Guard
// =============================================================================

const categoryKeywords: Record<string, string[]> = {
    "AI & ML": [
        "ai", "artificial intelligence", "machine learning", "deep learning", "neural", "llm",
        "gpt", "chatgpt", "openai", "anthropic", "gemini", "copilot", "model", "transformer",
        "groq", "claude", "diffusion", "generative", "nlp", "computer vision", "training",
        "inference", "agent", "rag", "prompt", "chatbot", "automation", "algorithm", "dataset",
        "mistral", "perplexity", "stable diffusion", "midjourney", "text to image",
    ],
    "Web Dev": [
        "react", "nextjs", "next.js", "angular", "vue", "svelte", "javascript", "typescript",
        "css", "html", "frontend", "backend", "fullstack", "node", "deno", "bun", "api", "rest",
        "graphql", "web dev", "framework", "tailwind", "webpack", "vite", "web app", "web application",
        "browser", "chrome extension", "node.js", "npm", "yarn", "pnpm", "eslint", "prettier",
    ],
    "Science": [
        "science", "research", "study", "discovery", "physics", "chemistry", "biology", "genome",
        "dna", "evolution", "experiment", "laboratory", "scientist", "nature", "cell", "quantum",
        "molecule", "fossil", "species", "organism", "ecology", "ecology", "marine", "conservation",
        "biodiversity", "neuroscience", "cognitive", "gene", "protein", "bacteria", "virus",
        "mutation", "enzyme", "microscope", "telescope", "particle", "radiation", "element",
        "coral", "forest", "extinct", "mammal", "reptile", "amphibian", "insect", "bird",
        "wildlife", "animal", "plant", "tree", "ocean", "sea",
    ],
    "Startups": [
        "startup", "founder", "venture", "funding", "seed", "series a", "series b", "ipo",
        "valuation", "unicorn", "accelerator", "incubator", "entrepreneur", "pitch",
        "y combinator", "techstars", "angel investor", "pre-seed", "series c", "fundraise",
        "raise", "mvp", "product market fit", "bootstrapped",
    ],
    "Crypto": [
        "crypto", "bitcoin", "ethereum", "blockchain", "defi", "nft", "token", "web3", "mining",
        "wallet", "solana", "binance", "coinbase", "stablecoin", "dao", "token price",
        "crypto market", "digital assets", "coindesk", "web3 startup", "btc", "eth", "altcoin",
        "exchange", "trading", "decentralized", "ledger", "hash rate", "proof of stake",
        "proof of work", "metaverse", "polygon", "chainlink", "ripple", "xrp", "dogecoin",
    ],
    "Design": [
        "design", "ui design", "ux design", "figma", "interface", "typography", "color palette",
        "layout", "prototype", "wireframe", "accessibility", "aesthetic", "branding", "logo",
        "graphic design", "product design", "user experience", "user interface", "usability",
        "creative direction", "illustration", "motion design", "visual identity",
        "design system", "component library", "sketch", "adobe xd",
    ],
    "DevOps": [
        "devops", "docker", "kubernetes", "k8s", "ci/cd", "pipeline", "deploy", "infrastructure",
        "terraform", "aws", "azure", "gcp", "cloud", "monitoring", "container", "linux", "nginx",
        "serverless", "microservices", "gitops", "helm", "ansible", "prometheus", "grafana",
        "observability", "sre", "site reliability", "incident", "on-call", "load balancer",
        "cloudflare", "vercel", "netlify", "heroku", "render", "supabase",
    ],
    "Security": [
        "security", "hack", "breach", "vulnerability", "malware", "phishing", "ransomware",
        "encryption", "firewall", "cyber", "privacy", "zero-day", "exploit", "password",
        "authentication", "scam", "fraud", "data leak", "data breach", "spyware", "ddos",
        "botnet", "social engineering", "2fa", "mfa", "ssl", "tls", "certificate", "vpn",
        "threat intelligence", "penetration testing", "bug bounty", "cve", "patch",
        "identity theft", "surveillance", "backdoor", "trojan",
    ],
    "Politics": [
        "politics", "election", "government", "congress", "senate", "president", "legislation",
        "policy", "democrat", "republican", "vote", "campaign", "regulation", "law", "court",
        "parliament", "biden", "trump", "minister", "minister", "diplomatic", "sanctions",
        "treaty", "nato", "un", "united nations", "geopolitics", "summit", "referendum",
        "coalition", "opposition", "ruling party", "white house", "kremlin",
    ],
    "Business": [
        "business", "revenue", "profit", "market", "stock", "earnings", "ceo", "acquisition",
        "merger", "layoff", "company", "enterprise", "corporate", "industry", "economy", "trade",
        "gdp", "sensex", "nifty", "inflation", "bank", "rbi", "fed", "interest rate", "fiscal",
        "quarterly results", "wall street", "nasdaq", "nyse", "shares", "dividend", "ipo",
        "deal", "partnership", "contract", "supply chain", "manufacturing", "retail",
        "ecommerce", "amazon", "apple", "google", "microsoft", "meta", "tesla",
    ],
    "Health": [
        "health", "medical", "doctor", "hospital", "disease", "treatment", "vaccine", "drug",
        "fda", "clinical", "patient", "diagnosis", "surgery", "mental health", "wellness",
        "fitness", "cancer", "covid", "pandemic", "symptoms", "therapy", "medicine",
        "pharmaceutical", "who", "world health organization", "cdc", "epidemic", "outbreak",
        "nutrition", "diet", "obesity", "diabetes", "heart", "lung", "brain", "blood",
        "chronic", "rare disease", "drug trial", "gene therapy",
    ],
    "Sports": [
        "sports", "nba", "nfl", "mlb", "soccer", "football", "basketball", "tennis", "golf",
        "olympics", "championship", "tournament", "athlete", "coach", "game", "match", "score",
        "cricket", "ipl", "bcci", "kohli", "dhoni", "rohit", "messi", "ronaldo", "fifa", "wpl",
        "formula 1", "f1", "ufc", "boxing", "wrestling", "rugby", "hockey", "badminton",
        "marathon", "cycling", "swimming", "gymnastics", "league", "cup", "trophy",
        "semifinal", "final", "quarterfinal", "goal", "wicket", "innings", "penalty",
        "transfer window", "squad", "manager",
    ],
    "Entertainment": [
        "movie", "film", "tv", "show", "netflix", "streaming", "music", "album", "concert",
        "celebrity", "actor", "director", "oscar", "emmy", "gaming", "playstation", "xbox",
        "nintendo", "bollywood", "hollywood", "actress", "cinema", "box office", "trailer",
        "series", "episode", "season", "premiere", "review", "award", "grammy", "bafta",
        "cannes", "sundance", "anime", "manga", "video game", "esports", "twitch", "youtube",
        "spotify", "apple music", "record label", "pop star", "rapper", "band", "debut",
    ],
    "Climate": [
        "climate", "carbon", "emissions", "renewable", "solar", "wind", "energy",
        "sustainability", "pollution", "warming", "environmental", "green", "electric vehicle",
        "ev", "battery", "weather", "storm", "wildfire", "flood", "drought", "heatwave",
        "glacier", "arctic", "deforestation", "biodiversity", "net zero", "carbon footprint",
        "fossil fuel", "coal", "oil", "gas", "green energy", "paris agreement", "cop",
        "ipcc", "methane", "ozone", "sea level",
    ],
    "Space": [
        "space", "nasa", "spacex", "rocket", "satellite", "mars", "moon", "orbit", "astronaut",
        "telescope", "galaxy", "asteroid", "launch", "cosmic", "starship", "isro", "chandrayaan",
        "gaganyaan", "jwst", "james webb", "hubble", "black hole", "supernova", "comet",
        "solar system", "exoplanet", "iss", "space station", "spacewalk", "lunar",
    ],
    "India": [
        // -- Politics & Government --
        "india", "indian", "modi", "narendra modi", "pm modi",
        "bjp", "bharatiya janata party", "congress", "indian national congress",
        "rahul gandhi", "sonia gandhi", "priyanka gandhi",
        "amit shah", "rajnath singh", "nirmala sitharaman", "s jaishankar",
        "yogi adityanath", "mamata banerjee", "arvind kejriwal", "aap",
        "nitish kumar", "hemant soren", "m k stalin", "pinarayi vijayan",
        "fadnavis", "revanth reddy", "siddaramaiah",
        "lok sabha", "rajya sabha", "parliament india", "budget session",
        "election commission india", "general election india", "assembly election",
        "vidhan sabha", "nda", "india alliance",
        // -- Judiciary & Law --
        "supreme court of india", "high court india",
        "cbi", "ed", "enforcement directorate", "ncb", "nia",
        "uapa", "sedition law india", "pil india",
        // -- States & Cities --
        "delhi", "new delhi", "mumbai", "bengaluru", "bangalore",
        "chennai", "kolkata", "hyderabad", "pune", "ahmedabad",
        "surat", "jaipur", "lucknow", "kanpur", "nagpur",
        "indore", "bhopal", "patna", "ranchi", "bhubaneswar",
        "guwahati", "shillong", "imphal", "gangtok",
        "shimla", "dehradun", "chandigarh", "jammu", "srinagar",
        "kerala", "up", "uttar pradesh", "bihar", "rajasthan",
        "maharashtra", "west bengal", "odisha", "assam", "punjab",
        "haryana", "gujarat", "madhya pradesh", "andhra pradesh",
        "telangana", "karnataka", "tamil nadu",
        "jharkhand", "chhattisgarh", "uttarakhand", "himachal pradesh",
        "goa", "manipur", "meghalaya", "mizoram", "nagaland",
        "tripura", "sikkim", "arunachal pradesh",
        // -- Economy & Finance --
        "rupee", "rbi", "reserve bank of india", "sebi", "irdai",
        "niti aayog", "finance ministry india", "union budget", "gst india",
        "sensex", "nifty", "bse", "nse", "dalal street",
        "fdi india", "msme", "make in india",
        "digital india", "startup india", "upi", "bhim app",
        "aadhaar", "jan dhan", "pm kisan", "pm awas yojana",
        "india gdp", "india economy", "india inflation",
        "india exports", "india imports", "india forex reserves",
        // -- Indian Corporates & Brands --
        "tata group", "reliance industries", "mukesh ambani",
        "adani group", "gautam adani", "adani ports", "adani green",
        "infosys", "wipro", "tcs", "hcl technologies", "tech mahindra",
        "larsen toubro", "l&t",
        "hdfc bank", "icici bank", "sbi", "axis bank", "kotak mahindra",
        "paytm", "ola cabs", "zomato", "swiggy", "flipkart",
        "meesho", "byju's", "unacademy", "zepto", "blinkit",
        "jio", "airtel india", "vodafone idea",
        // -- Indian Sports --
        "ipl", "bcci", "virat kohli", "rohit sharma", "ms dhoni",
        "shubman gill", "yashasvi jaiswal", "hardik pandya",
        "jasprit bumrah", "ravindra jadeja", "r ashwin",
        "india cricket", "team india",
        "sunil chhetri", "indian football team",
        "pv sindhu", "kidambi srikanth", "lakshya sen",
        "neeraj chopra", "mary kom", "mirabai chanu",
        "pro kabaddi league", "isl", "indian super league",
        "indian hockey team", "commonwealth games india",
        "asian games india", "india at olympics",
        // -- Indian Culture & Society --
        "bollywood", "tollywood", "kollywood", "mollywood",
        "hindi film industry", "indian cinema",
        "diwali", "holi", "eid india", "navratri", "durga puja",
        "pongal", "onam", "baisakhi", "ganesh chaturthi",
        "kumbh mela", "char dham yatra",
        "ram mandir", "ayodhya", "varanasi",
        "caste reservation india", "obc quota",
        // -- Defence & Security --
        "indian army", "indian navy", "indian air force",
        "iaf", "drdo", "hal",
        "line of control", "loc india", "lac india",
        "india china border", "india pakistan border",
        // -- Infrastructure & Development --
        "irctc", "indian railways", "vande bharat", "metro rail india",
        "national highway india", "nhai", "india airport expansion",
        "pm gati shakti", "smart city india",
        // -- Current Affairs Keywords --
        "modi government", "opposition india", "india news",
        "hindu nationalism", "secularism india",
        "india foreign policy", "india us relations", "india russia",
    ],
    "World": [
        "war", "conflict", "attack", "strike", "missile", "troops", "army", "military",
        "ceasefire", "invasion", "bombing", "airstrike", "refugee", "displaced", "humanitarian",
        "crisis", "famine", "drought", "protest", "riot", "unrest", "revolution", "coup",
        "iran", "russia", "ukraine", "israel", "gaza", "china", "taiwan", "korea",
        "north korea", "middle east", "africa", "europe", "latin america", "southeast asia",
        "diplomat", "embassy", "foreign minister", "bilateral", "trade war",
        "sanctions", "nato", "g7", "g20", "un security council", "peacekeeping",
    ],
    "General": [
        "report", "exclusive", "reveal", "investigation", "analysis", "opinion", "comment",
        "interview", "profile", "obituary", "correction", "update", "breaking", "latest",
    ],
};

// ============================================================
// SOURCE FEED BIAS MAP: gives known sources a category weight
// so domain-specific feeds get pre-classified correctly.
// ============================================================
const sourceBias: Record<string, string> = {
    "sciencedaily": "Science",
    "science daily": "Science",
    "Latest Science News -- ScienceDaily": "Science",
    "espn": "Sports",
    "www.espn.com - TOP": "Sports",
    "techcrunch": "AI & ML",
    "TechCrunch": "AI & ML",
    "coindesk": "Crypto",
    "cointelegraph": "Crypto",
    "bloomberg": "Business",
    "financial times": "Business",
    "forbes": "Business",
    "wired": "AI & ML",
    "the verge": "AI & ML",
    // Indian sources
    "the hindu": "India",
    "thehindu": "India",
    "Indian Express": "India",
    "the indian express": "India",
    "hindustan times": "India",
    "ndtv": "India",
    "times of india": "India",
    "india today": "India",
    "the wire": "India",
    "scroll": "India",
    "print": "India",
    "news18": "India",
    "abp news": "India",
    "zee news": "India",
    "aaj tak": "India",
    "republic": "India",
};

// ============================================================
// NLP CONFIDENCE THRESHOLD
// Below this probability the NLP result is rejected and
// the article falls through to World / General fallback.
// Range 0.0 – 1.0; higher = stricter.
// ============================================================
const NLP_CONFIDENCE_THRESHOLD = 0.25;

// ============================================================
// GUARD LIST: categories that NLP sometimes assigns to
// clearly-general news articles (war, politics, crime etc.)
// Only apply these via NLP when score is VERY high.
// ============================================================
const NLP_SOFT_CATEGORIES = new Set(["Crypto", "DevOps", "Design", "Web Dev"]);
const NLP_SOFT_THRESHOLD = 0.40; // stricter threshold for soft categories

// Initialize ML Classifier
const classifier = new natural.BayesClassifier();
let isClassifierTrained = false;

function initClassifier() {
    if (isClassifierTrained) return;
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
        console.log("NLP Classifier v4 trained successfully.");
    } catch (error) {
        console.error("Failed to train NLP classifier:", error);
    }
}

function categorizeArticle(title: string, contentStr?: string, sourceName?: string): { primary: string; topics: string[] } {
    initClassifier();

    const fallbackContent = contentStr || "";
    const normalizedTitle = title.toLowerCase();
    const normalizedContent = fallbackContent.toLowerCase();
    const titleWords: string[] = normalizedTitle.match(/\b\w+\b/g) || [];
    const contentWords: string[] = normalizedContent.match(/\b\w+\b/g) || [];

    // ── Layer 0: Source Feed Bias ──────────────────────────────
    // Known domain-specific feeds get a pre-classification hint.
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

    // ── Layer 1: Keyword Scoring ───────────────────────────────
    const acronyms: string[] = ['ai', 'ux', 'ui', 'ml', 'vr', 'ar'];
    let bestMatch = "Uncategorized";
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        let score = 0;

        // Boost score for source bias match
        if (sourceBiasCategory === category) score += 30;

        for (const keyword of keywords) {
            const isAcronym = acronyms.indexOf(keyword) !== -1;

            if (keyword.includes(' ')) {
                const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
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

    // ── Layer 2: NLP Classifier with Confidence Guard ──────────
    const combinedText = `${normalizedTitle} ${normalizedContent}`;
    let nlpLabel: string | null = null;

    if (combinedText.trim().length > 10) {
        const classifications = classifier.getClassifications(combinedText);
        const topClass = classifications[0];
        const topScore = topClass?.value ?? 0;

        if (topClass) {
            const requiredThreshold = NLP_SOFT_CATEGORIES.has(topClass.label)
                ? NLP_SOFT_THRESHOLD   // stricter for prone-to-misfire categories
                : NLP_CONFIDENCE_THRESHOLD;

            if (topScore >= requiredThreshold) {
                nlpLabel = topClass.label;
            }
        }

        // NLP rescue: only fire when keyword engine gave up
        if (primary === "Uncategorized" && nlpLabel) {
            primary = nlpLabel;
        }

        // Multi-label: add NLP top label if confidence is good
        if (nlpLabel) finalTopics.add(nlpLabel);

        // Secondary topic: add if meaningfully close in probability
        const secondClass = classifications[1];
        if (secondClass && nlpLabel && secondClass.value >= NLP_CONFIDENCE_THRESHOLD * 0.8) {
            finalTopics.add(secondClass.label);
        }
    }

    // ── Layer 3: Source Bias Fallback ──────────────────────────
    // If still Uncategorized but we have a strong source bias, trust it.
    if (primary === "Uncategorized" && sourceBiasCategory) {
        primary = sourceBiasCategory;
    }

    // ── Layer 4: World / General Catch-All ────────────────────
    // Articles that remain uncategorized after all layers get
    // bucketed into "World" (geopolitical cues) or "General".
    if (primary === "Uncategorized") {
        const worldCues = ["war", "attack", "strike", "troops", "conflict", "bombing", "invasion",
            "missile", "ceasefire", "refugee", "famine", "iran", "ukraine", "russia", "israel",
            "gaza", "pakistan", "north korea", "military", "airstrike", "diplomatic"];
        const hasWorldCue = worldCues.some(cue => normalizedTitle.includes(cue) || normalizedContent.includes(cue));
        primary = hasWorldCue ? "World" : "General";
    }

    if (primary !== "Uncategorized") finalTopics.add(primary);

    return {
        primary,
        topics: Array.from(finalTopics),
    };
}


/** Exported for visibility in the /health endpoint */
export function getNlpStatus(): 'ready' | 'training' | 'failed' {
    if (isClassifierTrained) return 'ready';
    try {
        initClassifier();
        return isClassifierTrained ? 'ready' : 'training';
    } catch {
        return 'failed';
    }
}

export async function contentRoutes(server: FastifyInstance) {

    const calculateReadingTime = (text: string): string => {
        const wordCount = (text || '').split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} min`;
    };

    const updateFeeds = async () => {
        const feeds = store.getFeeds();
        const newArticleIds: string[] = [];

        console.log(`Starting parallel fetch for ${feeds.length} feeds...`);

        const fetchPromises = feeds.map(async (url) => {
            try {
                const items = await rssService.fetchFeed(url);
                return { url, items, status: 'fulfilled' as const };
            } catch (error) {
                console.error(`Failed to fetch feed ${url}:`, error);
                return { url, error, status: 'rejected' as const };
            }
        });

        const results = await Promise.allSettled(fetchPromises);

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
                const items = result.value.items;
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
                            categorizing: false,
                        } as Article);
                        newArticleIds.push(id);
                    }
                }
            }
        }

        console.log(`Parallel fetch complete. Added ${newArticleIds.length} new articles.`);

        // =====================================================================
        // AI CATEGORIZATION - COMMENTED OUT (temporarily disabled)
        // Re-enable this block when Groq API rate limits are no longer an issue.
        // The AI categorization provides much better accuracy but consumes API
        // calls for every new article, which slows down feed loading and can
        // exhaust rate limits, breaking chat and summarization.
        // =====================================================================
        // if (newArticleIds.length > 0) {
        //     categorizeInBackground(newArticleIds);
        // }

        return newArticleIds.length;
    };

    // =========================================================================
    // AI BACKGROUND CATEGORIZATION - COMMENTED OUT (temporarily disabled)
    // This function calls aiService.categorize() for each article which sends
    // a Groq API request. When many articles are fetched at once (100+), this
    // overwhelms the API and causes rate-limiting that breaks chat/summarize.
    // 
    // To re-enable:
    //   1. Uncomment the categorizeInBackground call in updateFeeds above
    //   2. Uncomment this entire function
    //   3. Set categorizing: true in addArticle above
    //   4. Consider adding rate limiting (e.g., 5 articles/minute)
    // =========================================================================
    // const categorizeInBackground = async (articleIds: string[]) => {
    //     for (const id of articleIds) {
    //         const article = store.getArticleById(id);
    //         if (!article) continue;
    //
    //         try {
    //             const result = await aiService.categorize(
    //                 article.title || '',
    //                 article.contentSnippet || article.content || ''
    //             );
    //             store.updateArticle(id, {
    //                 topic: result.topic,
    //                 timeToRead: result.timeToRead,
    //                 categorizing: false,
    //             });
    //         } catch (error) {
    //             console.error(`Categorization failed for article ${id}:`, error);
    //             store.updateArticle(id, { categorizing: false });
    //         }
    //     }
    // };

    server.get('/feed', async (request: FastifyRequest, reply: FastifyReply) => {
        if (store.getArticles().length === 0) {
            await updateFeeds();
        } else {
            updateFeeds();
        }
        return store.getArticles();
    });

    server.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
        const newCount = await updateFeeds();
        return { message: 'Refreshed', count: store.getArticles().length, newCount };
    });

    // =========================================================================
    // ARTICLE ANALYSIS & SUMMARIZATION — AI-POWERED (active)
    //
    // This is the CORE feature of NewsLabs. Each article click triggers a
    // single Groq API call to generate summary, insights, and relevance.
    // This should remain enabled — only subsidiary features (chat, trending,
    // insights) are disabled to conserve API limits.
    // =========================================================================
    server.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.body as { id: string };
        const article = store.getArticles().find(a => a.id === id);

        if (!article) {
            return reply.status(404).send({ error: 'Article not found' });
        }

        if (article.summary !== "Click to analyze") {
            return article;
        }

        // Get user preference
        let aiProvider = 'hybrid';
        try {
            const authHeader = request.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                // Manually verify since this route is optional auth
                const jwt = require('jsonwebtoken');
                const decoded = jwt.decode(token) as { userId: string };
                if (decoded?.userId) {
                    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
                    if (user?.aiProvider) {
                        aiProvider = user.aiProvider;
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to fetch user preference for analysis:", e);
        }

        try {
            const analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "", aiProvider);
            article.summary = analysis.summary;
            article.topic = analysis.topic;
            article.why = analysis.why;
            article.insights = analysis.insights;
            return article;
        } catch (error) {
            return reply.status(500).send({ error: 'Analysis failed' });
        }
    });

    // =========================================================================
    // TRENDING ENDPOINT - ALGORITHMIC (no API calls)
    //
    // Extracts trending topics by analyzing word frequency across all article
    // titles. Filters out common stop words and short words, then returns
    // the top phrases by occurrence count.
    //
    // AI version (commented out):
    //   const trends = await aiService.analyzeTrending(titles);
    //   return { trends };
    // =========================================================================
    server.get('/trending', async (request: FastifyRequest, reply: FastifyReply) => {
        const articles = store.getArticles();
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
            'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
            'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
            'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
            'it', 'its', 'this', 'that', 'these', 'those', 'he', 'she', 'they', 'we', 'you',
            'i', 'me', 'my', 'your', 'his', 'her', 'our', 'their', 'what', 'which', 'who',
            'how', 'why', 'when', 'where', 'all', 'each', 'every', 'any', 'few', 'more',
            'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too',
            'very', 'just', 'about', 'up', 'out', 'off', 'over', 'new', 'now', 'also',
            'get', 'got', 'one', 'two', 'first', 'last', 'long', 'make', 'many', 'much',
            'says', 'said', 'say', 'like', 'even', 'still', 'way', 'well', 'back', 'use',
            'here', 'there', 'need', 'want', 'take', 'come', 'know', 'see', 'think', 'look']);

        // Count significant words across all titles
        const wordCounts: Record<string, number> = {};
        for (const article of articles) {
            const words = (article.title || '').toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));

            const seen = new Set<string>(); // count once per article
            for (const word of words) {
                if (!seen.has(word)) {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                    seen.add(word);
                }
            }
        }

        // Get top words that appear in multiple articles
        const sorted = Object.entries(wordCounts)
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7)
            .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

        return { trends: sorted.length > 0 ? sorted : ['Technology', 'Science', 'Innovation', 'AI', 'Research'] };
    });

    // =========================================================================
    // INSIGHTS ENDPOINT - ALGORITHMIC (no API calls)
    //
    // Computes insights from article metadata:
    //   - topTrend: most common topic by count
    //   - mostReadTopic: topic with highest % of articles
    //   - emerging: least common non-"Uncategorized" topic (niche/emerging)
    //
    // AI version (commented out):
    //   const insights = await aiService.analyzeInsights(titles, topics);
    //   return insights;
    // =========================================================================
    server.get('/insights', async (request: FastifyRequest, reply: FastifyReply) => {
        const articles = store.getArticles();

        // Count by topic
        const topicCounts: Record<string, number> = {};
        for (const a of articles) {
            const t = a.topic || 'Uncategorized';
            topicCounts[t] = (topicCounts[t] || 0) + 1;
        }

        const sorted = Object.entries(topicCounts)
            .filter(([t]) => t !== 'Uncategorized')
            .sort((a, b) => b[1] - a[1]);

        const total = articles.length || 1;

        // Top trend = most common topic
        const topTrend = sorted[0]
            ? { name: sorted[0][0], count: sorted[0][1] }
            : { name: 'Technology', count: 0 };

        // Most read topic = highest percentage
        const mostReadTopic = sorted[0]
            ? { name: sorted[0][0], percentage: Math.round((sorted[0][1] / total) * 100) }
            : { name: 'General', percentage: 0 };

        // Emerging = smallest non-trivial topic (at least 2 articles)
        const emerging = sorted.filter(([_, c]) => c >= 2).pop();
        const emergingTopic = emerging
            ? { name: emerging[0], growth: `+${Math.round((emerging[1] / total) * 100)}%` }
            : { name: 'Niche Topics', growth: '+0%' };

        return { topTrend, mostReadTopic, emerging: emergingTopic };
    });

    // =========================================================================
    // DAILY BRIEF ENDPOINT
    //
    // Returns 3 curated articles (AI, Science, Tech) updated every 6 hours.
    // Categorization relies on the `topic` field assigned during indexing.
    // =========================================================================

    // In-memory cache for the daily brief
    let cachedBrief: { articles: any[], timestamp: number } | null = null;
    const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

    server.get('/daily-brief', async (request: FastifyRequest, reply: FastifyReply) => {
        const now = Date.now();

        // Return cached brief if it's still valid
        if (cachedBrief && (now - cachedBrief.timestamp) < CACHE_DURATION_MS) {
            return {
                articles: cachedBrief.articles,
                cachedAt: new Date(cachedBrief.timestamp).toISOString(),
                expiresAt: new Date(cachedBrief.timestamp + CACHE_DURATION_MS).toISOString()
            };
        }

        // Fetch feeds if we don't have enough articles (e.g. server just started)
        let articles = store.getArticles();
        if (articles.length === 0) {
            await updateFeeds();
            articles = store.getArticles();
        }

        // Helper to find highest quality article for a topic cluster
        const getArticleForTopics = (targetTopics: string[], excludeIds: Set<string>) => {
            // Sort by latest first (assuming higher ID or just relying on natural order which is latest first in RSS)
            // But RSS feeds usually return latest first, store.addArticle appends, so reverse might be needed.
            // Let's just find the first matching one that hasn't been used.
            const candidates = articles.filter(a =>
                a.topic && targetTopics.includes(a.topic) && !excludeIds.has(a.id || '')
            );

            // Prefer articles with summaries (if they have been clicked before) or just take the first one
            return candidates.length > 0 ? candidates[0] : null;
        };

        const usedIds = new Set<string>();
        const selectedArticles: any[] = [];

        // 1. AI & ML Article
        const aiArticle = getArticleForTopics(["AI & ML"], usedIds);
        if (aiArticle) {
            usedIds.add(aiArticle.id || '');
            selectedArticles.push({
                topic: "AI",
                title: aiArticle.title || "Latest in AI",
                time: aiArticle.timeToRead || "3 min",
                summary: (aiArticle.summary && aiArticle.summary !== "Click to analyze")
                    ? aiArticle.summary
                    : "Discover the latest advancements in artificial intelligence and machine learning models.",
                link: aiArticle.link
            });
        }

        // 2. Science Article
        const scienceArticle = getArticleForTopics(["Science", "Space", "Health", "Climate"], usedIds);
        if (scienceArticle) {
            usedIds.add(scienceArticle.id || '');
            selectedArticles.push({
                topic: "Science",
                title: scienceArticle.title || "Scientific Breakthroughs",
                time: scienceArticle.timeToRead || "4 min",
                summary: (scienceArticle.summary && scienceArticle.summary !== "Click to analyze")
                    ? scienceArticle.summary
                    : "Explore recent discoveries pushing the boundaries of scientific research.",
                link: scienceArticle.link
            });
        }

        // 3. Tech Article
        const techArticle = getArticleForTopics(["Web Dev", "DevOps", "Security", "Crypto", "Tech"], usedIds);
        if (techArticle) {
            usedIds.add(techArticle.id || '');
            selectedArticles.push({
                topic: "Tech",
                title: techArticle.title || "Technology Trends",
                time: techArticle.timeToRead || "2 min",
                summary: (techArticle.summary && techArticle.summary !== "Click to analyze")
                    ? techArticle.summary
                    : "Stay up to date with the newest frameworks, tools, and developer ecosystems.",
                link: techArticle.link
            });
        }

        // Fallbacks if we didn't find 3 specific articles
        for (const article of articles) {
            if (selectedArticles.length >= 3) break;
            if (!usedIds.has(article.id || '')) {
                usedIds.add(article.id || '');
                selectedArticles.push({
                    topic: article.topic || "News",
                    title: article.title || "Latest News",
                    time: article.timeToRead || "3 min",
                    summary: (article.summary && article.summary !== "Click to analyze")
                        ? article.summary
                        : "A notable update from your personalized news feed curated today.",
                    link: article.link
                });
            }
        }

        // Update cache ONLY if we have actual articles
        if (selectedArticles.length > 0) {
            cachedBrief = {
                articles: selectedArticles,
                timestamp: now
            };
        } else {
            // Push fallbacks to return but DO NOT cache them
            selectedArticles.push(
                { topic: "AI", title: "Wait for feed to load...", summary: "Fetching the latest news. Please refresh." },
                { topic: "Science", title: "Wait for feed to load...", summary: "Fetching the latest news. Please refresh." },
                { topic: "Tech", title: "Wait for feed to load...", summary: "Fetching the latest news. Please refresh." }
            );
        }

        return {
            articles: selectedArticles,
            cachedAt: new Date(now).toISOString(),
            expiresAt: new Date(now + (selectedArticles[0]?.title === "Wait for feed to load..." ? 0 : CACHE_DURATION_MS)).toISOString()
        };
    });
}
