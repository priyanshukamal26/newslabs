/**
 * scheduler.service.ts
 * Cron-driven scheduler that fires news notifications at the 4 IST slots.
 *
 * IST = UTC+5:30. Converting IST times to UTC for cron:
 *   06:00 IST = 00:30 UTC   (morning)
 *   14:00 IST = 08:30 UTC   (noon)
 *   18:00 IST = 12:30 UTC   (evening)
 *   22:00 IST = 16:30 UTC   (night)
 *   05:30 IST = 00:00 UTC   (cleanup — daily purge)
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { store } from './store';
import {
    sendTelegram, sendDiscord,
    formatTelegramMessage,
    ArticlePayload, NotificationSlot,
} from './notifier.service';

const prisma = new PrismaClient();

// ── Slot configuration ────────────────────────────────────────────────────────

const SLOTS: Record<NotificationSlot, { cronUtc: string; label: string }> = {
    morning: { cronUtc: '30 0 * * *',  label: 'Morning Brief — 6:00 AM IST' },
    noon:    { cronUtc: '30 8 * * *',  label: 'Noon Brief — 2:00 PM IST'    },
    evening: { cronUtc: '30 12 * * *', label: 'Evening Brief — 6:00 PM IST' },
    night:   { cronUtc: '30 16 * * *', label: 'Night Brief — 10:00 PM IST'  },
    instant: { cronUtc: '',            label: '⚡ Instant Brief'             }, // triggered manually, no cron
};

// ── Article selection ─────────────────────────────────────────────────────────

function recencyScore(pubDate?: string): number {
    if (!pubDate) return 0;
    const ts = new Date(pubDate).getTime();
    if (isNaN(ts)) return 0;
    const hoursAgo = (Date.now() - ts) / (1000 * 60 * 60);
    if (hoursAgo > 24) return 0;
    return Math.max(0, 1 - hoursAgo / 24); // 1 = just published, 0 = 24h old
}

async function selectArticles(userId: string): Promise<{ articles: ArticlePayload[]; reason: string }> {
    // Get user topics
    let userTopics: string[] = [];
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { topics: true } });
        if (user?.topics) userTopics = JSON.parse(user.topics);
    } catch { /* use empty */ }

    const allArticles = store.getArticles();

    // Filter to articles within the last 24 hours
    const recent = allArticles.filter(a => {
        if (!a.pubDate) return false;
        const ts = new Date(a.pubDate).getTime();
        if (isNaN(ts)) return false;
        return Date.now() - ts < 24 * 60 * 60 * 1000;
    });

    const pool = recent.length >= 10 ? recent : allArticles;

    // Score each article
    const scored = pool.map(a => {
        const reliability = (a.reliability || 50) / 100;
        const topicMatch = userTopics.length > 0 && userTopics.some(t => {
            const topicLower = t.toLowerCase();
            return (a.topic || '').toLowerCase().includes(topicLower) ||
                   (a.primaryCategory || '').toLowerCase().includes(topicLower);
        }) ? 1 : 0;
        const recency = recencyScore(a.pubDate);
        const score = reliability * 0.5 + topicMatch * 0.4 + recency * 0.1;
        return { article: a, score };
    });

    // Sort by score desc
    scored.sort((a, b) => b.score - a.score);

    // Deduplicate: max 2 from same source
    const sourceCounts: Record<string, number> = {};
    const selected: ArticlePayload[] = [];
    for (const { article } of scored) {
        if (selected.length >= 10) break;
        const src = article.source || 'unknown';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        if (sourceCounts[src] > 2) continue;
        selected.push({
            id: article.id,
            title: article.title || 'Untitled',
            link: article.link || '',
            source: article.source || 'Unknown',
            topic: article.topic || 'News',
        });
    }

    const topicsLabel = userTopics.length > 0 ? userTopics.join(', ') : 'all topics';
    const windowLabel = recent.length >= 10 ? '24h window' : 'full archive (insufficient 24h articles)';
    const reason = `Ranked by reliability (50%) + topic match (40%) + recency (10%). User topics: ${topicsLabel}. Source pool: ${pool.length} articles (${windowLabel}). Selected top ${selected.length}.`;

    return { articles: selected, reason };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

