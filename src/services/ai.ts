import { api } from '../lib/api';

export interface ChatOptions {
    sessionTimeoutSeconds?: 0 | 10 | 30 | 60 | 120;
}

export interface ChatResponse {
    reply: string;
    usedSystemFallback?: boolean;
    fallbackMessage?: string;
    timerUnlocked?: boolean;
}

export const chatWithAI = async (message: string, options?: ChatOptions): Promise<ChatResponse> => {
    try {
        const { data } = await api.post('/ai/chat', { message, ...options });
        return data as ChatResponse;
    } catch (error) {
        console.error('AI Chat Error:', error);
        return { reply: "I'm having trouble connecting to my AI brain right now. Please try again later." };
    }
};
