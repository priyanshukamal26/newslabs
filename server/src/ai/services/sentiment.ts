import { pipeline, Pipeline } from '@xenova/transformers';

export type Sentiment = 'Positive' | 'Neutral' | 'Negative';

export interface SentimentResult {
    sentiment: Sentiment;
    score: number;            // -1 to +1
    signals?: string[];       // words that triggered the result (lexicon only)
    method: 'transformer' | 'lexicon';
}

// ── Lexicon Logic (Legacy Fallback) ──────────────────────────────────────────

const POSITIVE_WORDS = new Set([
    'good', 'great', 'excellent', 'positive', 'success', 'win', 'won', 'victory',
    'growth', 'improve', 'improvement', 'record', 'breakthrough', 'innovation',
    'benefit', 'gain', 'rise', 'boost', 'surge', 'thrive', 'profit', 'advance',
    'launch', 'award', 'celebrate', 'recover', 'solution', 'hope', 'progress',
    'agreement', 'deal', 'partnership', 'approved', 'support', 'efficient',
    'effective', 'lead', 'leading', 'best', 'top', 'strong', 'healthy',
    'safe', 'secure', 'peace', 'save', 'rescue', 'discover', 'expand',
]);

const NEGATIVE_WORDS = new Set([
    'bad', 'poor', 'fail', 'failure', 'loss', 'lose', 'lost', 'decline',
    'drop', 'fall', 'crash', 'crisis', 'disaster', 'concern', 'worry', 'fear',
    'threat', 'risk', 'danger', 'attack', 'war', 'conflict', 'dead', 'death',
    'kill', 'hurt', 'injury', 'disease', 'outbreak', 'ban', 'block', 'cut',
    'layoff', 'fired', 'sue', 'sued', 'scandal', 'fraud', 'corruption',
    'breach', 'hack', 'leak', 'crash', 'collapse', 'bankrupt', 'deficit',
    'inflation', 'recession', 'violence', 'protest', 'riot', 'resign',
]);

const NEGATION_WORDS = new Set(['not', 'no', 'never', 'neither', 'nor', "n't", 'without', 'fails', 'unable']);

class SentimentService {
    private transformer: any | null = null;
    private isLoading = false;

    constructor() {
        this.initTransformer();
    }

    private async initTransformer() {
        if (this.isLoading) return;
        this.isLoading = true;
        try {
            console.log('[AI] Initialising Sentiment Transformer (DistilBERT)...');
            this.transformer = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            console.log('[AI] Sentiment Transformer ready.');
        } catch (err) {
            console.error('[AI] Failed to load Sentiment Transformer:', err);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Analyze sentiment using Transformer (Primary) or Lexicon (Fallback)
     */
    async analyze(text: string): Promise<SentimentResult> {
        if (!text || text.length < 5) return { sentiment: 'Neutral', score: 0, method: 'lexicon' };

        // 1. Try Transformer
        if (this.transformer) {
            try {
                const results = await this.transformer(text);
                const result = results[0];
                
                // Map POSITIVE/NEGATIVE to our types
                const sentiment: Sentiment = result.label === 'POSITIVE' ? 'Positive' : 'Negative';
                
                // Convert confidence score (0 to 1) to our -1 to 1 range
                let score = result.score;
                if (sentiment === 'Negative') score = -score;

                // If score is very close to zero, call it neutral (though SST-2 is binary)
                if (Math.abs(score) < 0.1) return { sentiment: 'Neutral', score, method: 'transformer' };

                return { sentiment, score: Math.round(score * 100) / 100, method: 'transformer' };
            } catch (err) {
                console.error('[AI] Transformer inference error, falling back to Lexicon:', err);
            }
        }

        // 2. Fallback to Lexicon
        return this.analyzeLexicon(text);
    }

    private analyzeLexicon(text: string): SentimentResult {
        const words = text.toLowerCase().replace(/[^a-z0-9\s\-]/g, ' ').split(/\s+/).filter(t => t.length > 1);
        let pos = 0;
        let neg = 0;
        let negated = false;
        const posFound: string[] = [];
        const negFound: string[] = [];

        for (const w of words) {
            if (NEGATION_WORDS.has(w)) { negated = true; continue; }
            if (POSITIVE_WORDS.has(w)) {
                negated ? (neg++, negFound.push(`NOT ${w}`)) : (pos++, posFound.push(w));
                negated = false;
            } else if (NEGATIVE_WORDS.has(w)) {
                negated ? (pos++, posFound.push(`NOT ${w}`)) : (neg++, negFound.push(w));
                negated = false;
            } else negated = false;
        }

        const total = pos + neg;
        if (total === 0) return { sentiment: 'Neutral', score: 0, method: 'lexicon' };

        const score = (pos - neg) / Math.max(total, 1);
        const normalized = Math.max(-1, Math.min(1, score));

        let sentiment: Sentiment;
        if (normalized > 0.1) sentiment = 'Positive';
        else if (normalized < -0.1) sentiment = 'Negative';
        else sentiment = 'Neutral';

        const signals = [
            ...posFound.slice(0, 3).map(w => `+${w}`),
            ...negFound.slice(0, 3).map(w => `-${w}`),
        ];

        return { 
            sentiment, 
            score: Math.round(normalized * 100) / 100, 
            signals, 
            method: 'lexicon' 
        };
    }
}

export const sentimentService = new SentimentService();
