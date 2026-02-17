import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, BookOpen, Clock, Sparkles, X, ExternalLink, Flame, Hash,
  ChevronRight, BarChart3, Bookmark, Bell, Search,
  Zap, Filter, LayoutGrid, List,
  Share2, RefreshCw, Heart, Check, ChevronDown, Loader2, Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const topics = ["All", "AI & ML", "Web Dev", "Science", "Startups", "Crypto", "Design", "DevOps", "Security", "Politics", "Business", "Health", "Sports", "Entertainment", "Climate", "Space", "Uncategorized"];

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFeed, triggerRefresh, analyzeArticle, Article, api,
  getUserStats, likeArticle, saveArticle, recordRead,
  getUserInteractions, getTrending, getInsights,
  getSavedArticles, getNotifications, markAllNotificationsRead
} from "../lib/api";
import { useAuth } from "../lib/auth";
// import { AIChat } from "../components/AIChat"; // COMMENTED OUT - AI Chat disabled to conserve API limits

type SortMode = "newest" | "oldest" | "most-liked" | "reading-time";

const ARTICLES_PER_PAGE_OPTIONS = [15, 30, 50];
const DEFAULT_PER_PAGE = 30;

// Helper: format how long ago an article was fetched
function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { data: articles = [], isLoading, isError, error } = useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
    initialData: [],
    // Refresh every 15 minutes (was 1 min — too frequent, caused visual blinks)
    refetchInterval: 15 * 60 * 1000,
  });

  if (isError) {
    console.error("Feed fetch error:", error);
  }

  const safeArticles = Array.isArray(articles) ? articles : [];

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTopics, setActiveTopics] = useState<string[]>(["All"]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [articlesPerPage, setArticlesPerPage] = useState<number>(() => {
    const saved = localStorage.getItem('newslab_perPage');
    return saved ? parseInt(saved) : DEFAULT_PER_PAGE;
  });
  const [displayCount, setDisplayCount] = useState<number>(() => {
    const saved = localStorage.getItem('newslab_perPage');
    return saved ? parseInt(saved) : DEFAULT_PER_PAGE;
  });
  const { user, updateUser, isAuthenticated } = useAuth();

  const { data: interactions, refetch: refetchInteractions } = useQuery({
    queryKey: ['interactions'],
    queryFn: getUserInteractions,
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
    enabled: isAuthenticated,
  });

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending,
    staleTime: 5 * 60 * 1000,
  });

  const { data: insightsData } = useQuery({
    queryKey: ['insights'],
    queryFn: getInsights,
    staleTime: 5 * 60 * 1000,
  });

  const { data: savedArticlesList = [] } = useQuery({
    queryKey: ['saved-articles'],
    queryFn: getSavedArticles,
    enabled: isAuthenticated,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: isAuthenticated,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0;

  const queryClient = useQueryClient();

  // Auto-analyze when opening an article
  useEffect(() => {
    if (selectedArticle && selectedArticle.summary === "Click to analyze") {
      if (isAuthenticated) {
        const readTime = parseInt(selectedArticle.timeToRead || '3');
        recordRead(selectedArticle.id).catch(() => { });
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      }
      analyzeArticle(selectedArticle.id).then(analyzed => {
        setSelectedArticle(analyzed);
        queryClient.setQueryData(['feed'], (oldArticles: Article[] | undefined) => {
          return oldArticles?.map(a => a.id === analyzed.id ? analyzed : a);
        });
      }).catch(err => {
        console.error("Analysis failed:", err);
      });
    } else if (selectedArticle && isAuthenticated) {
      recordRead(selectedArticle.id).catch(() => { });
    }
  }, [selectedArticle?.id]);

  // Load user topics on mount
  useEffect(() => {
    if (user?.topics && user.topics.length > 0) {
      setActiveTopics(user.topics);
    }
  }, [user?.id]);

  // Save topics preference
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.topics &&
      user.topics.length === activeTopics.length &&
      user.topics.every((t: string) => activeTopics.includes(t))) return;

    const timer = setTimeout(async () => {
      try {
        await api.put('/auth/update', { topics: activeTopics });
        updateUser({ ...user, topics: activeTopics });
      } catch (err) {
        console.error("Failed to save preferences", err);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeTopics, isAuthenticated, user?.id]);

  const refreshMutation = useMutation({
    mutationFn: triggerRefresh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success("Feed refreshed!", { duration: 2000 });
    }
  });

  const likeMutation = useMutation({
    mutationFn: likeArticle,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      if (data.liked) {
        toast.success("❤️ Added to likes!", { duration: 2000 });
      } else {
        toast("Removed from likes", { duration: 2000 });
      }
    },
    onError: () => {
      toast.error("Please log in to like articles");
    }
  });

  const saveMutation = useMutation({
    mutationFn: saveArticle,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['saved-articles'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      if (data.saved) {
        toast.success("🔖 Saved to reading list!", { duration: 2000 });
      } else {
        toast("Removed from saved", { duration: 2000 });
      }
    },
    onError: () => {
      toast.error("Please log in to save articles");
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleRefresh = () => refreshMutation.mutate();

  const toggleTopic = (t: string) => {
    if (t === "All") {
      setActiveTopics(["All"]);
    } else {
      setActiveTopics((prev) => {
        const without = prev.filter(x => x !== "All");
        if (without.includes(t)) {
          const result = without.filter((x) => x !== t);
          return result.length === 0 ? ["All"] : result;
        } else {
          return [...without, t];
        }
      });
    }
  };

  const handleLike = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please log in to like articles");
      return;
    }
    likeMutation.mutate(articleId);
  };

  const handleSave = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please log in to save articles");
      return;
    }
    saveMutation.mutate(articleId);
  };

  const handleShare = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    const shareData = { title: article.title, url: article.link };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(article.link);
        toast.success("📋 Link copied to clipboard!", { duration: 2000 });
      }
    } catch {
      // User cancelled share
    }
  };

  const isLiked = (id: string) => interactions?.likedIds?.includes(id) || false;
  const isSaved = (id: string) => interactions?.savedIds?.includes(id) || false;

  const isAllSelected = activeTopics.includes("All");

  // Filtering and sorting
  const filtered = safeArticles
    .filter(
      (a) => (isAllSelected || activeTopics.includes(a.topic)) &&
        (searchQuery === "" || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortMode) {
        case "oldest": return new Date(a.pubDate || 0).getTime() - new Date(b.pubDate || 0).getTime();
        case "most-liked": return (b.likes || 0) - (a.likes || 0);
        case "reading-time": return parseInt(a.timeToRead || "99") - parseInt(b.timeToRead || "99");
        case "newest":
        default: return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
      }
    });

  // Paginated display: show only `displayCount` articles, load more on scroll
  const paginatedArticles = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  // Auto-load more when user reaches the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore) return;
      const scrollBottom = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 300;
      if (scrollBottom >= threshold) {
        setDisplayCount(prev => Math.min(prev + articlesPerPage, filtered.length));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, articlesPerPage, filtered.length]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(articlesPerPage);
  }, [activeTopics, searchQuery, sortMode, articlesPerPage]);

  const trendingTopics = trendingData?.trends || ["Agentic AI", "Rust for Web", "Climate Tech", "Edge AI", "Small LMs", "Zero Trust", "CRISPR"];

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold mb-1">{greeting}, {user?.name?.split(' ')[0] || "User"} 👋</h1>
            <p className="text-sm text-muted-foreground">{dateStr} · {safeArticles.length} articles in your feed</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-10 w-72 glass rounded-xl p-3 z-50 shadow-lg max-h-64 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={() => markAllReadMutation.mutate()} className="text-[10px] text-primary hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    {Array.isArray(notifications) && notifications.length > 0 ? (
                      notifications.slice(0, 10).map((n: any) => (
                        <div key={n.id} className={`p-2 rounded-lg text-xs mb-1 ${n.read ? 'text-muted-foreground' : 'bg-primary/5 text-foreground'}`}>
                          <p className="font-medium">{n.title}</p>
                          <p className="text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No notifications yet</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Profile Link */}
            <Link to="/profile" className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/30 transition-colors">
              {user?.name?.[0] || "U"}
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: "Total Articles Read", value: stats?.totalReads ?? 0, icon: BookOpen, change: `${stats?.thisWeek ?? 0} this week` },
            { label: "Reading Streak", value: `${stats?.streak ?? 0} days`, icon: Flame, change: `Best: ${stats?.longestStreak ?? 0}` },
            { label: "Saved Articles", value: stats?.totalSaved ?? 0, icon: Bookmark, change: `${stats?.totalLiked ?? 0} liked` },
            { label: "Avg. Daily Read Time", value: stats?.avgReadTime || "0 min", icon: Clock, change: `${stats?.loginDays ?? 0} days active` },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="glass rounded-xl p-4 cursor-default"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-medium text-primary">{stat.change}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="glass rounded-2xl p-4 sticky top-28 space-y-6">
              {/* Topics */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Topics</h3>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTopic(t)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${(t === "All" ? isAllSelected : activeTopics.includes(t))
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                      <span>{t === "All" ? "🌐 All" : <><Hash className="inline h-3 w-3 mr-1.5" />{t}</>}</span>
                      {(t === "All" ? isAllSelected : activeTopics.includes(t)) && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                  <Flame className="h-3 w-3" /> Trending Now
                </h3>
                <div className="space-y-1">
                  {trendingTopics.map((t: string, i: number) => (
                    <div key={t} className="text-xs text-muted-foreground px-3 py-1.5 flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer">
                      <span className="text-[10px] font-bold text-primary/60 w-4">{i + 1}</span>
                      <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Saved */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                  <Bookmark className="h-3 w-3" /> Saved
                </h3>
                <div className="space-y-2">
                  {Array.isArray(savedArticlesList) && savedArticlesList.length > 0 ? (
                    savedArticlesList.slice(0, 3).map((a: any) => (
                      <div key={a.id || a.title} className="px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <p className="text-xs font-medium line-clamp-1">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.source}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground px-3">No saved articles yet</p>
                  )}
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> This Week
                </h3>
                <div className="flex items-end gap-1.5 h-16 px-2">
                  {(stats?.weeklyData || [
                    { day: "Mon", count: 0 }, { day: "Tue", count: 0 },
                    { day: "Wed", count: 0 }, { day: "Thu", count: 0 },
                    { day: "Fri", count: 0 }, { day: "Sat", count: 0 },
                    { day: "Sun", count: 0 },
                  ]).map((d: any) => {
                    const maxCount = Math.max(...(stats?.weeklyData?.map((x: any) => x.count) || [1]), 1);
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 4 }}
                          animate={{ height: `${Math.max(4, (d.count / maxCount) * 48)}px` }}
                          className="w-full rounded-sm bg-primary/20 hover:bg-primary/40 transition-colors"
                        />
                        <span className="text-[9px] text-muted-foreground">{d.day[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search & Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <AnimatePresence>
                    {showFilterDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-10 w-44 glass rounded-xl p-2 z-50 shadow-lg"
                      >
                        {([
                          { label: "Newest First", value: "newest" },
                          { label: "Oldest First", value: "oldest" },
                          { label: "Most Liked", value: "most-liked" },
                          { label: "Shortest Read", value: "reading-time" },
                        ] as const).map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setSortMode(opt.value); setShowFilterDropdown(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${sortMode === opt.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              }`}
                          >
                            {opt.label}
                            {sortMode === opt.value && <Check className="h-3 w-3" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                  className={`p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors`}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                </button>
                {/* Settings gear */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-10 w-52 glass rounded-xl p-3 z-50 shadow-lg"
                      >
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Display Settings</h4>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Articles per page</p>
                          <div className="flex gap-1.5">
                            {ARTICLES_PER_PAGE_OPTIONS.map(n => (
                              <button
                                key={n}
                                onClick={() => {
                                  setArticlesPerPage(n);
                                  setDisplayCount(n);
                                  localStorage.setItem('newslab_perPage', String(n));
                                  setShowSettings(false);
                                }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${articlesPerPage === n
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'glass text-muted-foreground hover:text-foreground'
                                  }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">Auto-loads more as you scroll down</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex glass rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile topics */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTopic(t)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${(t === "All" ? isAllSelected : activeTopics.includes(t))
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "glass text-muted-foreground"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Digest Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Today's Digest
              </h2>
              <span className="text-xs text-muted-foreground">
                Showing {paginatedArticles.length} of {filtered.length} articles
              </span>
            </div>

            {/* Articles */}
            <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-3" : "space-y-3"}>
              {isLoading ? (
                <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  Loading articles from your feeds...
                </div>
              ) : isError ? (
                <div className="text-center py-20 text-red-500">
                  <p>Failed to load articles.</p>
                  <p className="text-sm font-mono mt-2 bg-red-50 p-2 rounded">{error instanceof Error ? error.message : "Unknown error"}</p>
                </div>
              ) : (
                <>
                  {paginatedArticles.map((article: any, i: number) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.5) }}
                      onClick={() => setSelectedArticle(article)}
                      className="glass rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {article.categorizing ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Categorizing
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {article.topic || "News"}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {article.timeToRead || article.time || "3 min"}
                        </span>
                        {article.pubDate && (
                          <span className="text-[10px] text-muted-foreground" title={new Date(article.pubDate).toLocaleString()}>
                            · {timeAgo(article.pubDate)}
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-muted-foreground">{article.source}</span>
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <button
                            onClick={(e) => handleLike(e, article.id)}
                            className={`flex items-center gap-1 transition-all ${isLiked(article.id) ? 'text-red-500 scale-110' : 'hover:text-red-400'}`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${isLiked(article.id) ? 'fill-current' : ''}`} /> {article.likes || 0}
                          </button>
                          <button
                            onClick={(e) => handleShare(e, article)}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Share2 className="h-3 w-3" /> Share
                          </button>
                          <button
                            onClick={(e) => handleSave(e, article.id)}
                            className={`flex items-center gap-1 transition-all ${isSaved(article.id) ? 'text-primary scale-110' : 'hover:text-primary'}`}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${isSaved(article.id) ? 'fill-current' : ''}`} /> {isSaved(article.id) ? 'Saved' : 'Save'}
                          </button>
                        </div>
                        <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Read <ChevronRight className="h-3 w-3 ml-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {/* Auto-load indicator */}
                  {hasMore && (
                    <div className="text-center py-6 col-span-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Scroll down to load more articles...
                      </div>
                    </div>
                  )}
                  {filtered.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground text-sm col-span-2">
                      {searchQuery ? "No articles match your search." : "No articles found. Try selecting different topics or refresh."}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Insights Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 glass rounded-2xl p-6"
            >
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Quick Insights from Today
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-primary mb-1">Top Trend</p>
                  <p className="text-sm font-medium">{insightsData?.topTrend?.name || "Loading..."}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Mentioned in {insightsData?.topTrend?.count || "—"} articles today</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-primary mb-1">Most Read Topic</p>
                  <p className="text-sm font-medium">{insightsData?.mostReadTopic?.name || "Loading..."}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{insightsData?.mostReadTopic?.percentage || "—"}% of today's digest</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-primary mb-1">Emerging</p>
                  <p className="text-sm font-medium">{insightsData?.emerging?.name || "Loading..."}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">↑ {insightsData?.emerging?.growth || "—"} interest this week</p>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {selectedArticle.topic}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{selectedArticle.source}</span>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold mb-4">{selectedArticle.title}</h2>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5 pb-4 border-b border-border">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedArticle.timeToRead || selectedArticle.time || "3 min"} read</span>
                <button
                  onClick={(e) => handleLike(e, selectedArticle.id)}
                  className={`flex items-center gap-1 transition-all ${isLiked(selectedArticle.id) ? 'text-red-500' : 'hover:text-red-400'}`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isLiked(selectedArticle.id) ? 'fill-current' : ''}`} /> {selectedArticle.likes || 0}
                </button>
                <button
                  onClick={(e) => handleSave(e, selectedArticle.id)}
                  className={`flex items-center gap-1 transition-all ${isSaved(selectedArticle.id) ? 'text-primary' : 'hover:text-primary'}`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isSaved(selectedArticle.id) ? 'fill-current' : ''}`} /> {isSaved(selectedArticle.id) ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={(e) => handleShare(e, selectedArticle)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Share2 className="h-3 w-3" /> Share
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" /> AI Summary
                  </h4>
                  {selectedArticle.summary === "Click to analyze" ? (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Analyzing article with AI...
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{selectedArticle.summary}</p>
                  )}
                </div>

                {selectedArticle.summary !== "Click to analyze" && (
                  <>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-primary" /> Key Insights
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedArticle.insights.map((ins, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {ins}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why This Matters</h4>
                      <p className="text-sm text-muted-foreground">{selectedArticle.why}</p>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleSave(e, selectedArticle.id)}
                      className={`flex items-center gap-1.5 text-xs transition-all ${isSaved(selectedArticle.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${isSaved(selectedArticle.id) ? 'fill-current' : ''}`} />
                      {isSaved(selectedArticle.id) ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={(e) => handleShare(e, selectedArticle)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </button>
                  </div>
                  <a
                    href={selectedArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Read original <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* <AIChat /> */} {/* COMMENTED OUT - AI Chat disabled to conserve API limits */}
    </div>
  );
}