async function runSlot(slot: NotificationSlot): Promise<void> {
    const { label } = SLOTS[slot];
    console.log(`[scheduler] Running slot: ${slot} (${label})`);

    // Find all users with this slot enabled AND at least one platform connected
    const settings = await prisma.userNotificationSettings.findMany({
        where: {
            OR: [
                { telegramEnabled: true, telegramChatId: { not: null } },
                { discordEnabled: true, discordWebhookUrl: { not: null } },
            ],
        },
    });

    const eligible = settings.filter(s => {
        try {
            const slots: string[] = JSON.parse(s.activeSlots);
            return slots.includes(slot);
        } catch {
            return false;
        }
    });

    console.log(`[scheduler] ${eligible.length} users eligible for slot ${slot}`);

    for (const setting of eligible) {
        try {
            const { articles, reason } = await selectArticles(setting.userId);

            if (articles.length === 0) {
                console.log(`[scheduler] No articles for user ${setting.userId}, skipping`);
                continue;
            }

            const telegramText = formatTelegramMessage(articles, slot);

            // Dispatch Telegram
            if (setting.telegramEnabled && setting.telegramChatId) {
                let success = false;
                let errorMessage: string | undefined;
                try {
                    await sendTelegram(setting.telegramChatId, telegramText);
                    success = true;
                } catch (err: any) {
                    errorMessage = err.message;
                    console.error(`[scheduler] Telegram failed for user ${setting.userId}:`, err.message);
                }

                await prisma.notificationLog.create({
                    data: {
                        settingsId: setting.id,
                        userId: setting.userId,
                        platform: 'telegram',
                        slot,
                        slotLabel: label,
                        articleIds: JSON.stringify(articles.map(a => a.id)),
                        articleTitles: JSON.stringify(articles.map(a => a.title)),
                        articleLinks: JSON.stringify(articles.map(a => a.link)),
                        articleSources: JSON.stringify(articles.map(a => a.source)),
                        articleTopics: JSON.stringify(articles.map(a => a.topic)),
                        selectionReason: reason,
                        success,
                        errorMessage: errorMessage || null,
                    },
                });
            }

            // Dispatch Discord
            if (setting.discordEnabled && setting.discordWebhookUrl) {
                let success = false;
                let errorMessage: string | undefined;
                try {
                    await sendDiscord(setting.discordWebhookUrl, articles, slot);
                    success = true;
                } catch (err: any) {
                    errorMessage = err.message;
                    console.error(`[scheduler] Discord failed for user ${setting.userId}:`, err.message);
                }

                await prisma.notificationLog.create({
                    data: {
                        settingsId: setting.id,
                        userId: setting.userId,
                        platform: 'discord',
                        slot,
                        slotLabel: label,
                        articleIds: JSON.stringify(articles.map(a => a.id)),
                        articleTitles: JSON.stringify(articles.map(a => a.title)),
                        articleLinks: JSON.stringify(articles.map(a => a.link)),
                        articleSources: JSON.stringify(articles.map(a => a.source)),
                        articleTopics: JSON.stringify(articles.map(a => a.topic)),
                        selectionReason: reason,
                        success,
                        errorMessage: errorMessage || null,
                    },
                });
            }
        } catch (err: any) {
            console.error(`[scheduler] Error processing user ${setting.userId}:`, err.message);
        }
    }

    console.log(`[scheduler] Slot ${slot} complete.`);
}

// ── Daily cleanup ─────────────────────────────────────────────────────────────

async function purgeOldLogs(): Promise<void> {
    // Delete all logs from before today 00:00 IST
    // IST = UTC+5:30, so start of today IST = yesterday 18:30 UTC
    const now = new Date();
    const startOfTodayIST = new Date(now);
    startOfTodayIST.setUTCHours(18, 30, 0, 0); // 18:30 UTC = 00:00 IST next day
    if (now.getUTCHours() >= 18 && now.getUTCMinutes() >= 30) {
        // already past 00:00 IST today — purge anything before today 18:30 UTC
    } else {
        // before 00:00 IST today — purge anything before yesterday 18:30 UTC
        startOfTodayIST.setUTCDate(startOfTodayIST.getUTCDate() - 1);
    }

    try {
        const result = await prisma.notificationLog.deleteMany({
            where: { sentAt: { lt: startOfTodayIST } },
        });
        console.log(`[scheduler] Purged ${result.count} old notification log rows.`);
    } catch (err: any) {
        console.error('[scheduler] Log purge failed:', err.message);
    }
}

