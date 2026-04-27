import axios from 'axios';
// Triggering Vite refresh for getReadLab export

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Article {
    id: string;
    title: string;
    summary: string;
    topic: string;
    why: string;
    insights: string[];
    link: string;
    source: string;
    pubDate: string;
    isoDate?: string;
    timeToRead?: string;
    time?: string;
    likes?: number;
    comments?: number;
    categorizing?: boolean;
    isLiked?: boolean;
    isSaved?: boolean;
    sourceType?: 'system' | 'user';
    sourceUrl?: string;
    feedCategory?: string | null;
    // NLP enrichment fields
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    sentimentScore?: number;
    sentimentSignals?: string[];
    articleType?: 'Opinion' | 'Factual';
    reliability?: number;
    reliabilityTier?: 'High' | 'Medium' | 'Low';
    reliabilitySignals?: string[];
    opinionSignals?: string[];
    classificationConfidence?: number;
    secondaryTags?: string[];
    primaryCategory?: string;
    classificationSignals?: string[];
    biasIndicator?: 'Neutral' | 'Slightly Opinionated' | 'Strongly Opinionated';
}

export interface UserFeed {
    id: string;
    userId: string;
    url: string;
    displayName: string;
    category?: string | null;
    isActive: boolean;
    addedAt: string;
}

export interface ByokCredential {
    id: string;
    label: string;
    provider: string;
    model: string;
    baseUrl?: string | null;
    apiKeyMask: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastValidatedAt?: string | null;
}

export interface ByokPreference {
    byokEnabled: boolean;
    timeoutSeconds: 10 | 30 | 60 | 120;
    timeoutDisabled: boolean;
    activeCredentialId?: string | null;
    timerUnlocked: boolean;
}

export const fetchFeed = async (): Promise<Article[]> => {
    const { data } = await api.get('/content/feed');
    return data;
};

export const triggerRefresh = async (): Promise<void> => {
    await api.post('/content/refresh');
};

export const analyzeArticle = async (
    id: string,
    summaryMode?: 'concise' | 'balanced' | 'detailed',
    forceMode?: string
): Promise<Article> => {
    const { data } = await api.post('/content/analyze', { id, summaryMode, forceMode });
    return data;
};

// User stats
export const getUserStats = async () => {
    const { data } = await api.get('/user/stats');
    return data;
};

// Like/unlike
export const likeArticle = async (articleId: string, articleData?: any) => {
    const { data } = await api.post(`/user/like/${articleId}`, articleData || {});
    return data;
};

// Save/unsave
export const saveArticle = async (articleId: string, articleData?: any) => {
    const { data } = await api.post(`/user/save/${articleId}`, articleData || {});
    return data;
};

// Record read — sends real timeSpent (seconds) + article metadata for analytics
export const recordRead = async (
    articleId: string,
    meta?: { timeSpent?: number; summary?: string; topic?: string; source?: string; sentiment?: string }
) => {
    const { data } = await api.post(`/user/read/${articleId}`, meta || {});
    return data;
};

// User interactions (liked/saved state)
export const getUserInteractions = async () => {
    const { data } = await api.get('/user/interactions');
    return data as { likedIds: string[]; savedIds: string[] };
};

// Profile
export const getUserProfile = async () => {
    const { data } = await api.get('/user/profile');
    return data;
};

export const updateProfile = async (profileData: {
    name?: string;
    phone?: string;
    email?: string;
    darkMode?: boolean;
    aiProvider?: string;
    summaryMode?: 'concise' | 'balanced' | 'detailed';
}) => {
    const { data } = await api.put('/user/profile', profileData);
    return data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
    const { data } = await api.put('/user/password', { currentPassword, newPassword });
    return data;
};

// Notifications
export const getNotifications = async () => {
    const { data } = await api.get('/user/notifications');
    return data;
};

export const markNotificationRead = async (id: string) => {
    const { data } = await api.put(`/user/notifications/${id}/read`);
    return data;
};

export const markAllNotificationsRead = async () => {
    const { data } = await api.put('/user/notifications/read-all');
    return data;
};

// Trending
export const getTrending = async () => {
    const { data } = await api.get('/content/trending');
    return data as { trends: string[] };
};

// Insights
export const getInsights = async () => {
    const { data } = await api.get('/content/insights');
    return data as {
        topTrend: { name: string; count: number };
        mostReadTopic: { name: string; percentage: number };
        emerging: { name: string; growth: string };
    };
};

// Liked articles
export const getLikedArticles = async () => {
    const { data } = await api.get('/user/liked');
    return data;
};

// Saved articles
export const getSavedArticles = async () => {
    const { data } = await api.get('/user/saved');
    return data;
};

// Reading Lab analytics
export const fetchReadLab = async () => {
    const { data } = await api.get('/user/read-lab');
    return data as {
        readsNeeded: number;
        totalReads: number;
        recentReads: Array<{ articleId: string; title: string; topic: string; source: string; sentiment: string; readAt: string; timeSpentSecs: number; estimatedReadSecs: number; depthLabel: string }>;
        topicBreakdown: Array<{ topic: string; count: number; percentage: number }>;
        sourceBreakdown: Array<{ source: string; count: number }>;
        hourlyPattern: Array<{ hour: number; count: number }>;
        dailyPattern: Array<{ date: string; label: string; count: number }>;
        weeklyPattern: Array<{ weekLabel: string; count: number }>;
        sentimentBreakdown: { Positive: number; Neutral: number; Negative: number; Unknown: number };
        deepReads: number;
        skimReads: number;
        avgTimeSpentSecs: number;
        engagementRate: number;
        likedTopics: Array<{ topic: string; count: number }>;
        likedArticles: Array<{ id: string; title: string; topic: string; source: string; link: string; likedAt: string }>;
        savedArticles: Array<{ id: string; title: string; topic: string; source: string; link: string; savedAt: string }>;
        topSource: string;
        peakHourLabel: string;
        currentStreak: number;
        longestStreak: number;
        totalReadTime: number;
    };
};

