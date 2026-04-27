import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { aiService, AiExecutionOptions } from '../services/ai';
import { decryptText } from '../services/crypto';

const prisma = new PrismaClient();

const timeoutSchema = z.union([z.literal(0), z.literal(10), z.literal(30), z.literal(60), z.literal(120)]).optional();

export async function aiRoutes(server: FastifyInstance) {

    const getRuntimeContext = async (userId: string) => {
        const preference = await prisma.userAiPreference.findUnique({
            where: { userId },
            include: { activeCredential: true },
        });

        const byokEnabled = Boolean(preference?.byokEnabled);
        const activeCredential = preference?.activeCredential;
        const hasVerifiedCredential = Boolean(activeCredential?.isVerified);

        const timeoutOptions = {
            timeoutMs: preference?.timeoutDisabled ? undefined : (preference?.timeoutSeconds || 30) * 1000,
            disableTimeout: preference?.timeoutDisabled || false,
        };

        if (!byokEnabled || !activeCredential || !hasVerifiedCredential) {
            return {
                byokEnabled,
                hasVerifiedCredential,
                timeoutOptions,
                aiOptions: {
                    provider: 'hybrid',
                    ...timeoutOptions,
                } as AiExecutionOptions,
            };
        }

        return {
            byokEnabled,
            hasVerifiedCredential,
            timeoutOptions,
            aiOptions: {
                provider: activeCredential.provider,
                model: activeCredential.model,
                baseUrl: activeCredential.baseUrl || undefined,
                apiKey: decryptText(activeCredential.encryptedApiKey),
                ...timeoutOptions,
            } as AiExecutionOptions,
        };
    };

    server.post('/chat', { preHandler: requireAuth }, async (request, reply) => {
        const schema = z.object({
            message: z.string().min(1),
            sessionTimeoutSeconds: timeoutSchema,
        });

        const parsed = schema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.message });
        }

        const userId = (request as any).userId as string;
        const runtime = await getRuntimeContext(userId);

        const timeoutValue = parsed.data.sessionTimeoutSeconds;
        const sessionWantsNoLimit = timeoutValue === 0;
        const canUseCustomTimer = runtime.byokEnabled && runtime.hasVerifiedCredential;

        const effectiveOptions: AiExecutionOptions = {
            ...runtime.aiOptions,
            timeoutMs: canUseCustomTimer
                ? (timeoutValue && timeoutValue > 0 ? timeoutValue * 1000 : runtime.timeoutOptions.timeoutMs)
                : 30000,
            disableTimeout: canUseCustomTimer ? sessionWantsNoLimit || runtime.timeoutOptions.disableTimeout : false,
        };

        try {
            const replyText = await aiService.chatStrict(parsed.data.message, effectiveOptions);
            return {
                reply: replyText,
                usedSystemFallback: false,
                timerUnlocked: canUseCustomTimer,
            };
        } catch (customError: any) {
            const triedCustom = runtime.byokEnabled && runtime.hasVerifiedCredential;
            if (!triedCustom) {
                return reply.status(500).send({ error: customError?.message || 'Chat failed.' });
            }

            try {
                const fallbackReply = await aiService.chatStrict(parsed.data.message, {
                    provider: 'hybrid',
                    timeoutMs: 30000,
                    disableTimeout: false,
                });

                return {
                    reply: fallbackReply,
                    usedSystemFallback: true,
                    fallbackMessage: 'Your API key failed - used system key for this request.',
                    timerUnlocked: canUseCustomTimer,
                };
            } catch (fallbackError: any) {
                return reply.status(500).send({ error: fallbackError?.message || 'Chat failed.' });
            }
        }
    });

    server.post('/summarize', { preHandler: requireAuth }, async (request, reply) => {
        const schema = z.object({
            text: z.string().min(1),
            sessionTimeoutSeconds: timeoutSchema,
        });

        const parsed = schema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.message });
        }

        const userId = (request as any).userId as string;
        const runtime = await getRuntimeContext(userId);

        const timeoutValue = parsed.data.sessionTimeoutSeconds;
        const sessionWantsNoLimit = timeoutValue === 0;
        const canUseCustomTimer = runtime.byokEnabled && runtime.hasVerifiedCredential;

        const effectiveOptions: AiExecutionOptions = {
            ...runtime.aiOptions,
            timeoutMs: canUseCustomTimer
                ? (timeoutValue && timeoutValue > 0 ? timeoutValue * 1000 : runtime.timeoutOptions.timeoutMs)
                : 30000,
            disableTimeout: canUseCustomTimer ? sessionWantsNoLimit || runtime.timeoutOptions.disableTimeout : false,
        };

        try {
            const result = await aiService.summarizeStrict(parsed.data.text, effectiveOptions);
            return { ...result, usedSystemFallback: false, timerUnlocked: canUseCustomTimer };
        } catch (customError: any) {
            const triedCustom = runtime.byokEnabled && runtime.hasVerifiedCredential;
            if (!triedCustom) {
                return reply.status(500).send({ error: customError?.message || 'Summarization failed.' });
            }

            try {
                const result = await aiService.summarizeStrict(parsed.data.text, {
                    provider: 'hybrid',
                    timeoutMs: 30000,
                    disableTimeout: false,
                });
                return {
                    ...result,
                    usedSystemFallback: true,
                    fallbackMessage: 'Your API key failed - used system key for this request.',
                    timerUnlocked: canUseCustomTimer,
                };
            } catch (fallbackError: any) {
                return reply.status(500).send({ error: fallbackError?.message || 'Summarization failed.' });
            }
        }
    });
}
