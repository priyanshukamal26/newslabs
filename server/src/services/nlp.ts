import fs from 'fs';
import path from 'path';
import { sentimentService, SentimentResult as AiSentimentResult } from '../ai/services/sentiment';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PrimaryCategory =
    | 'Technology' | 'Business & Finance' | 'World Affairs'
    | 'Science & Space' | 'Health' | 'Sports' | 'Entertainment'
    | 'Climate & Environment' | 'General';

export type Sentiment = 'Positive' | 'Neutral' | 'Negative';
export type ArticleType = 'Opinion' | 'Factual';
export type ReliabilityTier = 'High' | 'Medium' | 'Low';

export interface ClassificationResult {
    primary: PrimaryCategory;
    confidence: number;       // 0–1
    secondaryTags: string[];
    classificationSignals?: string[];
}

export interface SentimentResult extends AiSentimentResult {}

export interface OpinionResult {
    type: ArticleType;
    confidence: number;       // 0–1
    signals?: string[];       // words/patterns that triggered the result
}

export interface ReliabilityResult {
    score: number;            // 0–100
    tier: ReliabilityTier;
    signals: string[];
}

interface ModelArtifact {
    vocab: Record<string, number>;
    idf: number[];
    coef: number[][];
    intercept: number[];
    classes: string[];
    sublinear_tf: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

// Paths updated to the new AI directory structure
const MODEL_PATH = path.resolve(process.cwd(), 'src/ai/models/nlp_model.json');
const META_PATH  = path.resolve(process.cwd(), 'src/ai/models/nlp_meta.json');

const FINAL_CATEGORIES: PrimaryCategory[] = [
    'Technology', 'Business & Finance', 'World Affairs', 'Science & Space',
    'Health', 'Sports', 'Entertainment', 'Climate & Environment', 'General',
];

// Secondary tags derived from keyword heuristics (not the primary classifier)
const SECONDARY_KEYWORD_MAP: Record<string, string[]> = {
    'AI & ML':    ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'openai', 'anthropic', 'gemini', 'claude', 'neural', 'diffusion', 'chatbot', 'nlp'],
    'Security':   ['hack', 'breach', 'vulnerability', 'malware', 'ransomware', 'cyber', 'phishing', 'zero-day', 'ddos', 'exploit'],
    'Startups':   ['startup', 'founder', 'venture capital', 'seed round', 'series a', 'series b', 'unicorn', 'ipo', 'accelerator'],
    'Space':      ['nasa', 'spacex', 'rocket', 'satellite', 'mars', 'astronaut', 'orbital', 'isro', 'lunar'],
    'India':      ['india', 'indian', 'modi', 'delhi', 'mumbai', 'bengaluru', 'rupee', 'bcci', 'bollywood'],
};

// ── India-specific entity detection ──────────────────────────────────────────
const INDIA_POLITICAL_ENTITIES = [
    'bjp', 'bharatiya janata', 'indian national congress', 'aam aadmi party', 'aap ',
    'trinamool', 'tmc ', 'shiv sena', 'shivsena', 'samajwadi party', 'bsp ', 'bahujan',
    'ncp ', 'rashtriya', 'jdu ', 'rjd ', 'lok sabha', 'rajya sabha', 'vidhan sabha',
    'modi ', 'narendra modi', 'pm modi', 'rahul gandhi', 'sonia gandhi', 'priyanka gandhi',
    'amit shah', 'yogi adityanath', 'mamata banerjee', 'arvind kejriwal', 'nitish kumar',
    'lalu prasad', 'election commission of india', 'india election', 'india parliament',
];

const INDIA_GEO_CULTURE = [
    'india', 'indian', 'new delhi', 'mumbai', 'bengaluru', 'bangalore', 'chennai',
    'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'uttar pradesh', 'maharashtra',
    'rupee', 'rbi', 'sensex', 'nifty', 'sebi', 'niti aayog',
    'bollywood', 'tollywood', 'bcci', 'ipl', 'team india',
    'tata group', 'reliance industries', 'infosys', 'wipro', 'tcs',
];

const INDIA_CORRECT_TARGETS: PrimaryCategory[] = [
    'World Affairs', 'Business & Finance', 'Health', 'Sports', 'Entertainment',
    'Technology', 'Science & Space', 'Climate & Environment',
];

