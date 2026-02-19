import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { store } from '../services/store';

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

    // Get profile
    server.get('/profile', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        await updateLoginStreak(userId);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, phone: true, darkMode: true, aiProvider: true,
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
        });

        const data = schema.parse(request.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, email: true, name: true, phone: true, darkMode: true, topics: true, aiProvider: true }
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

    // Record read (with time tracking)
    server.post('/read/:articleId', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).userId;
        const { articleId } = request.params as { articleId: string };
        const { timeSpent } = (request.body as any) || {};
        const readMinutes = parseInt(timeSpent) || 3; // default 3 min per read

        const existing = await prisma.readHistory.findFirst({
            where: { userId, articleId }
        });

        if (!existing) {
            await prisma.readHistory.create({
                data: { userId, articleId, timeSpent: readMinutes },
            });

            // Increment user's total reads & time
            await prisma.user.update({
                where: { id: userId },
                data: {
                    totalReads: { increment: 1 },
                    totalReadTime: { increment: readMinutes },
                },
            });
        }

        return { read: true };
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