// ── Test dispatch (for the /api/notifications/test endpoint) ──────────────────

export async function testDispatch(userId: string, platform: 'telegram' | 'discord' | 'both'): Promise<{ telegram?: string; discord?: string }> {
    // Upsert: auto-create settings row if it doesn't exist yet
    const setting = await prisma.userNotificationSettings.upsert({
        where: { userId },
        create: { userId, activeSlots: '[]' },
        update: {},
    });

    const { articles, reason } = await selectArticles(userId);
    if (articles.length === 0) throw new Error('No articles available yet. Please wait for the feed to load and try again.');

    const result: { telegram?: string; discord?: string } = {};
    const slot: NotificationSlot = 'instant';
    const telegramText = formatTelegramMessage(articles, slot);

    if ((platform === 'telegram' || platform === 'both') && setting.telegramChatId && setting.telegramEnabled) {
        await sendTelegram(setting.telegramChatId, telegramText);
        result.telegram = 'sent';

        await prisma.notificationLog.create({
            data: {
                settingsId: setting.id,
                userId,
                platform: 'telegram',
                slot: 'instant',
                slotLabel: '⚡ Instant Brief',
                articleIds: JSON.stringify(articles.map(a => a.id)),
                articleTitles: JSON.stringify(articles.map(a => a.title)),
                articleLinks: JSON.stringify(articles.map(a => a.link)),
                articleSources: JSON.stringify(articles.map(a => a.source)),
                articleTopics: JSON.stringify(articles.map(a => a.topic)),
                selectionReason: `[INSTANT] ${reason}`,
                success: true,
            },
        });
    }

    if ((platform === 'discord' || platform === 'both') && setting.discordWebhookUrl && setting.discordEnabled) {
        await sendDiscord(setting.discordWebhookUrl, articles, slot);
        result.discord = 'sent';

        await prisma.notificationLog.create({
            data: {
                settingsId: setting.id,
                userId,
                platform: 'discord',
                slot: 'instant',
                slotLabel: '⚡ Instant Brief',
                articleIds: JSON.stringify(articles.map(a => a.id)),
                articleTitles: JSON.stringify(articles.map(a => a.title)),
                articleLinks: JSON.stringify(articles.map(a => a.link)),
                articleSources: JSON.stringify(articles.map(a => a.source)),
                articleTopics: JSON.stringify(articles.map(a => a.topic)),
                selectionReason: `[INSTANT] ${reason}`,
                success: true,
            },
        });
    }

    // If no platform sent anything, give a clear error
    if (!result.telegram && !result.discord) {
        throw new Error('No connected platforms found. Please connect Telegram or Discord in your profile settings first.');
    }

    return result;
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initScheduler(): void {
    console.log('[scheduler] Initializing cron jobs (IST timezone slots)...');

    // Morning: 06:00 IST = 00:30 UTC
    cron.schedule('30 0 * * *', () => runSlot('morning'), { timezone: 'UTC' });

    // Noon: 14:00 IST = 08:30 UTC
    cron.schedule('30 8 * * *', () => runSlot('noon'), { timezone: 'UTC' });

    // Evening: 18:00 IST = 12:30 UTC
    cron.schedule('30 12 * * *', () => runSlot('evening'), { timezone: 'UTC' });

    // Night: 22:00 IST = 16:30 UTC
    cron.schedule('30 16 * * *', () => runSlot('night'), { timezone: 'UTC' });

    // Cleanup: 05:30 IST = 00:00 UTC
    cron.schedule('0 0 * * *', () => purgeOldLogs(), { timezone: 'UTC' });

    console.log('[scheduler] 5 cron jobs registered (4 delivery slots + 1 cleanup at 5:30 AM IST).');
}