function applyIndiaOverride(
    primary: PrimaryCategory,
    text: string,
    secondaryTags: string[]
): { primary: PrimaryCategory; secondaryTags: string[] } {
    const lower = text.toLowerCase();

    let hasIndiaPolitical = false;
    for (const entity of INDIA_POLITICAL_ENTITIES) {
        if (lower.includes(entity)) { hasIndiaPolitical = true; break; }
    }

    let indiaGeoCount = 0;
    for (const term of INDIA_GEO_CULTURE) {
        if (lower.includes(term)) indiaGeoCount++;
    }

    const hasStrongIndia = hasIndiaPolitical || indiaGeoCount >= 2;
    if (!hasStrongIndia) return { primary, secondaryTags };

    const tags = secondaryTags.includes('India') ? secondaryTags : ['India', ...secondaryTags].slice(0, 3);

    // Override only clearly wrong categories for India political news
    if (hasIndiaPolitical && !INDIA_CORRECT_TARGETS.includes(primary)) {
        return { primary: 'World Affairs', secondaryTags: tags };
    }
    if (hasIndiaPolitical && primary === 'General') {
        return { primary: 'World Affairs', secondaryTags: tags };
    }

    return { primary, secondaryTags: tags };
}

// ── Opinion signals ──────────────────────────────────────────────────────────
const OPINION_WORDS = [
    'should', 'must', 'need to', 'ought to', 'believe', 'think', 'feel',
    'argue', 'claim', 'opinion', 'view', 'perspective', 'i think', 'we must',
    'in my view', 'it is time', 'we should', 'we need', 'wake up',
    'dangerous', 'wrong', 'right', 'terrible', 'wonderful', 'outrageous',
    'disgrace', 'shameful', 'brilliant', 'absurd', 'ridiculous',
];

const FACTUAL_SIGNALS = [
    /\b(said|says|stated|confirmed|announced|reported|according to)\b/i,
    /\b\d+(\.\d+)?(%|percent|million|billion|trillion|thousand)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
    /"\w[^"]{5,}"/,       // quoted speech
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/,   // proper nouns (NER approximation)
];

const CLICKBAIT_PATTERNS = [
    /you won'?t believe/i, /this will (shock|amaze|blow)/i,
    /\b(shocking|mindblowing|unbelievable|incredible|insane)\b/i,
    /\bclick(bait)?\b/i, /\d+ (reasons|things|ways|secrets|tricks)\b/i,
    /what happens next/i, /doctors hate/i, /one weird trick/i,
];

// ── Math helpers ───────────────────────────────────────────────────────────────

function softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map(x => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

function tokenize(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s\-]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
}

// ── TF-IDF + LogReg inference ──────────────────────────────────────────────────

function tfidfTransform(tokens: string[], model: ModelArtifact): number[] {
    const numFeatures = model.idf.length;
    const tf: number[] = new Array(numFeatures).fill(0);
    const vocab = model.vocab;

    for (let i = 0; i < tokens.length; i++) {
        const t1 = tokens[i];
        if (vocab[t1] !== undefined) tf[vocab[t1]] += 1;
        if (i + 1 < tokens.length) {
            const bigram = `${t1} ${tokens[i + 1]}`;
            if (vocab[bigram] !== undefined) tf[vocab[bigram]] += 1;
        }
    }

    const vec: number[] = new Array(numFeatures).fill(0);
    let norm = 0;
    for (let i = 0; i < numFeatures; i++) {
        if (tf[i] > 0) {
            const tfVal = model.sublinear_tf ? (1 + Math.log(tf[i])) : tf[i];
            vec[i] = tfVal * model.idf[i];
            norm += vec[i] * vec[i];
        }
    }

    if (norm > 0) {
        const normFactor = 1 / Math.sqrt(norm);
        for (let i = 0; i < numFeatures; i++) vec[i] *= normFactor;
    }

    return vec;
}

function logregPredict(vec: number[], model: ModelArtifact): { label: string; confidence: number; topFeatures: string[] } {
    const logits = model.coef.map((row, c) => {
        let sum = model.intercept[c];
        for (let i = 0; i < vec.length; i++) {
            if (vec[i] !== 0) sum += row[i] * vec[i];
        }
        return sum;
    });

    const probs = softmax(logits);
    let bestIdx = 0;
    for (let i = 1; i < probs.length; i++) {
        if (probs[i] > probs[bestIdx]) bestIdx = i;
    }

    const contributions = [];
    const row = model.coef[bestIdx];
    for (let i = 0; i < vec.length; i++) {
        if (vec[i] !== 0) {
            contributions.push({ index: i, weight: row[i] * vec[i] });
        }
    }
    contributions.sort((a, b) => b.weight - a.weight);
    
    const topIndices = contributions.slice(0, 3).map(c => c.index);
    const topFeatures = [];
    for (const [word, index] of Object.entries(model.vocab)) {
        if (topIndices.includes(index)) {
            topFeatures.push(word);
        }
    }

    return {
        label: model.classes[bestIdx],
        confidence: probs[bestIdx],
        topFeatures,
    };
}