// Feed management
export const getUserFeeds = async () => {
    const { data } = await api.get('/user/feeds');
    return data as { feeds: UserFeed[] };
};

export const validateFeedUrl = async (url: string) => {
    const { data } = await api.post('/user/feeds/validate', { url });
    return data as {
        valid: boolean;
        feedName: string;
        preview: Array<{ title: string; link: string; pubDate: string; source: string }>;
    };
};

export const addUserFeed = async (payload: { url: string; displayName?: string; category?: string | null }) => {
    const { data } = await api.post('/user/feeds', payload);
    return data as { feed: UserFeed };
};

export const updateUserFeed = async (id: string, payload: { url?: string; displayName?: string; category?: string | null; isActive?: boolean }) => {
    const { data } = await api.put(`/user/feeds/${id}`, payload);
    return data as { feed: UserFeed };
};

export const deleteUserFeed = async (id: string, dryRun = false) => {
    const { data } = await api.delete(`/user/feeds/${id}${dryRun ? '?dryRun=true' : ''}`);
    return data as { success: boolean; relatedSavedCount: number; dryRun?: boolean };
};

export const importFeedsFromOpml = async (opml: string) => {
    const { data } = await api.post('/user/feeds/import-opml', { opml });
    return data as { imported: number };
};

export const exportFeedsOpml = async () => {
    const response = await api.get('/user/feeds/export-opml', { responseType: 'blob' });
    return response.data as Blob;
};

// BYOK multi credential
export const getByokState = async () => {
    const { data } = await api.get('/user/ai/byok');
    return data as { preference: ByokPreference; credentials: ByokCredential[] };
};

export const updateByokPreference = async (payload: {
    byokEnabled?: boolean;
    timeoutSeconds?: 10 | 30 | 60 | 120;
    timeoutDisabled?: boolean;
    activeCredentialId?: string | null;
}) => {
    const { data } = await api.put('/user/ai/byok/preference', payload);
    return data as ByokPreference;
};

export const validateByokCredential = async (payload: {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
}) => {
    const { data } = await api.post('/user/ai/byok/credentials/validate', payload);
    return data as { ok: boolean; message: string };
};

export const createByokCredential = async (payload: {
    label: string;
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
    makeActive?: boolean;
}) => {
    const { data } = await api.post('/user/ai/byok/credentials', payload);
    return data as { credential: ByokCredential; message: string };
};

export const activateByokCredential = async (id: string) => {
    const { data } = await api.put(`/user/ai/byok/credentials/${id}/activate`);
    return data as { success: boolean };
};

export const deleteByokCredential = async (id: string) => {
    const { data } = await api.delete(`/user/ai/byok/credentials/${id}`);
    return data as { success: boolean };
};

// Public Daily Brief
export const getPublicDailyBrief = async (): Promise<{ articles: any[], cachedAt: string, expiresAt: string }> => {
    const { data } = await api.get('/public/daily-brief');
    return data;
};

// ── Bot Notification Settings ─────────────────────────────────────────────────

export interface BotSettings {
    telegramEnabled: boolean;
    telegramConnected: boolean;
    telegramChatIdMask: string | null;
    discordEnabled: boolean;
    discordConnected: boolean;
    discordWebhookMask: string | null;
    activeSlots: string[];
}

export type NotificationSlot = 'morning' | 'noon' | 'evening' | 'night' | 'instant';

export interface NotificationLogEntry {
    slot: NotificationSlot;
    slotLabel: string;
    sentAt: string;
    articleIds: string[];
    articleTitles: string[];
    articleLinks: string[];
    articleSources: string[];
    articleTopics: string[];
    selectionReason: string;
    platforms: Array<{ platform: string; success: boolean; errorMessage?: string | null }>;
}

export const getBotSettings = async (): Promise<BotSettings> => {
    const { data } = await api.get('/notifications/bot-settings');
    return data;
};

export const updateBotSettings = async (payload: {
    telegramEnabled?: boolean;
    discordEnabled?: boolean;
    activeSlots?: NotificationSlot[];
}) => {
    const { data } = await api.put('/notifications/bot-settings', payload);
    return data;
};

export const connectTelegram = async (): Promise<{ deepLink: string; token: string; expiresInMs: number }> => {
    const { data } = await api.post('/notifications/telegram/connect');
    return data;
};

export const pollTelegramStatus = async (): Promise<{ connected: boolean; enabled: boolean }> => {
    const { data } = await api.get('/notifications/telegram/status');
    return data;
};

export const disconnectTelegram = async () => {
    const { data } = await api.delete('/notifications/telegram/disconnect');
    return data;
};

export const connectDiscord = async (webhookUrl: string) => {
    const { data } = await api.post('/notifications/discord/connect', { webhookUrl });
    return data as { success: boolean; message: string };
};

export const disconnectDiscord = async () => {
    const { data } = await api.delete('/notifications/discord/disconnect');
    return data;
};

export const getNotificationLogs = async (): Promise<{ logs: NotificationLogEntry[] }> => {
    const { data } = await api.get('/notifications/logs');
    return data;
};

export const sendTestNotification = async (platform: 'telegram' | 'discord' | 'both' = 'both') => {
    const { data } = await api.post('/notifications/test', { platform });
    return data;
};
