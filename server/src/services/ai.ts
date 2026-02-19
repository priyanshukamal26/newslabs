import ollama from 'ollama';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

export class AiService {
    private model = process.env.AI_MODEL || 'llama3';
    private provider = process.env.AI_PROVIDER || 'local';
    private groq: Groq | null = null;
    private gemini: GoogleGenerativeAI | null = null;
    private geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    constructor() {
        try {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });
        } catch (e) {
            console.warn("Groq SDK initialization failed.");
        }
        try {
            if (process.env.GEMINI_API_KEY) {
                this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            }
        } catch (e) {
            console.warn("Gemini SDK initialization failed.");
        }
    }

    async chat(message: string): Promise<string> {
        if (this.provider === 'groq') {
            return this.chatGroq(message);
        } else if (this.provider === 'local') {
            return this.chatLocal(message);
        } else {
            return "External API mode not yet implemented.";
        }
    }

    private async chatLocal(message: string): Promise<string> {
        try {
            const response = await ollama.chat({
                model: this.model,
                messages: [{ role: 'user', content: message }],
            });
            return response.message.content;
        } catch (error) {
            console.error('Ollama Chat Error:', error);
            return "I'm having trouble connecting to my local brain. Is Ollama running?";
        }
    }

    private async chatGroq(message: string): Promise<string> {
        if (!this.groq) return "Groq API key not configured.";
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: message }],
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            });
            return completion.choices[0]?.message?.content || "No response from Groq.";
        } catch (error) {
            console.error('Groq Chat Error:', error);
            return "Error connecting to Groq API. Please check your API key.";
        }
    }

    async categorize(title: string, snippet: string): Promise<{ topic: string; timeToRead: string }> {
        const wordCount = (snippet || title || '').split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        const timeToRead = `${minutes} min`;

        if (this.provider === 'groq' && this.groq) {
            try {
                const completion = await this.groq.chat.completions.create({
                    messages: [{
                        role: 'user',
                        content: `Classify this news article into exactly ONE topic from this list: AI & ML, Web Dev, Science, Startups, Crypto, Design, DevOps, Security, Politics, Business, Health, Sports, Entertainment, Climate, Space.

Title: "${title}"
Snippet: "${(snippet || '').substring(0, 500)}"

Respond with ONLY a JSON object: {"topic": "chosen topic"}`
                    }],
                    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                    response_format: { type: 'json_object' },
                    max_tokens: 50,
                });
                const content = completion.choices[0]?.message?.content;
                if (content) {
                    const parsed = JSON.parse(content);
                    return { topic: parsed.topic || 'Uncategorized', timeToRead };
                }
            } catch (error) {
                console.error('Categorization error:', error);
            }
        }
        return { topic: 'Uncategorized', timeToRead };
    }

    async summarize(text: string, preferredProvider: string = 'hybrid'): Promise<{ summary: string; insights: string[]; why: string; topic: string }> {
        const prompt = `
You are an expert news analyst for a premium news aggregation platform. Analyze the following article content thoroughly and provide a detailed, informative breakdown.

Article content:
"${text.substring(0, 5000)}"

Respond with a JSON object following this exact structure:
{
  "summary": "A detailed 4-5 sentence summary. Cover: what happened, who is involved, the broader context, and the immediate impact. Be specific with names, numbers, and facts. Avoid vague generalities.",
  "insights": [
    "Insight 1: A specific takeaway or implication",
    "Insight 2: How this connects to broader trends",
    "Insight 3: What this means for the industry or public",
    "Insight 4: A notable detail or statistic from the article",
    "Insight 5: Potential future implications"
  ],
  "why": "A 2-sentence explanation of why this article matters to someone keeping up with current events. Be concrete about the stakes.",
  "topic": "Classify into exactly ONE: AI & ML, Web Dev, Science, Startups, Crypto, Design, DevOps, Security, Politics, Business, Health, Sports, Entertainment, Climate, Space"
}

Important: Make the summary substantive and informative — a reader should understand the full story without reading the original article.
    `;

        const MAX_RETRIES = 2;
        const TIMEOUT_MS = 15000; // 15 second timeout per attempt

        const useGemini = preferredProvider === 'gemini' || preferredProvider === 'hybrid';
        const useGroq = preferredProvider === 'groq' || preferredProvider === 'hybrid';

        // Force Gemini if preferred
        if (preferredProvider === 'gemini' && this.gemini) {
            try {
                // ... direct Gemini call ...
                // Reusing fallback logic for now to avoid duplication, but ideally extract to private method
            } catch (e) { /* fallthrough */ }
        }

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                // If user specifically wanted Gemini, or if we rely on hybrid and Groq isn't primary/failed
                if (preferredProvider === 'gemini') {
                    throw new Error("Force Gemini"); // Hack to jump to catch block where Gemini fallback lives? No, cleaner to refactor.
                }

                if (useGroq) {
                    if (!this.groq) return { summary: 'Groq API Key missing', insights: [], why: 'Config error', topic: 'Config' };

                    // Create abort controller for timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                    try {
                        const completion = await this.groq.chat.completions.create(
                            {
                                messages: [{ role: 'user', content: prompt }],
                                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                                response_format: { type: 'json_object' },
                                max_tokens: 800,
                            },
                            { signal: controller.signal }
                        );
                        clearTimeout(timeoutId);

                        const content = completion.choices[0]?.message?.content;
                        return content ? JSON.parse(content) : { summary: 'Error', insights: [], why: 'No content', topic: 'Unknown' };
                    } catch (err: any) {
                        clearTimeout(timeoutId);

                        // Rate limited (429) — wait and retry
                        if (err?.status === 429 || err?.error?.type === 'rate_limit_error') {
                            const waitMs = Math.min(2000 * Math.pow(2, attempt), 10000); // 2s, 4s, 8s (cap 10s)
                            console.warn(`Groq rate limited. Waiting ${waitMs}ms before retry ${attempt + 1}/${MAX_RETRIES}...`);
                            await new Promise(resolve => setTimeout(resolve, waitMs));
                            continue; // retry
                        }

                        // Timeout — don't retry, return graceful error
                        if (err?.name === 'AbortError' || err?.message?.includes('abort')) {
                            console.warn('Groq request timed out after 15s');
                            // If hybrid/gemini, allow fallthrough to fallback
                            if (preferredProvider === 'groq') {
                                return {
                                    summary: 'Analysis timed out. Please try again.',
                                    insights: ['The AI service is currently slow — try again in a moment.'],
                                    why: 'Request timed out.',
                                    topic: 'Uncategorized'
                                };
                            }
                            throw new Error("Timeout - trigger fallback");
                        }

                        // Check if we should fallback immediately on non-retryable errors
                        if (preferredProvider === 'hybrid' && (err?.status !== 429 && err?.error?.type !== 'rate_limit_error')) {
                            throw new Error("Non-retryable Groq error - trigger fallback");
                        }

                        throw err; // re-throw other errors
                    }
                }
            } catch (error: any) {
                console.error(`AI Processing Error (attempt ${attempt + 1}):`, error?.message || error);

                // On last attempt or non-retryable error, try Gemini fallback
                if (useGemini && (attempt === MAX_RETRIES || preferredProvider === 'gemini' || error?.message?.includes('fallback'))) {
                    if (this.gemini) {
                        try {
                            console.log("Switching to Gemini...");
                            const model = this.gemini.getGenerativeModel({ model: this.geminiModel });
                            const result = await model.generateContent(prompt + "\n\nRespond strictly with VALID JSON.");
                            const response = result.response;
                            let text = response.text();

                            // Remove markdown code blocks if present
                            text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();

                            return JSON.parse(text);
                        } catch (geminiError: any) {
                            console.error("Gemini Fallback Failed:", geminiError?.message || geminiError);
                        }
                    }
                }

                // If this was the last attempt and we're here, we failed
                if (attempt === MAX_RETRIES) {
                    return {
                        summary: 'Error generating summary. The AI service may be busy — try again shortly.',
                        insights: ['The AI service is experiencing high load.'],
                        why: 'Analysis unavailable.',
                        topic: 'Uncategorized'
                    };
                }

                // If not last attempt, wait before retry (backoff handled above for rate limits)
                if (attempt < MAX_RETRIES && !error?.message?.includes('fallback')) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }

        // Fallback (should not reach here)
        return { summary: 'Analysis unavailable.', insights: [], why: 'Service error.', topic: 'Uncategorized' };
    }

    async analyzeTrending(articleTitles: string[]): Promise<string[]> {
        if (this.provider === 'groq' && this.groq) {
            try {
                const completion = await this.groq.chat.completions.create({
                    messages: [{
                        role: 'user',
                        content: `Based on these recent news headlines, identify the top 7 trending topics/themes right now. Be specific and concise (2-3 words each).

Headlines:
${articleTitles.slice(0, 30).map((t, i) => `${i + 1}. ${t}`).join('\n')}

Respond with JSON: {"trends": ["trend1", "trend2", ...]}`
                    }],
                    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                    response_format: { type: 'json_object' },
                });
                const content = completion.choices[0]?.message?.content;
                if (content) {
                    const parsed = JSON.parse(content);
                    return parsed.trends || [];
                }
            } catch (error) {
                console.error('Trending analysis error:', error);
            }
        }
        return ["Agentic AI", "Rust for Web", "Climate Tech", "Edge AI", "Small LMs", "Zero Trust", "CRISPR"];
    }

    async analyzeInsights(articleTitles: string[], articleTopics: string[]): Promise<{
        topTrend: { name: string; count: number };
        mostReadTopic: { name: string; percentage: number };
        emerging: { name: string; growth: string };
    }> {
        if (this.provider === 'groq' && this.groq) {
            try {
                const topicCounts: Record<string, number> = {};
                articleTopics.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
                const totalArticles = articleTopics.length || 1;

                const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
                const topTopic = sortedTopics[0] || ['Unknown', 0];

                const completion = await this.groq.chat.completions.create({
                    messages: [{
                        role: 'user',
                        content: `From these news headlines, identify the single most emerging/rising niche trend (not a broad topic).

Headlines:
${articleTitles.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}

Respond with JSON: {"emergingTrend": "specific trend name", "growth": "estimated growth like +150%"}`
                    }],
                    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                    response_format: { type: 'json_object' },
                });
                const content = completion.choices[0]?.message?.content;
                const emerging = content ? JSON.parse(content) : { emergingTrend: 'Edge AI', growth: '+100%' };

                return {
                    topTrend: { name: articleTitles[0]?.split(' ').slice(0, 4).join(' ') || 'AI Developments', count: Math.min(articleTitles.length, 5) },
                    mostReadTopic: { name: topTopic[0], percentage: Math.round((topTopic[1] as number / totalArticles) * 100) },
                    emerging: { name: emerging.emergingTrend || 'Edge Computing', growth: emerging.growth || '+100%' }
                };
            } catch (error) {
                console.error('Insights analysis error:', error);
            }
        }
        return {
            topTrend: { name: 'Small Language Models', count: 4 },
            mostReadTopic: { name: 'AI & Machine Learning', percentage: 38 },
            emerging: { name: 'Edge AI Computing', growth: '+240%' }
        };
    }
}

export const aiService = new AiService();
