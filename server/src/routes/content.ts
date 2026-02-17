import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { store, Article } from '../services/store';
import { rssService } from '../services/rss';
import { aiService } from '../services/ai';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// STRING-MATCHING CATEGORIZATION (temporary replacement for AI categorization)
// This is a lightweight, instant categorization based on title keywords.
// Once AI categorization is re-enabled, this can be removed.
// =============================================================================
const categoryKeywords: Record<string, string[]> = {
    "AI & ML": ["ai", "artificial intelligence", "machine learning", "deep learning", "neural", "llm", "gpt", "chatgpt", "openai", "anthropic", "gemini", "copilot", "model", "transformer", "groq", "claude", "diffusion", "generative", "nlp", "computer vision", "training", "inference", "agent", "rag"],
    "Web Dev": ["react", "nextjs", "next.js", "angular", "vue", "svelte", "javascript", "typescript", "css", "html", "frontend", "backend", "fullstack", "node", "deno", "bun", "api", "rest", "graphql", "web dev", "framework", "tailwind", "webpack", "vite"],
    "Science": ["science", "research", "study", "discovery", "physics", "chemistry", "biology", "genome", "dna", "evolution", "experiment", "laboratory", "scientist", "nature", "cell", "quantum", "molecule", "fossil", "species", "organism"],
    "Startups": ["startup", "founder", "venture", "funding", "seed", "series a", "series b", "ipo", "valuation", "unicorn", "accelerator", "incubator", "entrepreneur", "pitch", "y combinator", "techstars"],
    "Crypto": ["crypto", "bitcoin", "ethereum", "blockchain", "defi", "nft", "token", "web3", "mining", "wallet", "solana", "binance", "coinbase", "stablecoin", "dao"],
    "Design": ["design", "ui", "ux", "figma", "interface", "typography", "color", "layout", "prototype", "wireframe", "accessibility", "aesthetic", "branding", "logo"],
    "DevOps": ["devops", "docker", "kubernetes", "k8s", "ci/cd", "pipeline", "deploy", "infrastructure", "terraform", "aws", "azure", "gcp", "cloud", "server", "monitoring", "container", "linux", "nginx"],
    "Security": ["security", "hack", "breach", "vulnerability", "malware", "phishing", "ransomware", "encryption", "firewall", "cyber", "privacy", "zero-day", "exploit", "password", "authentication"],
    "Politics": ["politics", "election", "government", "congress", "senate", "president", "legislation", "policy", "democrat", "republican", "vote", "campaign", "regulation", "law", "court"],
    "Business": ["business", "revenue", "profit", "market", "stock", "earnings", "ceo", "acquisition", "merger", "layoff", "company", "enterprise", "corporate", "industry", "economy", "trade", "gdp"],
    "Health": ["health", "medical", "doctor", "hospital", "disease", "treatment", "vaccine", "drug", "fda", "clinical", "patient", "diagnosis", "surgery", "mental health", "wellness", "fitness"],
    "Sports": ["sports", "nba", "nfl", "mlb", "soccer", "football", "basketball", "tennis", "golf", "olympics", "championship", "tournament", "athlete", "coach", "game", "match", "score"],
    "Entertainment": ["movie", "film", "tv", "show", "netflix", "streaming", "music", "album", "concert", "celebrity", "actor", "director", "oscar", "emmy", "gaming", "playstation", "xbox", "nintendo"],
    "Climate": ["climate", "carbon", "emissions", "renewable", "solar", "wind", "energy", "sustainability", "pollution", "warming", "environmental", "green", "electric vehicle", "ev", "battery"],
    "Space": ["space", "nasa", "spacex", "rocket", "satellite", "mars", "moon", "orbit", "astronaut", "telescope", "galaxy", "asteroid", "launch", "cosmic", "starship", "james webb"],
};

function categorizeByTitle(title: string): string {
    const lower = title.toLowerCase();
    let bestMatch = "Uncategorized";
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        let score = 0;
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                // Longer keywords get more weight (more specific = more accurate)
                score += keyword.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = category;
        }
    }

    return bestMatch;
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

        for (const url of feeds) {
            console.log(`Updating feed: ${url}`);
            try {
                const items = await rssService.fetchFeed(url);
                for (const item of items) {
                    const exists = store.getArticles().find(a => a.link === item.link);
                    if (!exists) {
                        const id = uuidv4();
                        const timeToRead = calculateReadingTime(item.contentSnippet || item.content || '');

                        // Use string-matching categorization (instant, no API calls)
                        const topic = categorizeByTitle(item.title || '');

                        store.addArticle({
                            ...item,
                            id,
                            summary: "Click to analyze",
                            topic,
                            why: "Pending analysis",
                            insights: [],
                            timeToRead,
                            likes: 0,
                            categorizing: false, // No longer waiting for AI
                        } as Article);
                        newArticleIds.push(id);
                    }
                }
            } catch (feedError) {
                console.error(`Failed to fetch feed ${url}:`, feedError);
            }
        }

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

        try {
            const analysis = await aiService.summarize(article.contentSnippet || article.content || article.title || "");
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
}
