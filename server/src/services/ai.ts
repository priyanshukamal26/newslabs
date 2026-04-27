import ollama from 'ollama';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AiExecutionOptions {
    provider?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    timeoutMs?: number;
    disableTimeout?: boolean;
    summaryMode?: 'concise' | 'balanced' | 'detailed';
}

export interface SummaryResult {
    summary: string;
    insights: string[];
    why: string;
    topic: string;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs?: number, disableTimeout?: boolean): Promise<T> {
    if (disableTimeout || !timeoutMs || timeoutMs <= 0 || !Number.isFinite(timeoutMs)) {
        return promise;
    }

    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`AI request timed out after ${timeoutMs}ms`)), timeoutMs);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

function normalizeProvider(provider?: string): string {
    const value = (provider || '').trim().toLowerCase();
    if (!value) return 'hybrid';
    return value;
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function buildConcisePrompt(text: string): string {
    return `You are an expert news analyst for a premium news aggregation platform.

Write a compact but highly accurate summary that keeps the most important facts and avoids filler. Preserve names, numbers, dates, prices, measurements, and outcomes whenever they matter. Do not generalize away important details.

Rules:
- No invented facts.
- No vague wording.
- Keep the article faithful and specific.
- Insights should be short but meaningful.
- "Why" should be brief and useful.
- Topic must be exactly one allowed label.

Article content:
"${text.substring(0, 5000)}"

Return only valid JSON with exactly this structure:
{
  "summary": "A 2-3 sentence summary that captures the core news.",
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ],
  "why": "A 1-sentence explanation of why this article matters.",
  "topic": "Exactly one from: AI & ML, Web Dev, Science, Startups, Crypto, Design, DevOps, Security, Politics, Business, Health, Sports, Entertainment, Climate, Space, India, World, General"
}

Important:
- Output JSON only.
- Do not add any extra keys.
- Do not add markdown or commentary.`;
}

function buildBalancedPrompt(text: string): string {
    return `You are an expert news analyst for a premium news aggregation platform.

Write a balanced summary that gives enough context for clear understanding while staying compact. Preserve the most important concrete details: names, organizations, dates, numbers, prices, measurements, outcomes, and direct implications. Avoid generic phrasing and do not omit important specifics.

Rules:
- Do not invent anything.
- Keep the summary readable and factual.
- Make the insights distinct and useful.
- Include the article's main angle and its real-world significance.
- If the article contains technical, scientific, financial, or political details, preserve them accurately.
- Topic must be exactly one allowed label.

Article content:
"${text.substring(0, 5000)}"

Return only valid JSON with exactly this structure:
{
  "summary": "A 4-5 sentence summary that is specific and informative.",
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3",
    "Insight 4",
    "Insight 5"
  ],
  "why": "A 2-sentence explanation of why this article matters.",
  "topic": "Exactly one from: AI & ML, Web Dev, Science, Startups, Crypto, Design, DevOps, Security, Politics, Business, Health, Sports, Entertainment, Climate, Space, India, World, General"
}

Important:
- Output JSON only.
- Do not add any extra keys.
- Do not add markdown or commentary.`;
}

function buildDetailedPrompt(text: string): string {
    return `You are an expert news analyst for a premium news aggregation platform.

Write a detailed, high-fidelity summary that captures the article's key facts, context, nuance, and significance. Preserve specific names, numbers, dates, places, claims, outcomes, comparisons, and any technical or domain-specific details that help the reader fully understand the story.

Rules:
- Do not hallucinate or infer unsupported facts.
- Do not turn specific facts into vague generalities.
- Keep the article's framing accurate, especially for science, business, politics, technology, and product review pieces.
- Include the most important supporting details, not just the headline claim.
- The insights should cover different angles: main takeaway, context, implication, technical detail, comparison, or consequence.
- The "why" section should explain both immediate relevance and broader significance.
- Topic must be exactly one allowed label.

Article content:
"${text.substring(0, 5000)}"

Return only valid JSON with exactly this structure:
{
  "summary": "A 6-8 sentence summary that is detailed, specific, and faithful to the article.",
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3",
    "Insight 4",
    "Insight 5"
  ],
  "why": "A 2-3 sentence explanation of why this article matters.",
  "topic": "Exactly one from: AI & ML, Web Dev, Science, Startups, Crypto, Design, DevOps, Security, Politics, Business, Health, Sports, Entertainment, Climate, Space, India, World, General"
}

Important:
- Output JSON only.
- Do not add any extra keys.
- Do not add markdown or commentary.`;
}

function buildPrompt(text: string, mode?: 'concise' | 'balanced' | 'detailed'): string {
    switch (mode) {
        case 'concise': return buildConcisePrompt(text);
        case 'detailed': return buildDetailedPrompt(text);
        default: return buildBalancedPrompt(text);
    }
}

// ── Service class ──────────────────────────────────────────────────────────────

export class AiService {
    private localModel = process.env.AI_MODEL || 'llama3';
    private defaultProvider = normalizeProvider(process.env.AI_PROVIDER || 'hybrid');
    private systemGroqKey = process.env.GROQ_API_KEY || '';
    private systemGroqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    private systemGeminiKey = process.env.GEMINI_API_KEY || '';
    private systemGeminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    private getProvider(provider?: string): string {
        return normalizeProvider(provider || this.defaultProvider);
    }

    async chat(message: string, options?: AiExecutionOptions): Promise<string> {
        try {
            return await this.chatStrict(message, options);
        } catch (error) {
            console.error('AI chat failed:', error);
            return "I'm having trouble connecting to AI right now. Please try again.";
        }
    }

    async chatStrict(message: string, options?: AiExecutionOptions): Promise<string> {
        const provider = this.getProvider(options?.provider);

        if (provider === 'hybrid') {
            try {
                return await this.chatGroq(message, options);
            } catch {
                return this.chatGemini(message, options);
            }
        }

        if (provider.includes('groq')) {
            return this.chatGroq(message, options);
        }

        if (provider.includes('gemini')) {
            return this.chatGemini(message, options);
        }

        if (provider === 'local' || provider === 'ollama') {
            return this.chatLocal(message, options);
        }

        if (options?.baseUrl) {
            return this.chatOpenAiCompatible(message, options);
        }

        throw new Error(`Unsupported provider: ${provider}. Add base URL for custom provider.`);
    }

    async summarize(text: string, options?: AiExecutionOptions): Promise<SummaryResult> {
        try {
            return await this.summarizeStrict(text, options);
        } catch (error) {
            console.error('AI summarize failed:', error);
            return {
                summary: 'Error generating summary. The AI service may be busy. Try again shortly.',
                insights: [],
                why: 'Analysis failed.',
                topic: 'Uncategorized',
            };
        }
    }

    async summarizeStrict(text: string, options?: AiExecutionOptions): Promise<SummaryResult> {
        const provider = this.getProvider(options?.provider);
        const prompt = buildPrompt(text, options?.summaryMode);

        if (provider === 'hybrid') {
            try {
                return await this.summarizeGroq(prompt, options);
            } catch {
                return this.summarizeGemini(prompt, options);
            }
        }

        if (provider.includes('groq')) {
            return this.summarizeGroq(prompt, options);
        }

        if (provider.includes('gemini')) {
            return this.summarizeGemini(prompt, options);
        }

        if (provider === 'local' || provider === 'ollama') {
            return this.summarizeLocal(prompt, options);
        }

        if (options?.baseUrl) {
            return this.summarizeOpenAiCompatible(prompt, options);
        }

        throw new Error(`Unsupported provider: ${provider}. Add base URL for custom provider.`);
    }

    private async chatLocal(message: string, options?: AiExecutionOptions): Promise<string> {
        const response = await withTimeout(
            ollama.chat({
                model: options?.model || this.localModel,
                messages: [{ role: 'user', content: message }],
            }),
            options?.timeoutMs,
            options?.disableTimeout
        );

        return response.message.content;
    }

    private async chatGroq(message: string, options?: AiExecutionOptions): Promise<string> {
        const apiKey = options?.apiKey || this.systemGroqKey;
        if (!apiKey) throw new Error('Groq API key not configured');

        const groq = new Groq({ apiKey });
        const completion = await withTimeout(
            groq.chat.completions.create({
                messages: [{ role: 'user', content: message }],
                model: options?.model || this.systemGroqModel,
            }),
            options?.timeoutMs,
            options?.disableTimeout
        );

        return completion.choices[0]?.message?.content || 'No response from Groq.';
    }

    private async chatGemini(message: string, options?: AiExecutionOptions): Promise<string> {
        const apiKey = options?.apiKey || this.systemGeminiKey;
        if (!apiKey) throw new Error('Gemini API key not configured');

        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: options?.model || this.systemGeminiModel });
        const result = await withTimeout(
            model.generateContent(message),
            options?.timeoutMs,
            options?.disableTimeout
        );

        return result.response.text() || 'No response from Gemini.';
    }

    private async chatOpenAiCompatible(message: string, options?: AiExecutionOptions): Promise<string> {
        if (!options?.apiKey) throw new Error('Custom provider API key is required.');
        if (!options?.baseUrl) throw new Error('Custom provider base URL is required.');
        if (!options?.model) throw new Error('Custom provider model is required.');

        const endpoint = `${options.baseUrl.replace(/\/$/, '')}/chat/completions`;
        const response = await withTimeout(fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${options.apiKey}`,
            },
            body: JSON.stringify({
                model: options.model,
                messages: [{ role: 'user', content: message }],
            }),
        }), options?.timeoutMs, options?.disableTimeout);

        if (!response.ok) {
            throw new Error(`Custom provider failed: ${response.status} ${await response.text()}`);
        }

        const data = await response.json() as any;
        return data?.choices?.[0]?.message?.content || 'No response from provider.';
    }

    private async summarizeGroq(prompt: string, options?: AiExecutionOptions): Promise<SummaryResult> {
        const apiKey = options?.apiKey || this.systemGroqKey;
        if (!apiKey) throw new Error('Groq API key not configured');

        const groq = new Groq({ apiKey });
        const completion = await withTimeout(
            groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: options?.model || this.systemGroqModel,
                response_format: { type: 'json_object' },
                max_tokens: 1200,
            }),
            options?.timeoutMs,
            options?.disableTimeout
        );

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content returned by Groq.');
        return JSON.parse(content) as SummaryResult;
    }

    private async summarizeGemini(prompt: string, options?: AiExecutionOptions): Promise<SummaryResult> {
        const apiKey = options?.apiKey || this.systemGeminiKey;
        if (!apiKey) throw new Error('Gemini API key not configured');

        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: options?.model || this.systemGeminiModel });

        const result = await withTimeout(
            model.generateContent(prompt + '\n\nRespond strictly in valid JSON.'),
            options?.timeoutMs,
            options?.disableTimeout
        );

        let text = result.response.text();
        text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        return JSON.parse(text) as SummaryResult;
    }

    private async summarizeOpenAiCompatible(prompt: string, options?: AiExecutionOptions): Promise<SummaryResult> {
        const message = `${prompt}\n\nReturn JSON only.`;
        const content = await this.chatOpenAiCompatible(message, options);
        return JSON.parse(content) as SummaryResult;
    }

    private async summarizeLocal(prompt: string, options?: AiExecutionOptions): Promise<SummaryResult> {
        const response = await withTimeout(
            ollama.chat({
                model: options?.model || this.localModel,
                messages: [{ role: 'user', content: prompt }],
                format: 'json',
            }),
            options?.timeoutMs,
            options?.disableTimeout
        );

        return JSON.parse(response.message.content) as SummaryResult;
    }

    async validateCredential(params: {
        provider: string;
        apiKey: string;
        model: string;
        baseUrl?: string;
    }): Promise<{ ok: boolean; message: string }> {
        const provider = normalizeProvider(params.provider);

        try {
            if (provider.includes('groq')) {
                const response = await fetch('https://api.groq.com/openai/v1/models', {
                    headers: { Authorization: `Bearer ${params.apiKey}` },
                });
                if (!response.ok) {
                    return { ok: false, message: `Groq validation failed (${response.status}).` };
                }
                return { ok: true, message: 'Groq key is valid.' };
            }

            if (provider.includes('gemini')) {
                const client = new GoogleGenerativeAI(params.apiKey);
                const model = client.getGenerativeModel({ model: params.model || this.systemGeminiModel });
                await model.generateContent('Reply with one token: ok');
                return { ok: true, message: 'Gemini key is valid.' };
            }

            if (params.baseUrl) {
                const endpoint = `${params.baseUrl.replace(/\/$/, '')}/models`;
                const response = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${params.apiKey}` },
                });
                if (!response.ok) {
                    return { ok: false, message: `Custom provider validation failed (${response.status}).` };
                }
                return { ok: true, message: 'Custom provider key is valid.' };
            }

            return { ok: false, message: 'Unsupported provider. Add base URL for custom provider validation.' };
        } catch (error: any) {
            return { ok: false, message: error?.message || 'Validation failed.' };
        }
    }

    async categorize(title: string, snippet: string): Promise<{ topic: string; timeToRead: string }> {
        const wordCount = (snippet || title || '').split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return { topic: 'Uncategorized', timeToRead: `${minutes} min` };
    }

    async analyzeTrending(articleTitles: string[]): Promise<string[]> {
        if (!articleTitles || articleTitles.length === 0) return ['No Data'];

        const stopwords = new Set(['the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'new', 'more', 'an', 'was', 'we', 'will', 'home', 'can', 'us', 'about', 'if', 'page', 'my', 'has', 'search', 'free', 'but', 'our', 'one', 'other', 'do', 'no', 'information', 'time', 'they', 'site', 'he', 'up', 'may', 'what', 'which', 'their', 'news', 'out', 'use', 'any', 'there', 'see', 'only', 'so', 'his', 'when', 'contact', 'here', 'business', 'who', 'web', 'also', 'now', 'help', 'get', 'pm', 'view', 'online', 'first', 'am', 'been', 'would', 'how', 'were', 'me', 's', 'services', 'some', 'these', 'click', 'its', 'like', 'service', 'x', 'than', 'find', 'price', 'date', 'back', 'top', 'people', 'had', 'list', 'name', 'just', 'over', 'state', 'year', 'day', 'into', 'email', 'two', 'health', 'n', 'world', 're', 'next', 'used', 'go', 'b', 'work', 'last', 'most', 'products', 'music', 'buy', 'data', 'make', 'them', 'should', 'product', 'system', 'post', 'her', 'city', 't', 'add', 'policy', 'number', 'such', 'please', 'available', 'copyright', 'support', 'message', 'after', 'best', 'software', 'then', 'jan', 'good', 'video', 'well', 'd', 'where', 'info', 'rights', 'public', 'books', 'high', 'school', 'through', 'm', 'each', 'links', 'she', 'review', 'years', 'order', 'very', 'privacy', 'book', 'items', 'company', 'read', 'group', 'sex', 'need', 'many', 'user', 'said', 'de', 'does', 'set', 'under', 'general', 'research', 'university', 'january', 'mail', 'full', 'map', 'reviews', 'program', 'life']);
        
        const counts: Record<string, number> = {};
        for (const title of articleTitles) {
            const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
            
            // Count unigrams
            for (const word of words) {
                counts[word] = (counts[word] || 0) + 1;
            }
            
            // Count bigrams
            for (let i = 0; i < words.length - 1; i++) {
                const bigram = `${words[i]} ${words[i+1]}`;
                counts[bigram] = (counts[bigram] || 0) + 1.5; // weight bigrams slightly higher
            }
        }

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        
        // Filter out overlapping unigrams/bigrams naively and take top 7
        const trends: string[] = [];
        for (const [word] of sorted) {
            if (trends.length >= 7) break;
            const isSubpart = trends.some(t => t.includes(word) || word.includes(t));
            if (!isSubpart) {
                // capitalize first letter
                trends.push(word.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
            }
        }
        
        return trends.length > 0 ? trends : ['Global Developments', 'AI & ML', 'Startups', 'Cybersecurity', 'Health Tech', 'Space', 'Innovation'];
    }

    async analyzeInsights(articleTitles: string[], articleTopics: string[]): Promise<{
        topTrend: { name: string; count: number };
        mostReadTopic: { name: string; percentage: number };
        emerging: { name: string; growth: string };
    }> {
        return {
            topTrend: { name: 'Global Developments', count: 4 },
            mostReadTopic: { name: 'AI & ML', percentage: 32 },
            emerging: { name: 'AI Safety', growth: '+140%' },
        };
    }
}

export const aiService = new AiService();
