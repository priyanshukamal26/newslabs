import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { parseStringPromise } from 'xml2js';
import { requireAuth } from '../middleware/auth';
import { store, SYSTEM_FEEDS } from '../services/store';
import { rssService } from '../services/rss';
import { aiService } from '../services/ai';
import { encryptText, maskKey } from '../services/crypto';

const prisma = new PrismaClient();

export async function userRoutes(server: FastifyInstance) {

    // Update login streak on any authenticated request
    const updateLoginStreak = async (userId: string) => {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        if (user.lastLoginDate === today) return; // Already updated today

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = user.lastStreakDate === yesterday || user.lastStreakDate === today;
        const newStreak = isConsecutive ? user.currentStreak + 1 : 1;

        await prisma.user.update({
            where: { id: userId },
            data: {
                lastLoginDate: today,
                lastStreakDate: today,
                loginDays: user.loginDays + 1,
                currentStreak: newStreak,
                longestStreak: Math.max(user.longestStreak, newStreak),
            }
        });
    };

    const ensureUserFeedsInitialized = async (userId: string) => {
        const count = await prisma.userFeed.count({ where: { userId } });
        if (count > 0) return;

        await prisma.userFeed.createMany({
            data: SYSTEM_FEEDS.map(feed => ({
                userId,
                url: feed.url,
                displayName: feed.name,
                category: feed.category,
                reliability: feed.reliability,
                isActive: true,
            })),
            skipDuplicates: true,
        });
    };

    const ensureUserAiPreference = async (userId: string) => {
        await prisma.userAiPreference.upsert({
            where: { userId },
            update: {},
            create: {
                userId,
                byokEnabled: false,
                timeoutSeconds: 30,
                timeoutDisabled: false,
            },
        });
    };

    // Get profile
    server.get('/profile', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await updateLoginStreak(userId);
        await ensureUserFeedsInitialized(userId);
        await ensureUserAiPreference(userId);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, phone: true, darkMode: true,
                aiProvider: true, summaryMode: true,
                topics: true, createdAt: true, totalReads: true, totalReadTime: true,
                loginDays: true, currentStreak: true, longestStreak: true,
            }
        });
        if (!user) return reply.status(404).send({ error: 'User not found' });

        let topics: string[] = [];
        try { topics = JSON.parse(user.topics); } catch { topics = []; }

        return { ...user, topics };
    });

    // Update profile
    server.put('/profile', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({
            name: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().email().optional(),
            darkMode: z.boolean().optional(),
            aiProvider: z.enum(['groq', 'gemini', 'hybrid']).optional(),
            summaryMode: z.enum(['concise', 'balanced', 'detailed']).optional(),
        });

        const data = schema.parse(request.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, email: true, name: true, phone: true, darkMode: true, topics: true, aiProvider: true, summaryMode: true }
        });

        let topics: string[] = [];
        try { topics = JSON.parse(user.topics); } catch { topics = []; }

        return { ...user, topics };
    });

    // Change password
    server.put('/password', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({
            currentPassword: z.string(),
            newPassword: z.string().min(6),
        });

        const { currentPassword, newPassword } = schema.parse(request.body);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return reply.status(404).send({ error: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return reply.status(400).send({ error: 'Current password is incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

        return { message: 'Password updated successfully' };
    });

    // Get user stats
    server.get('/stats', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await updateLoginStreak(userId);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return reply.status(404).send({ error: 'User not found' });

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const lastWeekStart = new Date(startOfWeek);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const [savedCount, likedCount, readsThisWeek, readsLastWeek, allReads] = await Promise.all([
            prisma.savedArticle.count({ where: { userId } }),
            prisma.likedArticle.count({ where: { userId } }),
            prisma.readHistory.count({ where: { userId, readAt: { gte: startOfWeek } } }),
            prisma.readHistory.count({ where: { userId, readAt: { gte: lastWeekStart, lt: startOfWeek } } }),
            prisma.readHistory.findMany({ where: { userId }, orderBy: { readAt: 'desc' } }),
        ]);

        // Calculate avg read time: totalReadTime / loginDays
        const avgReadTime = user.loginDays > 0
            ? `${Math.max(1, Math.round(user.totalReadTime / user.loginDays))} min`
            : '0 min';

        // Weekly activity data (last 7 days)
        const weeklyData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            const count = allReads.filter((r: any) => r.readAt >= dayStart && r.readAt < dayEnd).length;
            weeklyData.push({ day: dayNames[dayStart.getDay()], count });
        }

        const changePercent = readsLastWeek > 0
            ? Math.round(((readsThisWeek - readsLastWeek) / readsLastWeek) * 100)
            : readsThisWeek > 0 ? 100 : 0;

        return {
            thisWeek: readsThisWeek,
            lastWeek: readsLastWeek,
            streak: user.currentStreak,
            longestStreak: user.longestStreak,
            totalReads: user.totalReads,
            totalSaved: savedCount,
            totalLiked: likedCount,
            avgReadTime,
            loginDays: user.loginDays,
            change: changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`,
            weeklyData,
        };
    });

    // Feed management
    server.get('/feeds', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await ensureUserFeedsInitialized(userId);

        const feeds = await prisma.userFeed.findMany({
            where: { userId },
            orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
        });
        return { feeds };
    });

    server.post('/feeds/validate', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const schema = z.object({ url: z.string().url() });
        const { url } = schema.parse(request.body);

        const previewItems = await rssService.fetchFeed(url);
        if (!previewItems.length) {
            return reply.status(400).send({ error: 'Could not parse RSS feed or feed has no items.' });
        }

        return {
            valid: true,
            feedName: previewItems[0]?.source || 'Custom Feed',
            preview: previewItems.slice(0, 3).map(item => ({
                title: item.title || 'Untitled',
                link: item.link || '',
                pubDate: item.pubDate || '',
                source: item.source || '',
            })),
        };
    });

    server.post('/feeds', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({
            url: z.string().url(),
            displayName: z.string().min(1).max(120).optional(),
            category: z.string().max(60).optional().nullable(),
            reliability: z.number().min(1).max(10).optional(),
        });
        const { url, displayName, category, reliability } = schema.parse(request.body);

        const previewItems = await rssService.fetchFeed(url);
        if (!previewItems.length) {
            return reply.status(400).send({ error: 'Could not parse RSS feed or feed has no items.' });
        }

        const feed = await prisma.userFeed.upsert({
            where: { userId_url: { userId, url } },
            update: {
                displayName: displayName || previewItems[0]?.source || 'Custom Feed',
                category: category || null,
                reliability: reliability ?? 5,
                isActive: true,
            },
            create: {
                userId,
                url,
                displayName: displayName || previewItems[0]?.source || 'Custom Feed',
                category: category || null,
                reliability: reliability ?? 5,
                isActive: true,
            },
        });

        return { feed };
    });

    server.put('/feeds/:id', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { id } = request.params as { id: string };
        const schema = z.object({
            url: z.string().url().optional(),
            displayName: z.string().min(1).max(120).optional(),
            category: z.string().max(60).nullable().optional(),
            reliability: z.number().min(1).max(10).optional(),
            isActive: z.boolean().optional(),
        });
        const payload = schema.parse(request.body);

        const feed = await prisma.userFeed.findFirst({ where: { id, userId } });
        if (!feed) return reply.status(404).send({ error: 'Feed not found.' });

        const updated = await prisma.userFeed.update({
            where: { id },
            data: payload,
        });
        return { feed: updated };
    });

    server.delete('/feeds/:id', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { id } = request.params as { id: string };
        const { dryRun } = (request.query as { dryRun?: string }) || {};

        const feed = await prisma.userFeed.findFirst({ where: { id, userId } });
        if (!feed) return reply.status(404).send({ error: 'Feed not found.' });

        const hostname = (() => {
            try { return new URL(feed.url).hostname.replace(/^www\./, ''); } catch { return ''; }
        })();

        const relatedSavedCount = hostname
            ? await prisma.savedArticle.count({
                where: { userId, link: { contains: hostname, mode: 'insensitive' } },
            })
            : 0;

        if (dryRun === 'true') {
            return { success: true, relatedSavedCount, dryRun: true };
        }

        await prisma.userFeed.delete({ where: { id } });
        return { success: true, relatedSavedCount };
    });

    server.post('/feeds/import-opml', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({ opml: z.string().min(1) });
        const { opml } = schema.parse(request.body);

        const parsed = await parseStringPromise(opml);
        const outlines = parsed?.opml?.body?.[0]?.outline || [];
        const flattened: Array<{ title: string; url: string; category: string | null }> = [];

        const walk = (nodes: any[], inheritedCategory: string | null = null) => {
            for (const node of nodes || []) {
                const attrs = node.$ || {};
                const category = attrs.text || attrs.title || inheritedCategory;
                if (attrs.xmlUrl) {
                    flattened.push({
                        title: attrs.title || attrs.text || 'Imported Feed',
                        url: attrs.xmlUrl,
                        category: inheritedCategory,
                    });
                }
                if (node.outline) {
                    walk(node.outline, category || null);
                }
            }
        };

        walk(outlines);

        if (!flattened.length) {
            return reply.status(400).send({ error: 'No RSS feeds found in OPML file.' });
        }

        await prisma.userFeed.createMany({
            data: flattened.map(feed => ({
                userId,
                url: feed.url,
                displayName: feed.title,
                category: feed.category,
                reliability: 5,
                isActive: true,
            })),
            skipDuplicates: true,
        });

        return { imported: flattened.length };
    });

    server.get('/feeds/export-opml', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const feeds = await prisma.userFeed.findMany({
            where: { userId },
            orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
        });

        const grouped = feeds.reduce((acc: Record<string, typeof feeds>, feed) => {
            const key = feed.category || 'Uncategorized';
            acc[key] = acc[key] || [];
            acc[key].push(feed);
            return acc;
        }, {});

        const categoryBlocks = Object.entries(grouped).map(([category, items]) => {
            const outlines = items
                .map(feed => `      <outline text=\"${feed.displayName}\" title=\"${feed.displayName}\" type=\"rss\" xmlUrl=\"${feed.url}\" />`)
                .join('\n');
            return `    <outline text=\"${category}\" title=\"${category}\">\n${outlines}\n    </outline>`;
        }).join('\n');

        const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<opml version=\"2.0\">\n  <head>\n    <title>NewsLabs Feeds Export</title>\n  </head>\n  <body>\n${categoryBlocks}\n  </body>\n</opml>`;

        reply.header('Content-Type', 'application/xml');
        reply.header('Content-Disposition', 'attachment; filename=\"newslabs-feeds.opml\"');
        return reply.send(xml);
    });

    // BYOK preferences and credentials
    server.get('/ai/byok', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await ensureUserAiPreference(userId);

        const [preference, credentials] = await Promise.all([
            prisma.userAiPreference.findUnique({ where: { userId } }),
            prisma.userApiCredential.findMany({
                where: { userId },
                orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
                select: {
                    id: true,
                    label: true,
                    provider: true,
                    model: true,
                    baseUrl: true,
                    apiKeyMask: true,
                    isVerified: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    lastValidatedAt: true,
                },
            }),
        ]);

        const activeCredential = credentials.find(c => c.isActive);
        const timerUnlocked = Boolean(
            preference?.byokEnabled &&
            activeCredential?.isVerified
        );

        return {
            preference: {
                byokEnabled: preference?.byokEnabled ?? false,
                timeoutSeconds: preference?.timeoutSeconds ?? 30,
                timeoutDisabled: preference?.timeoutDisabled ?? false,
                activeCredentialId: preference?.activeCredentialId ?? null,
                timerUnlocked,
            },
            credentials,
        };
    });

    server.put('/ai/byok/preference', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({
            byokEnabled: z.boolean().optional(),
            timeoutSeconds: z.union([z.literal(10), z.literal(30), z.literal(60), z.literal(120)]).optional(),
            timeoutDisabled: z.boolean().optional(),
            activeCredentialId: z.string().optional().nullable(),
        });
        const payload = schema.parse(request.body);

        await ensureUserAiPreference(userId);

        if (payload.activeCredentialId) {
            const credential = await prisma.userApiCredential.findFirst({
                where: { id: payload.activeCredentialId, userId },
            });
            if (!credential) {
                return reply.status(404).send({ error: 'Selected credential not found.' });
            }
            await prisma.userApiCredential.updateMany({
                where: { userId },
                data: { isActive: false },
            });
            await prisma.userApiCredential.update({
                where: { id: credential.id },
                data: { isActive: true },
            });
        }

        const updated = await prisma.userAiPreference.update({
            where: { userId },
            data: {
                byokEnabled: payload.byokEnabled,
                activeCredentialId: payload.activeCredentialId === undefined ? undefined : payload.activeCredentialId,
                timeoutSeconds: payload.timeoutSeconds,
                timeoutDisabled: payload.timeoutDisabled,
            },
        });

        const activeCredential = updated.activeCredentialId
            ? await prisma.userApiCredential.findFirst({ where: { id: updated.activeCredentialId, userId } })
            : null;

        const timerUnlocked = Boolean(updated.byokEnabled && activeCredential?.isVerified);
        if (!timerUnlocked && (payload.timeoutDisabled !== undefined || payload.timeoutSeconds !== undefined)) {
            await prisma.userAiPreference.update({
                where: { userId },
                data: { timeoutDisabled: false, timeoutSeconds: 30 },
            });
            updated.timeoutDisabled = false;
            updated.timeoutSeconds = 30;
        }

        return {
            byokEnabled: updated.byokEnabled,
            timeoutSeconds: updated.timeoutSeconds,
            timeoutDisabled: updated.timeoutDisabled,
            activeCredentialId: updated.activeCredentialId,
            timerUnlocked,
        };
    });

    server.post('/ai/byok/credentials/validate', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const schema = z.object({
            provider: z.string().min(2),
            model: z.string().min(1),
            apiKey: z.string().min(8),
            baseUrl: z.string().url().optional().nullable(),
        });
        const payload = schema.parse(request.body);

        const result = await aiService.validateCredential({
            provider: payload.provider,
            model: payload.model,
            apiKey: payload.apiKey,
            baseUrl: payload.baseUrl || undefined,
        });

        return result;
    });

    server.post('/ai/byok/credentials', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const schema = z.object({
            label: z.string().min(1).max(80),
            provider: z.string().min(2),
            model: z.string().min(1),
            apiKey: z.string().min(8),
            baseUrl: z.string().url().optional().nullable(),
            makeActive: z.boolean().optional(),
        });
        const payload = schema.parse(request.body);

        const validation = await aiService.validateCredential({
            provider: payload.provider,
            model: payload.model,
            apiKey: payload.apiKey,
            baseUrl: payload.baseUrl || undefined,
        });
        if (!validation.ok) {
            return reply.status(400).send({ error: validation.message });
        }

        if (payload.makeActive) {
            await prisma.userApiCredential.updateMany({
                where: { userId },
                data: { isActive: false },
            });
        }

        const created = await prisma.userApiCredential.create({
            data: {
                userId,
                label: payload.label,
                provider: payload.provider,
                model: payload.model,
                baseUrl: payload.baseUrl || null,
                encryptedApiKey: encryptText(payload.apiKey),
                apiKeyMask: maskKey(payload.apiKey),
                isVerified: true,
                lastValidatedAt: new Date(),
                isActive: payload.makeActive || false,
            },
        });

        if (payload.makeActive) {
            await ensureUserAiPreference(userId);
            await prisma.userAiPreference.update({
                where: { userId },
                data: { activeCredentialId: created.id },
            });
        }

        return {
            credential: {
                id: created.id,
                label: created.label,
                provider: created.provider,
                model: created.model,
                baseUrl: created.baseUrl,
                apiKeyMask: created.apiKeyMask,
                isVerified: created.isVerified,
                isActive: created.isActive,
            },
            message: validation.message,
        };
    });

    server.put('/ai/byok/credentials/:id/activate', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { id } = request.params as { id: string };

        const credential = await prisma.userApiCredential.findFirst({ where: { id, userId } });
        if (!credential) return reply.status(404).send({ error: 'Credential not found.' });

        await prisma.userApiCredential.updateMany({ where: { userId }, data: { isActive: false } });
        await prisma.userApiCredential.update({ where: { id }, data: { isActive: true } });
        await ensureUserAiPreference(userId);
        await prisma.userAiPreference.update({ where: { userId }, data: { activeCredentialId: id } });

        return { success: true };
    });

    server.delete('/ai/byok/credentials/:id', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { id } = request.params as { id: string };

        const credential = await prisma.userApiCredential.findFirst({ where: { id, userId } });
        if (!credential) return reply.status(404).send({ error: 'Credential not found.' });

        await prisma.userApiCredential.delete({ where: { id } });
        await ensureUserAiPreference(userId);
        const preference = await prisma.userAiPreference.findUnique({ where: { userId } });
        if (preference?.activeCredentialId === id) {
            await prisma.userAiPreference.update({
                where: { userId },
                data: { activeCredentialId: null, timeoutDisabled: false, timeoutSeconds: 30 },
            });
        }

        return { success: true };
    });

    // Like/unlike article
    server.post('/like/:articleId', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { articleId } = request.params as { articleId: string };
        const bodyData = (request.body as any) || {};

        const existing = await prisma.likedArticle.findFirst({
            where: { userId, articleId }
        });

        if (existing) {
            await prisma.likedArticle.delete({ where: { id: existing.id } });
            const article = store.getArticleById(articleId);
            if (article) store.updateArticle(articleId, { likes: Math.max(0, (article.likes || 0) - 1) });
            return { liked: false, message: 'Removed from likes' };
        } else {
            const article = store.getArticleById(articleId);
            await prisma.likedArticle.create({
                data: {
                    userId,
                    articleId,
                    title: bodyData.title || article?.title || '',
                    source: bodyData.source || article?.source || '',
                    topic: bodyData.topic || article?.topic || '',
                    link: bodyData.link || article?.link || '',
                    summary: bodyData.summary || article?.summary || '',
                    timeToRead: bodyData.timeToRead || article?.timeToRead || '',
                    pubDate: bodyData.pubDate || article?.pubDate || '',
                }
            });
            if (article) store.updateArticle(articleId, { likes: (article.likes || 0) + 1 });
            return { liked: true, message: 'Added to likes' };
        }
    });

    // Save/unsave article
    server.post('/save/:articleId', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { articleId } = request.params as { articleId: string };
        const bodyData = (request.body as any) || {};

        const existing = await prisma.savedArticle.findFirst({
            where: { userId, articleId }
        });

        if (existing) {
            await prisma.savedArticle.delete({ where: { id: existing.id } });
            return { saved: false, message: 'Removed from saved' };
        } else {
            const article = store.getArticleById(articleId);
            await prisma.savedArticle.create({
                data: {
                    userId,
                    articleId,
                    title: bodyData.title || article?.title || '',
                    source: bodyData.source || article?.source || '',
                    topic: bodyData.topic || article?.topic || '',
                    link: bodyData.link || article?.link || '',
                    summary: bodyData.summary || article?.summary || '',
                    timeToRead: bodyData.timeToRead || article?.timeToRead || '',
                    pubDate: bodyData.pubDate || article?.pubDate || '',
                }
            });
            return { saved: true, message: 'Saved to reading list' };
        }
    });

    // Record read (with real time tracking)
    server.post('/read/:articleId', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { articleId } = request.params as { articleId: string };
        const body = (request.body as any) || {};

        // timeSpent is passed in SECONDS from the frontend (real open-time measurement)
        const rawSecs = parseInt(body.timeSpent) || 0;
        const timeSpentSecs = Math.min(rawSecs, 3600); // cap at 1 hour

        // estimatedReadSecs: derived from summary word count at 200wpm reading speed
        // Summary is passed from frontend or pulled from store
        const article = store.getArticleById(articleId);
        const summaryText: string = body.summary || article?.summary || '';
        const wordCount = summaryText.trim().split(/\s+/).filter(Boolean).length;
        const estimatedReadSecs = wordCount > 10 ? Math.round((wordCount / 200) * 60) : 60; // 200wpm → seconds

        // Denormalized fields for analytics
        const topic = body.topic || article?.topic || '';
        const source = body.source || article?.source || '';
        const sentiment = body.sentiment || article?.sentiment || '';
        const title = body.title || article?.title || '';
        const link = body.link || article?.link || '';

        const existing = await prisma.readHistory.findFirst({
            where: { userId, articleId }
        });

        if (!existing) {
            await prisma.readHistory.create({
                data: {
                    userId,
                    articleId,
                    timeSpent: timeSpentSecs,
                    estimatedReadSecs,
                    topic,
                    source,
                    sentiment,
                    title,
                    link,
                },
            });

            // Increment user's total reads & time (store time in minutes for compat)
            await prisma.user.update({
                where: { id: userId },
                data: {
                    totalReads: { increment: 1 },
                    totalReadTime: { increment: Math.max(1, Math.round(timeSpentSecs / 60)) },
                },
            });
        } else if (timeSpentSecs > existing.timeSpent) {
            // Update if user spent more time (re-opened the article)
            await prisma.readHistory.update({
                where: { id: existing.id },
                data: { timeSpent: timeSpentSecs },
            });
        }

        return { read: true };
    });

    // ── Reading Lab Analytics ───────────────────────────────────────────────────
    server.get('/read-lab', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const MIN_READS_FOR_ANALYTICS = 5;

            const [user, allReads, allLiked, allSaved] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.readHistory.findMany({
                where: { userId },
                orderBy: { readAt: 'desc' },
                take: 200,
            }),
            prisma.likedArticle.findMany({
                where: { userId },
                orderBy: { likedAt: 'desc' },
                take: 100,
            }),
            prisma.savedArticle.findMany({
                where: { userId },
                orderBy: { savedAt: 'desc' },
                take: 50,
            }),
        ]);

        // ── SELF-HEALING ANALYTICS (BACKFILL) ──
        // For performance, we calculate stats using DB data, but we'll enrich 'General' articles 
        // with Store data on-the-fly and queue a background update for the DB.
        const readsToBackfill: Array<{ id: string, data: any }> = [];
        const enrichedReads = allReads.map((r: any) => {
            const memArticle = store.getArticleById(r.articleId);
            const needsBackfill = !r.topic || r.topic === 'General' || r.topic === 'Unknown';
            
            // If we have data in memory but not in DB, mark for backfill
            if (needsBackfill && memArticle) {
                const wordCount = (memArticle.summary || '').trim().split(/\s+/).filter(Boolean).length;
                const estSecs = wordCount > 10 ? Math.round((wordCount / 200) * 60) : 60;
                
                const updatedData = {
                    topic: memArticle.topic || 'General',
                    source: memArticle.source || 'Unknown',
                    sentiment: memArticle.sentiment || 'Neutral',
                    estimatedReadSecs: estSecs
                };
                readsToBackfill.push({ id: r.id, data: updatedData });
                return { ...r, ...updatedData };
            }
            return r;
        });

        // Trigger background backfill (limit to 20 per request to avoid DB thrashing)
        if (readsToBackfill.length > 0) {
            (async () => {
                for (const item of readsToBackfill.slice(0, 20)) {
                    await prisma.readHistory.update({
                        where: { id: item.id },
                        data: item.data
                    }).catch(() => {});
                }
            })();
        }

        const totalReads = enrichedReads.length;
        const readsNeeded = Math.max(0, MIN_READS_FOR_ANALYTICS - totalReads);

        // Recent reads for timeline (last 50)
        const recentReads = enrichedReads.slice(0, 50).map((r: any) => {
            const depthLabel = r.estimatedReadSecs > 0
                ? (r.timeSpent >= r.estimatedReadSecs * 0.5 ? 'Deep' : 'Skim')
                : 'N/A';
            return {
                articleId: r.articleId,
                title: r.title || store.getArticleById(r.articleId)?.title || 'Archived Article',
                link: r.link || store.getArticleById(r.articleId)?.link || '',
                topic: r.topic || 'General',
                source: r.source || 'Unknown',
                sentiment: r.sentiment || 'Neutral',
                readAt: r.readAt,
                timeSpentSecs: r.timeSpent,
                estimatedReadSecs: r.estimatedReadSecs || 60,
                depthLabel,
            };
        });

        // Topic breakdown
        const topicCounts: Record<string, number> = {};
        for (const r of enrichedReads) {
            const t = r.topic || 'General';
            topicCounts[t] = (topicCounts[t] || 0) + 1;
        }
        const topicBreakdown = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([topic, count]) => ({ topic, count, percentage: totalReads > 0 ? Math.round((count / totalReads) * 100) : 0 }));

        // Source breakdown (top 10)
        const sourceCounts: Record<string, number> = {};
        for (const r of enrichedReads) {
            const s = r.source || 'Unknown';
            if (s) sourceCounts[s] = (sourceCounts[s] || 0) + 1;
        }
        const sourceBreakdown = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([source, count]) => ({ source, count }));

        // Hourly pattern (0–23)
        const hourlyCounts = new Array(24).fill(0);
        for (const r of enrichedReads) {
            const h = new Date(r.readAt).getHours();
            hourlyCounts[h]++;
        }
        const hourlyPattern = hourlyCounts.map((count, hour) => ({ hour, count }));

        // Daily pattern: last 14 days
        const now = new Date();
        const dailyPattern: Array<{ date: string; label: string; count: number }> = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const dEnd = new Date(d);
            dEnd.setDate(dEnd.getDate() + 1);
            const count = enrichedReads.filter((r: any) => new Date(r.readAt) >= d && new Date(r.readAt) < dEnd).length;
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dailyPattern.push({ date: d.toISOString().split('T')[0], label: `${dayNames[d.getDay()]} ${d.getDate()}`, count });
        }

        // Weekly pattern: last 8 weeks
        const weeklyPattern: Array<{ weekLabel: string; count: number }> = [];
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            const count = enrichedReads.filter((r: any) => new Date(r.readAt) >= weekStart && new Date(r.readAt) < weekEnd).length;
            const mo = weekStart.toLocaleString('en', { month: 'short' });
            weeklyPattern.push({ weekLabel: `${mo} ${weekStart.getDate()}`, count });
        }

        // Sentiment distribution
        const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0, Unknown: 0 };
        for (const r of enrichedReads) {
            const s = r.sentiment as keyof typeof sentimentCounts;
            if (s && s in sentimentCounts) sentimentCounts[s]++;
            else sentimentCounts.Unknown++;
        }

        // Read depth stats
        let deepReads = 0;
        let skimReads = 0;
        let totalTimeSpentSecs = 0;
        for (const r of enrichedReads) {
            totalTimeSpentSecs += r.timeSpent;
            if (r.estimatedReadSecs > 0) {
                if (r.timeSpent >= r.estimatedReadSecs * 0.5) deepReads++;
                else skimReads++;
            }
        }
        const avgTimeSpentSecs = totalReads > 0 ? Math.round(totalTimeSpentSecs / totalReads) : 0;

        // Liked topic breakdown
        const likedTopicCounts: Record<string, number> = {};
        for (const l of allLiked) {
            const t = l.topic || 'General';
            likedTopicCounts[t] = (likedTopicCounts[t] || 0) + 1;
        }
        const likedTopics = Object.entries(likedTopicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([topic, count]) => ({ topic, count }));

        const engagementRate = totalReads > 0 ? Math.round((allLiked.length / totalReads) * 100) : 0;
        const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
        const fmtHour = (h: number) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

        return {
            readsNeeded,
            totalReads,
            recentReads,
            topicBreakdown,
            sourceBreakdown,
            hourlyPattern,
            dailyPattern,
            weeklyPattern,
            sentimentBreakdown: sentimentCounts,
            deepReads,
            skimReads,
            avgTimeSpentSecs,
            engagementRate,
            likedTopics,
            likedArticles: allLiked.slice(0, 20).map((l: any) => ({ id: l.articleId, title: l.title, topic: l.topic, source: l.source, link: l.link, likedAt: l.likedAt })),
            savedArticles: allSaved.slice(0, 20).map((s: any) => ({ id: s.articleId, title: s.title, topic: s.topic, source: s.source, link: s.link, savedAt: s.savedAt })),
            topSource: sourceBreakdown[0]?.source || 'N/A',
            peakHourLabel: fmtHour(peakHour),
            currentStreak: user?.currentStreak || 0,
            longestStreak: user?.longestStreak || 0,
            totalReadTime: user?.totalReadTime || 0,
        };
        } catch (error) {
            console.error('[read-lab] ERROR:', error);
            require('fs').writeFileSync('lab_error.txt', String(error) + '\n' + (error as Error).stack);
            return reply.status(500).send({ error: 'Failed to generate reading lab analytics' });
        }
    });

    // Get liked articles (from DB, denormalized)
    server.get('/liked', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {

        const userId = (request as any).userId;
        const liked = await prisma.likedArticle.findMany({
            where: { userId },
            orderBy: { likedAt: 'desc' },
        });

        // Enrich with in-memory data if available, fall back to DB data
        return liked.map((l: any) => {
            const memArticle = store.getArticleById(l.articleId);
            return {
                id: l.articleId,
                title: memArticle?.title || l.title,
                source: memArticle?.source || l.source,
                topic: memArticle?.topic || l.topic,
                link: memArticle?.link || l.link,
                summary: memArticle?.summary || l.summary || 'Click to analyze',
                timeToRead: memArticle?.timeToRead || l.timeToRead || '3 min',
                pubDate: memArticle?.pubDate || l.pubDate || '',
                likedAt: l.likedAt,
            };
        });
    });

    // Get saved articles (from DB, denormalized)
    server.get('/saved', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const saved = await prisma.savedArticle.findMany({
            where: { userId },
            orderBy: { savedAt: 'desc' },
        });

        return saved.map((s: any) => {
            const memArticle = store.getArticleById(s.articleId);
            return {
                id: s.articleId,
                title: memArticle?.title || s.title,
                source: memArticle?.source || s.source,
                topic: memArticle?.topic || s.topic,
                link: memArticle?.link || s.link,
                summary: memArticle?.summary || s.summary || 'Click to analyze',
                timeToRead: memArticle?.timeToRead || s.timeToRead || '3 min',
                pubDate: memArticle?.pubDate || s.pubDate || '',
                savedAt: s.savedAt,
            };
        });
    });

    // Get user's liked/saved status for articles
    server.get('/interactions', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const [liked, saved] = await Promise.all([
            prisma.likedArticle.findMany({ where: { userId }, select: { articleId: true } }),
            prisma.savedArticle.findMany({ where: { userId }, select: { articleId: true } }),
        ]);

        return {
            likedIds: liked.map((l: any) => l.articleId),
            savedIds: saved.map((s: any) => s.articleId),
        };
    });

    // Notifications
    server.get('/notifications', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return notifications;
    });

    server.put('/notifications/:id/read', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        await prisma.notification.update({ where: { id }, data: { read: true } });
        return { success: true };
    });

    server.put('/notifications/read-all', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
        return { success: true };
    });
}
