import ollama from 'ollama';
import Groq from 'groq-sdk';

export class AiService {
    private model = process.env.AI_MODEL || 'llama3';
    private provider = process.env.AI_PROVIDER || 'local';
    private groq: Groq | null = null;

    constructor() {
        try {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });
        } catch (e) {
            console.warn("Groq SDK initialization failed.");
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

    async summarize(text: string): Promise<{ summary: string; insights: string[]; why: string; topic: string }> {
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

        try {
            if (this.provider === 'groq') {
                if (!this.groq) return { summary: 'Groq API Key missing', insights: [], why: 'Config error', topic: 'Config' };

                const completion = await this.groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                    response_format: { type: 'json_object' },
                    max_tokens: 800,
                });
                const content = completion.choices[0]?.message?.content;
                return content ? JSON.parse(content) : { summary: 'Error', insights: [], why: 'No content', topic: 'Unknown' };
            }

            const response = await ollama.chat({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                format: 'json',
            });

            const content = response.message.content;
            return JSON.parse(content);
        } catch (error) {
            console.error('AI Processing Error:', error);
            return {
                summary: 'Error generating summary.',
                insights: [],
                why: 'Analysis failed.',
                topic: 'Uncategorized'
            };
        }
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
