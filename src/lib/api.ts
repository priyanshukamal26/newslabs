import axios from 'axios';

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
    timeToRead?: string;
    time?: string;
    likes?: number;
    comments?: number;
    categorizing?: boolean;
    isLiked?: boolean;
    isSaved?: boolean;
}

export const fetchFeed = async (): Promise<Article[]> => {
    const { data } = await api.get('/content/feed');
    return data;
};

export const triggerRefresh = async (): Promise<void> => {
    await api.post('/content/refresh');
};

export const analyzeArticle = async (id: string): Promise<Article> => {
    const { data } = await api.post('/content/analyze', { id });
    return data;
};

// User stats
export const getUserStats = async () => {
    const { data } = await api.get('/user/stats');
    return data;
};

// Like/unlike
export const likeArticle = async (articleId: string) => {
    const { data } = await api.post(`/user/like/${articleId}`, {});
    return data;
};

// Save/unsave
export const saveArticle = async (articleId: string) => {
    const { data } = await api.post(`/user/save/${articleId}`, {});
    return data;
};

// Record read
export const recordRead = async (articleId: string) => {
    const { data } = await api.post(`/user/read/${articleId}`, {});
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

export const updateProfile = async (profileData: { name?: string; phone?: string; email?: string; darkMode?: boolean }) => {
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