// ── Keyword fallback classifier ────────────────────────────────────────────────

const KEYWORD_CATEGORY_MAP: Record<string, string[]> = {
    'Technology': ['tech', 'software', 'app', 'digital', 'computer', 'internet', 'online', 'data', 'cloud', 'chip', 'semiconductor', 'microsoft', 'apple', 'google', 'meta', 'amazon'],
    'Science & Space': ['science', 'research', 'study', 'physics', 'space', 'nasa', 'planet', 'biology', 'quantum', 'experiment', 'discovery', 'molecule'],
    'Business & Finance': ['business', 'economy', 'stock', 'market', 'bank', 'finance', 'trade', 'revenue', 'profit', 'gdp', 'inflation', 'investment', 'merger', 'acquisition', 'ceo'],
    'World Affairs': ['politics', 'government', 'war', 'conflict', 'election', 'president', 'minister', 'diplomacy', 'military', 'nato', 'un ', 'sanctions', 'treaty', 'parliament'],
    'Health': ['health', 'medical', 'hospital', 'doctor', 'disease', 'vaccine', 'treatment', 'cancer', 'covid', 'fda', 'clinical', 'wellness', 'nutrition'],
    'Sports': ['sports', 'game', 'match', 'player', 'team', 'championship', 'tournament', 'nba', 'nfl', 'cricket', 'football', 'soccer', 'tennis', 'olympics'],
    'Entertainment': ['movie', 'film', 'music', 'actor', 'netflix', 'streaming', 'celebrity', 'oscar', 'grammy', 'gaming', 'television', 'show', 'album'],
    'Climate & Environment': ['climate', 'carbon', 'renewable', 'solar', 'emissions', 'environment', 'green', 'wildfire', 'flood', 'drought', 'pollution'],
};

function keywordFallback(text: string): { primary: PrimaryCategory; confidence: number } {
    const lower = text.toLowerCase();
    let best: PrimaryCategory = 'General';
    let bestScore = 0;
    for (const [cat, words] of Object.entries(KEYWORD_CATEGORY_MAP)) {
        const score = words.filter(w => lower.includes(w)).length;
        if (score > bestScore) { bestScore = score; best = cat as PrimaryCategory; }
    }
    return { primary: best, confidence: bestScore > 0 ? Math.min(0.5, bestScore * 0.12) : 0.1 };
}

function extractSecondaryTags(text: string, primary: string): string[] {
    const lower = text.toLowerCase();
    const tokens = new Set(lower.split(/\s+/).map(t => t.replace(/[^a-z0-9]/g, '')));
    const tags: string[] = [];

    for (const [tag, words] of Object.entries(SECONDARY_KEYWORD_MAP)) {
        const matched = words.some(w => {
            if (w.length <= 3) return tokens.has(w.replace(/[^a-z0-9]/g, ''));
            return lower.includes(w);
        });
        if (matched) tags.push(tag);
    }
    return tags.filter(t => t !== primary).slice(0, 3);
}

// ── Main NLP Service class ─────────────────────────────────────────────────────

class NlpService {
    private model: ModelArtifact | null = null;
    private status: 'ready' | 'missing' | 'loading' = 'loading';
    private meta: Record<string, any> = {};

    constructor() {
        this.loadModel();
    }

    private loadModel() {
        try {
            if (fs.existsSync(MODEL_PATH)) {
                const raw = fs.readFileSync(MODEL_PATH, 'utf-8');
                this.model = JSON.parse(raw) as ModelArtifact;
                this.status = 'ready';
                if (fs.existsSync(META_PATH)) {
                    this.meta = JSON.parse(fs.readFileSync(META_PATH, 'utf-8'));
                }
                console.log(`[NLP] Classifier ready. Artifacts loaded from: ${path.basename(MODEL_PATH)}`);
            } else {
                this.status = 'missing';
                console.warn('[NLP] Classifier model not found in /src/ai/models/ — falling back to keywords.');
            }
        } catch (err) {
            this.status = 'missing';
            console.error('[NLP] Failed to load model:', err);
        }
    }

    getStatus() {
        return {
            status: this.status,
            accuracy: this.meta.accuracy ?? null,
            trainedAt: this.meta.trainedAt ?? null,
            categories: this.meta.categories ?? FINAL_CATEGORIES,
        };
    }

    // ── 1. Topic classification ──────────────────────────────────────────

