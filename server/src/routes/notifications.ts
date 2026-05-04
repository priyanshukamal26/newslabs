/**
 * notifications.ts  (route handler)
 * All bot notification settings, Telegram setup, Discord setup, and audit log access.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { generateConnectToken, resolveToken, getBotUsername } from '../services/telegram.setup';
import { validateDiscordWebhook } from '../services/notifier.service';
import { testDispatch } from '../services/scheduler.service';
import { sendTelegram } from '../services/notifier.service';

const VALID_SLOTS = ['morning', 'noon', 'evening', 'night'] as const;
type SlotKey = typeof VALID_SLOTS[number];

// ── Ensure settings row exists for user ───────────────────────────────────────

async function ensureNotificationSettings(userId: string) {
    return prisma.userNotificationSettings.upsert({
        where: { userId },
        update: {},
        create: {
            userId,
            telegramEnabled: false,
            discordEnabled: false,
            activeSlots: '[]',
        },
    });
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function notificationRoutes(server: FastifyInstance) {

    // GET /api/notifications/bot-settings
    server.get('/bot-settings', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const settings = await ensureNotificationSettings(userId);

        let activeSlots: string[] = [];
        try { activeSlots = JSON.parse(settings.activeSlots); } catch { }

        return {
            telegramEnabled: settings.telegramEnabled,
            telegramConnected: !!settings.telegramChatId,
            telegramChatIdMask: settings.telegramChatId ? `...${settings.telegramChatId.slice(-4)}` : null,
            discordEnabled: settings.discordEnabled,
            discordConnected: !!settings.discordWebhookUrl,
            discordWebhookMask: settings.discordWebhookUrl
                ? settings.discordWebhookUrl.replace(/\/[^/]+$/, '/***')
                : null,
            activeSlots,
        };
    });

    // PUT /api/notifications/bot-settings
    server.put('/bot-settings', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({
            telegramEnabled: z.boolean().optional(),
            discordEnabled: z.boolean().optional(),
            activeSlots: z.array(z.enum(VALID_SLOTS)).max(4).optional(),
        });
        const payload = schema.parse(request.body);

        await ensureNotificationSettings(userId);

        const updateData: any = {};
        if (payload.telegramEnabled !== undefined) updateData.telegramEnabled = payload.telegramEnabled;
        if (payload.discordEnabled !== undefined) updateData.discordEnabled = payload.discordEnabled;
        if (payload.activeSlots !== undefined) updateData.activeSlots = JSON.stringify(payload.activeSlots);

        const updated = await prisma.userNotificationSettings.update({
            where: { userId },
            data: updateData,
        });

        let activeSlots: string[] = [];
        try { activeSlots = JSON.parse(updated.activeSlots); } catch { }

        return { success: true, activeSlots };
    });

    // POST /api/notifications/telegram/connect — generate deep link
    server.post('/telegram/connect', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { v4: uuidv4 } = require('uuid');
        const token = uuidv4().replace(/-/g, '').slice(0, 20);
        const botUsername = getBotUsername();
        const deepLink = `https://t.me/${botUsername}?start=${token}`;

        await ensureNotificationSettings(userId);
        await prisma.userNotificationSettings.update({
            where: { userId },
            data: {
                telegramConnectToken: token,
                telegramConnectExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
        });

        return { deepLink, token, expiresInMs: 10 * 60 * 1000 };
    });

    // POST /api/notifications/telegram/status — poll for connection (frontend polls this)
    server.get('/telegram/status', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const settings = await prisma.userNotificationSettings.findUnique({ where: { userId } });
        return {
            connected: !!(settings?.telegramChatId),
            enabled: settings?.telegramEnabled || false,
        };
    });

    // DELETE /api/notifications/telegram/disconnect
    server.delete('/telegram/disconnect', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await ensureNotificationSettings(userId);
        await prisma.userNotificationSettings.update({
            where: { userId },
            data: { telegramChatId: null, telegramEnabled: false },
        });
        return { success: true };
    });

    // POST /api/notifications/discord/connect — validate webhook URL and save
    server.post('/discord/connect', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({ webhookUrl: z.string().url().startsWith('https://discord.com/api/webhooks/') });

        let payload: { webhookUrl: string };
        try {
            payload = schema.parse(request.body);
        } catch {
            return reply.status(400).send({ error: 'Invalid Discord webhook URL. It must start with https://discord.com/api/webhooks/' });
        }

        const validation = await validateDiscordWebhook(payload.webhookUrl);
        if (!validation.ok) {
            return reply.status(400).send({ error: validation.message });
        }

        await ensureNotificationSettings(userId);
        await prisma.userNotificationSettings.update({
            where: { userId },
            data: { discordWebhookUrl: payload.webhookUrl, discordEnabled: true },
        });

        return { success: true, message: validation.message };
    });

    // DELETE /api/notifications/discord/disconnect
    server.delete('/discord/disconnect', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await ensureNotificationSettings(userId);
        await prisma.userNotificationSettings.update({
            where: { userId },
            data: { discordWebhookUrl: null, discordEnabled: false },
        });
        return { success: true };
    });

    // POST /api/notifications/telegram/webhook — receive Telegram bot updates (NO auth)
    server.post('/telegram/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = request.body as any;
            const message = body?.message;
            if (!message) return reply.status(200).send({ ok: true });

            const chatId = String(message.chat?.id);
            const text: string = message.text || '';

            // Handle /start <token>
            if (text.startsWith('/start')) {
                const parts = text.split(' ');
                const token = parts[1]?.trim();

                if (token) {
                    const settings = await prisma.userNotificationSettings.findUnique({
                        where: { telegramConnectToken: token }
                    });

                    if (settings && settings.telegramConnectExpiresAt && settings.telegramConnectExpiresAt > new Date()) {
                        const userId = settings.userId;
                        const telegramUserId = String(message.from?.id || '');

                        // Save chatId and mark Telegram as connected + enabled
                        await prisma.userNotificationSettings.update({
                            where: { userId },
                            data: { 
                                telegramChatId: chatId, 
                                telegramUserId: telegramUserId || null,
                                telegramEnabled: true,
                                telegramConnectToken: null, // Clear token
                                telegramConnectExpiresAt: null
                            },
                        });

                        // Send welcome message
                        const token2 = process.env.TELEGRAM_BOT_TOKEN;
                        if (token2) {
                            const welcomeText =
                                '✅ *NewsLabs connected successfully\\!*\n\n' +
                                'You will receive your personalized news briefs at the times you selected\\.\n\n' +
                                '📖 [Open Dashboard](https://newslabs\\.vercel\\.app/dashboard)';
                            await sendTelegram(chatId, welcomeText).catch(() => {});
                        }

                        console.log(`[telegram-webhook] User ${userId} connected chat ${chatId}`);
                    } else {
                        // Token expired or invalid — send helpful message
                        const token2 = process.env.TELEGRAM_BOT_TOKEN;
                        if (token2) {
                            const expiredText = '⚠️ This link has expired\\. Please go back to NewsLabs and click *Connect Telegram* again\\.';
                            await sendTelegram(chatId, expiredText).catch(() => {});
                        }
                    }
                } else {
                    // /start without token — send generic welcome
                    const token2 = process.env.TELEGRAM_BOT_TOKEN;
                    if (token2) {
                        const genericText =
                            `Hello\\! I'm the *NewsLabs Bot*\\.\n\n` +
                            `To connect me to your account, go to your NewsLabs profile settings and click *Connect Telegram*\\.`;
                        await sendTelegram(chatId, genericText).catch(() => {});
                    }
                }
            }

            return reply.status(200).send({ ok: true });
        } catch (err: any) {
            console.error('[telegram-webhook] Error:', err.message);
            return reply.status(200).send({ ok: true }); // always 200 to Telegram
        }
    });

    // GET /api/notifications/logs — returns last 3 days (72 hours) of briefs
    server.get('/logs', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;

        // Fetch logs from the last 72 hours
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        const logs = await prisma.notificationLog.findMany({
            where: {
                userId,
                sentAt: { gte: threeDaysAgo },
            },
            orderBy: { sentAt: 'desc' },
        });

        // Parse JSON fields
        const parsed = logs.map(log => ({
            id: log.id,
            platform: log.platform,
            slot: log.slot,
            slotLabel: log.slotLabel,
            sentAt: log.sentAt,
            articleIds: JSON.parse(log.articleIds || '[]'),
            articleTitles: JSON.parse(log.articleTitles),
            articleLinks: JSON.parse(log.articleLinks),
            articleSources: JSON.parse(log.articleSources),
            articleTopics: JSON.parse(log.articleTopics),
            selectionReason: log.selectionReason,
            success: log.success,
            errorMessage: log.errorMessage,
        }));

        // Group scheduled slots by slot key AND date (to support 3 days of data)
        const grouped: Record<string, any> = {};

        for (const log of parsed) {
            // Grouping key: scheduled slots are grouped by slot + date; instant briefs are always unique
            const dateKey = new Date(log.sentAt).toISOString().split('T')[0];
            const key = log.slot === 'instant' ? `instant_${log.id}` : `${log.slot}_${dateKey}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    slot: log.slot,
                    slotLabel: log.slotLabel,
                    sentAt: log.sentAt,
                    articleIds: log.articleIds,
                    articleTitles: log.articleTitles,
                    articleLinks: log.articleLinks,
                    articleSources: log.articleSources,
                    articleTopics: log.articleTopics,
                    selectionReason: log.selectionReason,
                    platforms: [],
                };
            }
            grouped[key].platforms.push({
                platform: log.platform,
                success: log.success,
                errorMessage: log.errorMessage,
            });
        }

        // Return all grouped logs sorted by sentAt desc
        const sortedLogs = Object.values(grouped).sort((a, b) => 
            new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );

        return { logs: sortedLogs };
    });

    // POST /api/notifications/test — fire a test delivery right now
    server.post('/test', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({
            platform: z.enum(['telegram', 'discord', 'both']).default('both'),
        });
        const { platform } = schema.parse(request.body || {});

        try {
            const result = await testDispatch(userId, platform);
            return { success: true, ...result };
        } catch (err: any) {
            console.error('[testDispatch error]', err);
            return reply.status(400).send({ error: err.message || "Unknown error" });
        }
    });
}
