import { api } from '../lib/api';

export const chatWithAI = async (message: string): Promise<string> => {
    try {
        const { data } = await api.post('/ai/chat', { message });
        return data.reply;
    } catch (error) {
        console.error('AI Chat Error:', error);
        return "I'm having trouble connecting to my AI brain right now. Please try again later.";
    }
};
