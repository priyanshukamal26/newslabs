import { FastifyInstance } from 'fastify';
// import { aiService } from '../services/ai';
import { z } from 'zod';

// =============================================================================
// AI ROUTES - COMMENTED OUT (temporarily disabled to conserve Groq API limits)
//
// These endpoints call the Groq API for chat and summarization.
// They were disabled because the daily API rate limit was being exceeded.
//
// To re-enable:
//   1. Uncomment the aiService import above
//   2. Uncomment the route handlers below
//   3. The frontend AIChat component also needs to be re-enabled in DashboardPage.tsx
// =============================================================================

export async function aiRoutes(server: FastifyInstance) {

    // =========================================================================
    // CHAT ENDPOINT - COMMENTED OUT (Groq API limit)
    // =========================================================================
    // server.post('/chat', async (request, reply) => {
    //     const schema = z.object({
    //         message: z.string(),
    //     });
    //
    //     const result = schema.safeParse(request.body);
    //     if (!result.success) {
    //         return reply.status(400).send({ error: result.error });
    //     }
    //
    //     const { message } = result.data;
    //     const response = await aiService.chat(message);
    //     return { reply: response };
    // });

    // Return a friendly message if someone tries to use the chat
    server.post('/chat', async (request, reply) => {
        return { reply: '🚧 AI Chat is temporarily disabled to conserve API limits. It will be back soon!' };
    });

    // =========================================================================
    // SUMMARIZE ENDPOINT - COMMENTED OUT (Groq API limit)
    // =========================================================================
    // server.post('/summarize', async (request, reply) => {
    //     const schema = z.object({
    //         text: z.string(),
    //     });
    //
    //     const result = schema.safeParse(request.body);
    //     if (!result.success) {
    //         return reply.status(400).send({ error: result.error });
    //     }
    //
    //     const { text } = result.data;
    //     const summary = await aiService.summarize(text);
    //     return summary;
    // });

    server.post('/summarize', async (request, reply) => {
        return { summary: 'AI summarization is temporarily disabled.', insights: [], why: 'API limits reached.', topic: 'N/A' };
    });
}