    classifyArticle(title: string, content?: string, source?: string): ClassificationResult {
        const text = [title, content].filter(Boolean).join(' ');
        const tokens = tokenize(text);

        let primary: PrimaryCategory;
        let confidence: number;
        let classificationSignals: string[] = [];

        if (this.model && this.status === 'ready' && tokens.length > 0) {
            const vec = tfidfTransform(tokens, this.model);
            const pred = logregPredict(vec, this.model);
            primary = (FINAL_CATEGORIES.includes(pred.label as PrimaryCategory) ? pred.label : 'General') as PrimaryCategory;
            confidence = pred.confidence;
            classificationSignals = pred.topFeatures;
        } else {
            const fb = keywordFallback(text);
            primary = fb.primary;
            confidence = fb.confidence;
        }

        const secondaryTags = extractSecondaryTags(text, primary);
        const indiaResult = applyIndiaOverride(primary, text, secondaryTags);
        return {
            primary: indiaResult.primary,
            confidence: Math.round(confidence * 1000) / 1000,
            secondaryTags: indiaResult.secondaryTags,
            classificationSignals,
        };
    }

    // ── 2. Sentiment analysis (Delegated to SentimentService) ────────────

    async analyzeSentiment(text: string): Promise<SentimentResult> {
        return sentimentService.analyze(text);
    }

    // ── 3. Opinion vs Fact ───────────────────────────────────────────────

    detectOpinionVsFact(title: string, content?: string): OpinionResult {
        const text = [title, content].filter(Boolean).join(' ').toLowerCase();

        let opinionScore = 0;
        let factScore = 0;
        const triggeredOpinionWords: string[] = [];

        for (const word of OPINION_WORDS) {
            if (text.includes(word)) { opinionScore += 1; triggeredOpinionWords.push(word); }
        }

        const opinionTitlePhrases = ['opinion:', 'op-ed', 'commentary', 'letter to', 'point of view', 'perspective:'];
        for (const p of opinionTitlePhrases) {
            if (title.toLowerCase().includes(p)) { opinionScore += 3; triggeredOpinionWords.push(p); }
        }

        for (const pattern of FACTUAL_SIGNALS) {
            if (pattern.test(text)) factScore += 1;
        }

        const numberCount = (text.match(/\b\d+\b/g) || []).length;
        factScore += Math.min(4, Math.floor(numberCount / 2));

        const total = opinionScore + factScore;
        if (total === 0) return { type: 'Factual', confidence: 0.5, signals: [] };

        const opinionProb = opinionScore / total;
        const signals = triggeredOpinionWords.slice(0, 4);
        if (opinionProb > 0.45) return { type: 'Opinion', confidence: Math.min(0.95, opinionProb + 0.1), signals };
        return { type: 'Factual', confidence: Math.min(0.95, 1 - opinionProb + 0.05), signals: [] };
    }

    // ── 4. Reliability scoring ───────────────────────────────────────────

    scoreReliability(title: string, content?: string, source?: string, pubDate?: string, feedReliability: number = 5): ReliabilityResult {
        let score = 40; // baseline
        const signals: string[] = [];

        const reliabilityBonus = feedReliability * 4;
        score += reliabilityBonus;
        signals.push(`Source reliability (+${reliabilityBonus})`);

        const text = [title, content].filter(Boolean).join(' ');

        let clickbaitPenalty = 0;
        for (const pattern of CLICKBAIT_PATTERNS) {
            if (pattern.test(text)) { clickbaitPenalty += 10; }
        }
        if (clickbaitPenalty > 0) {
            score -= clickbaitPenalty;
            signals.push(`Clickbait signals (-${clickbaitPenalty})`);
        }

        let factBonus = 0;
        for (const pattern of FACTUAL_SIGNALS) {
            if (pattern.test(text)) factBonus += 2;
        }
        factBonus = Math.min(10, factBonus);
        if (factBonus > 0) { score += factBonus; signals.push(`Factual content (+${factBonus})`); }

        const numCount = (text.match(/\b\d+(\.\d+)?(%|percent|million|billion)?\b/g) || []).length;
        if (numCount >= 3) { score += 5; signals.push('Data/numbers present (+5)'); }

        if (/"[^"]{10,}"/.test(text)) { score += 5; signals.push('Direct quotes (+5)'); }

        if (title.length < 20) { score -= 5; signals.push('Very short headline (-5)'); }
        else if (title.length > 120) { score -= 5; signals.push('Overly long headline (-5)'); }

        const capsWords = title.match(/\b[A-Z]{4,}\b/g) || [];
        if (capsWords.length >= 2) { score -= 8; signals.push('Sensationalist caps (-8)'); }

        score = Math.max(0, Math.min(100, Math.round(score)));

        let tier: ReliabilityTier;
        if (score >= 65) tier = 'High';
        else if (score >= 55) tier = 'Medium';
        else tier = 'Low';

        return { score, tier, signals };
    }
}

export const nlpService = new NlpService();

