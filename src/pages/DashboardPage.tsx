import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Clock, Sparkles, X, ExternalLink, Flame, Hash,
  ChevronRight, BarChart3, Bookmark, Bell, Search,
  Zap, Filter, List, LayoutGrid,
  Share2, RefreshCw, Heart, Check, ChevronDown, Loader2, Settings, HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const topics = ["All", "AI & ML", "Web Dev", "Science", "Startups", "Crypto", "Design", "DevOps", "Security", "Politics", "Business", "Health", "Sports", "Entertainment", "Climate", "Space", "Uncategorized"];

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFeed, triggerRefresh, analyzeArticle, Article, api,
  getUserStats, likeArticle, saveArticle, recordRead,
  getUserInteractions, getInsights,
  getSavedArticles, getNotifications, markAllNotificationsRead
} from "../lib/api";
import { useAuth } from "../lib/auth";

/* ── Style tokens ──────────────────────────────────────────────────── */
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const serif = { fontFamily: "'Playfair Display', serif" };
const bodyFont = { fontFamily: "'Lora', serif" };
const sans = { fontFamily: "'Inter', sans-serif" };

/* ── Types ─────────────────────────────────────────────────────────── */
type SortMode = "newest" | "oldest";
const ARTICLES_PER_PAGE_OPTIONS = [15, 30, 50];
const DEFAULT_PER_PAGE = 30;
const AI_COOLDOWN_MS = 30000;

function parseDateSafe(dateStr?: string): number {
  if (!dateStr) return 0;
  const ts = new Date(dateStr).getTime();
  return isNaN(ts) ? 0 : ts;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Tiny primitives ────────────────────────────────────────────────── */
function NpChip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 border ${active ? "border-[#CC0000] text-[#CC0000]" : "border-[#E5E5E0] text-neutral-500"}`}
      style={mono}
    >
      {children}
    </span>
  );
}

export default function DashboardPage() {
  /* ── Data fetching ─────────────────────────────────────────────── */
  const { data: articles = [], isLoading, isError, error } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    initialData: [],
    refetchInterval: 15 * 60 * 1000,
  });
  if (isError) console.error("Feed fetch error:", error);
  const safeArticles = Array.isArray(articles) ? articles : [];

  const { user, updateUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: interactions, refetch: refetchInteractions } = useQuery({
    queryKey: ["interactions"],
    queryFn: getUserInteractions,
    enabled: isAuthenticated,
  });
  const { data: stats } = useQuery({ queryKey: ["user-stats"], queryFn: getUserStats, enabled: isAuthenticated });
  const { data: insightsData } = useQuery({ queryKey: ["insights"], queryFn: getInsights, staleTime: 5 * 60 * 1000 });
  const { data: savedArticlesList = [] } = useQuery({ queryKey: ["saved-articles"], queryFn: getSavedArticles, enabled: isAuthenticated });
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: getNotifications, enabled: isAuthenticated });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0;

  /* ── UI State ───────────────────────────────────────────────────── */
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTopics, setActiveTopics] = useState<string[]>(["All"]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [articlesPerPage, setArticlesPerPage] = useState<number>(() => {
    const s = localStorage.getItem("newslab_perPage"); return s ? parseInt(s) : DEFAULT_PER_PAGE;
  });
  const [displayCount, setDisplayCount] = useState<number>(() => {
    const s = localStorage.getItem("newslab_perPage"); return s ? parseInt(s) : DEFAULT_PER_PAGE;
  });
  const [aiCooldownEnd, setAiCooldownEnd] = useState(0);
  const [aiCooldownLeft, setAiCooldownLeft] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [waitingForCooldown, setWaitingForCooldown] = useState(false);

  /* ── Cooldown timer ─────────────────────────────────────────────── */
  useEffect(() => {
    if (aiCooldownEnd <= Date.now()) { setAiCooldownLeft(0); return; }
    const interval = setInterval(() => {
      const remaining = Math.max(0, aiCooldownEnd - Date.now());
      setAiCooldownLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [aiCooldownEnd]);

  /* ── AI Analysis ────────────────────────────────────────────────── */
  const handleAnalyzeArticle = async (article: Article) => {
    const now = Date.now();
    if (aiCooldownEnd > now) {
      const secs = Math.ceil((aiCooldownEnd - now) / 1000);
      if (!waitingForCooldown) toast.error(`AI cooling down — wait ${secs}s`, { duration: 3000 });
      setWaitingForCooldown(true); return;
    }
    setIsAnalyzing(true); setWaitingForCooldown(false);
    try {
      const analyzed = await analyzeArticle(article.id);
      setSelectedArticle(analyzed);
      queryClient.setQueryData(["feed"], (old: Article[] | undefined) => old?.map(a => a.id === analyzed.id ? analyzed : a));
      setAiCooldownEnd(Date.now() + AI_COOLDOWN_MS);
      setAiCooldownLeft(AI_COOLDOWN_MS);
    } catch {
      toast.error("Summary took too long — tap the article again to retry.", { duration: 4000 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedArticle) {
      if (isAuthenticated) { recordRead(selectedArticle.id).catch(() => { }); queryClient.invalidateQueries({ queryKey: ["user-stats"] }); }
      if (selectedArticle.summary === "Click to analyze") handleAnalyzeArticle(selectedArticle);
    }
  }, [selectedArticle?.id]);

  useEffect(() => {
    if (aiCooldownLeft === 0 && waitingForCooldown && selectedArticle?.summary === "Click to analyze" && !isAnalyzing)
      handleAnalyzeArticle(selectedArticle!);
  }, [aiCooldownLeft, waitingForCooldown, selectedArticle, isAnalyzing]);

  useEffect(() => {
    if (user?.topics && user.topics.length > 0) setActiveTopics(user.topics);
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.topics && user.topics.length === activeTopics.length && user.topics.every((t: string) => activeTopics.includes(t))) return;
    const timer = setTimeout(async () => {
      try { await api.put("/auth/update", { topics: activeTopics }); updateUser({ ...user, topics: activeTopics }); } catch { }
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeTopics, isAuthenticated, user?.id]);

  /* ── Mutations ──────────────────────────────────────────────────── */
  const refreshMutation = useMutation({
    mutationFn: triggerRefresh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Feed refreshed!", { duration: 2000 });
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) => likeArticle(id, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      data.liked ? toast.success("Added to likes", { duration: 2000 }) : toast("Removed from likes", { duration: 2000 });
    },
    onError: () => toast.error("Please log in to like articles"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) => saveArticle(id, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["saved-articles"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      data.saved ? toast.success("Saved to reading list", { duration: 2000 }) : toast("Removed from saved", { duration: 2000 });
    },
    onError: () => toast.error("Please log in to save articles"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  /* ── Handlers ───────────────────────────────────────────────────── */
  const isLiked = (id: string) => interactions?.likedIds?.includes(id) || false;
  const isSaved = (id: string) => interactions?.savedIds?.includes(id) || false;
  const isAllSelected = activeTopics.includes("All");

  const toggleTopic = (t: string) => {
    if (t === "All") { setActiveTopics(["All"]); return; }
    setActiveTopics(prev => {
      const without = prev.filter(x => x !== "All");
      if (without.includes(t)) { const result = without.filter(x => x !== t); return result.length === 0 ? ["All"] : result; }
      return [...without, t];
    });
  };

  const handleLike = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error("Please log in to like articles"); return; }
    likeMutation.mutate({ id: article.id, data: article });
  };

  const handleSave = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error("Please log in to save articles"); return; }
    saveMutation.mutate({ id: article.id, data: article });
  };

  const handleShare = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    try {
      if (navigator.share) { await navigator.share({ title: article.title, url: article.link }); }
      else { await navigator.clipboard.writeText(article.link); toast.success("Link copied", { duration: 2000 }); }
    } catch { }
  };

  /* ── Filtering & sorting ────────────────────────────────────────── */
  const filtered = safeArticles
    .filter(a => {
      const matchTopic = isAllSelected || activeTopics.includes(a.topic);
      const matchSearch = searchQuery.trim() === "" || (a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary?.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchTopic && matchSearch;
    })
    .sort((a, b) => {
      const ta = parseDateSafe(a.pubDate || a.isoDate), tb = parseDateSafe(b.pubDate || b.isoDate);
      if (!ta && !tb) return 0; if (!ta) return 1; if (!tb) return -1;
      return sortMode === "oldest" ? ta - tb : tb - ta;
    });

  const paginatedArticles = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300)
        setDisplayCount(prev => Math.min(prev + articlesPerPage, filtered.length));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, articlesPerPage, filtered.length]);

  useEffect(() => { setDisplayCount(articlesPerPage); }, [activeTopics, searchQuery, sortMode, articlesPerPage]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-20"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")` }}>
      <div className="max-w-7xl mx-auto px-4 pt-20">

        {/* ── Masthead ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b-2 border-[#111111] pb-5 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#CC0000] mb-1" style={mono}>{dateStr}</p>
            <h1 className="text-4xl font-black text-[#111111] leading-tight" style={serif}>
              {greeting}, {user?.name?.split(" ")[0] || "Reader"}.
            </h1>
            <p className="text-xs text-neutral-500 mt-1" style={mono}>{safeArticles.length} articles in your feed today</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 border border-[#111111] flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
                style={{ borderRadius: 0 }}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#CC0000] text-white text-[8px] flex items-center justify-center font-bold">{unreadCount}</span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-11 w-72 bg-white border border-[#111111] shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E5E0]">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500" style={mono}>Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={() => markAllReadMutation.mutate()} className="text-[9px] text-[#CC0000] hover:underline font-bold uppercase tracking-[0.1em]" style={mono}>Mark all read</button>
                      )}
                    </div>
                    {Array.isArray(notifications) && notifications.length > 0 ? notifications.slice(0, 10).map((n: any) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-[#E5E5E0] text-xs ${n.read ? "text-neutral-400" : "text-[#111111] bg-red-50/30"}`}>
                        <p className="font-bold" style={sans}>{n.title}</p>
                        <p className="text-neutral-500 mt-0.5" style={bodyFont}>{n.message}</p>
                      </div>
                    )) : (
                      <p className="text-xs text-neutral-400 text-center py-6" style={bodyFont}>No notifications yet</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Profile avatar */}
            <Link to="/profile"
              className="h-9 w-9 border-2 border-[#111111] flex items-center justify-center text-xs font-black text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              style={{ ...serif, borderRadius: 0 }}>
              {user?.name?.[0] || "U"}
            </Link>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px mb-8 border border-[#111111] bg-[#111111]">
          {[
            { label: "Articles Read", value: stats?.totalReads ?? 0, sub: `${stats?.thisWeek ?? 0} this week`, icon: BookOpen },
            { label: "Reading Streak", value: `${stats?.streak ?? 0}d`, sub: `Best: ${stats?.longestStreak ?? 0}d`, icon: Flame },
            { label: "Saved Articles", value: stats?.totalSaved ?? 0, sub: `${stats?.totalLiked ?? 0} liked`, icon: Bookmark },
            { label: "Daily Read Time", value: stats?.avgReadTime || "0 min", sub: `${stats?.loginDays ?? 0} days active`, icon: Clock },
          ].map(stat => (
            <div key={stat.label} className="bg-[#F9F9F7] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-3.5 w-3.5 text-[#CC0000]" />
                <span className="text-[9px] text-neutral-400" style={mono}>{stat.sub}</span>
              </div>
              <p className="text-2xl font-black text-[#111111]" style={serif}>{stat.value}</p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 mt-0.5" style={mono}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="border border-[#111111] bg-white sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {/* Topics */}
              <div className="px-4 py-3 border-b border-[#111111]">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500" style={mono}>Your Topics</p>
              </div>
              <div className="py-1">
                {topics.map(t => {
                  const active = t === "All" ? isAllSelected : activeTopics.includes(t);
                  return (
                    <button key={t} onClick={() => toggleTopic(t)}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors ${active ? "bg-[#111111] text-[#F9F9F7]" : "text-neutral-600 hover:bg-neutral-50 hover:text-[#111111]"}`}
                      style={{ ...sans, borderRadius: 0 }}>
                      <span className="flex items-center gap-1.5">
                        {t === "All" ? "All" : <><Hash className="h-3 w-3 shrink-0" />{t}</>}
                      </span>
                      {active && <span className="h-1.5 w-1.5 bg-[#CC0000] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Saved */}
              <div className="border-t border-[#111111]">
                <div className="px-4 py-3 border-b border-[#E5E5E0]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1.5" style={mono}><Bookmark className="h-3 w-3" /> Saved</p>
                </div>
                <div className="py-1">
                  {Array.isArray(savedArticlesList) && savedArticlesList.length > 0 ? savedArticlesList.slice(0, 5).map((a: any) => (
                    <div key={a.id || a.title} className="group flex items-center gap-2 px-4 py-2 hover:bg-neutral-50 transition-colors">
                      <a href={a.link || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                        <p className="text-xs text-[#111111] line-clamp-1 font-medium" style={sans}>{a.title || <span className="italic text-neutral-400">Untitled</span>}</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5" style={mono}>{a.source || "Unknown"}</p>
                      </a>
                      <button onClick={() => saveMutation.mutate({ id: a.id, data: {} })} className="shrink-0 p-1 text-neutral-400 hover:text-[#CC0000] opacity-0 group-hover:opacity-100 transition-all" style={{ borderRadius: 0 }}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )) : <p className="text-[10px] text-neutral-400 px-4 py-3" style={mono}>No saved articles yet</p>}
                </div>
              </div>

              {/* Weekly chart */}
              <div className="border-t border-[#111111]">
                <div className="px-4 py-3 border-b border-[#E5E5E0]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1.5" style={mono}>
                    <BarChart3 className="h-3 w-3" /> This Week
                    <span title="Articles read per day"><HelpCircle className="h-3 w-3 text-neutral-300 hover:text-neutral-500 transition-colors cursor-help ml-auto" /></span>
                  </p>
                </div>
                <div className="flex items-end gap-1 h-14 px-3 pb-1 pt-3">
                  {(stats?.weeklyData || [
                    { day: "Mon", count: 0 }, { day: "Tue", count: 0 }, { day: "Wed", count: 0 },
                    { day: "Thu", count: 0 }, { day: "Fri", count: 0 }, { day: "Sat", count: 0 }, { day: "Sun", count: 0 },
                  ]).map((d: any) => {
                    const maxCount = Math.max(...(stats?.weeklyData?.map((x: any) => x.count) || [1]), 1);
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5 group/bar relative">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 pointer-events-none">
                          <span className="text-[9px] font-bold text-[#111111] bg-white border border-[#E5E5E0] px-1 py-0.5 whitespace-nowrap" style={mono}>{d.count}</span>
                        </div>
                        <motion.div
                          initial={{ height: 2 }}
                          animate={{ height: `${Math.max(2, (d.count / maxCount) * 36)}px` }}
                          className="w-full bg-[#111111] hover:bg-[#CC0000] transition-colors cursor-pointer"
                          title={`${d.day}: ${d.count}`}
                        />
                        <span className="text-[8px] text-neutral-400" style={mono}>{d.day[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">
            {/* Search & controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input type="text" placeholder="Search articles…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#111111] text-sm text-[#111111] placeholder:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#111111] transition"
                  style={{ ...sans, borderRadius: 0 }} />
              </div>
              <div className="flex items-center gap-2">
                {/* Sort filter */}
                <div className="relative">
                  <button onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="h-10 px-3 border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center gap-1"
                    style={{ borderRadius: 0 }}>
                    <Filter className="h-3.5 w-3.5" /><ChevronDown className="h-3 w-3" />
                  </button>
                  <AnimatePresence>
                    {showFilterDropdown && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-11 w-40 bg-white border border-[#111111] shadow-lg z-50">
                        {(["newest", "oldest"] as const).map(opt => (
                          <button key={opt} onClick={() => { setSortMode(opt); setShowFilterDropdown(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors ${sortMode === opt ? "bg-[#111111] text-[#F9F9F7]" : "text-[#111111] hover:bg-neutral-50"}`}
                            style={{ ...sans, borderRadius: 0 }}>
                            {{ newest: "Newest First", oldest: "Oldest First" }[opt]}
                            {sortMode === opt && <Check className="h-3 w-3" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Refresh */}
                <button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}
                  className="h-10 w-10 border border-[#111111] bg-white flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all disabled:opacity-50"
                  style={{ borderRadius: 0 }}>
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                </button>
                {/* Settings */}
                <div className="relative">
                  <button onClick={() => setShowSettings(!showSettings)}
                    className="h-10 w-10 border border-[#111111] bg-white flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
                    style={{ borderRadius: 0 }}>
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-11 w-52 bg-white border border-[#111111] p-4 z-50 shadow-lg">
                        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 mb-3" style={mono}>Articles per page</p>
                        <div className="flex gap-1.5">
                          {ARTICLES_PER_PAGE_OPTIONS.map(n => (
                            <button key={n} onClick={() => { setArticlesPerPage(n); setDisplayCount(n); localStorage.setItem("newslab_perPage", String(n)); setShowSettings(false); }}
                              className={`flex-1 py-2 text-xs font-bold transition-colors border ${articlesPerPage === n ? "bg-[#111111] text-[#F9F9F7] border-[#111111]" : "border-[#E5E5E0] text-neutral-500 hover:border-[#111111] hover:text-[#111111]"}`}
                              style={{ ...mono, borderRadius: 0 }}>{n}</button>
                          ))}
                        </div>
                        <p className="text-[9px] text-neutral-400 mt-2" style={mono}>Auto-loads more as you scroll</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* View toggle */}
                <div className="flex border border-[#111111] overflow-hidden">
                  {([{ mode: "list" as const, icon: List }, { mode: "grid" as const, icon: LayoutGrid }]).map(({ mode, icon: Icon }) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      className={`h-10 w-10 flex items-center justify-center transition-colors ${viewMode === mode ? "bg-[#111111] text-[#F9F9F7]" : "bg-white text-[#111111] hover:bg-neutral-50"}`}
                      style={{ borderRadius: 0 }}>
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile topics pill strip */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
              {topics.map(t => {
                const active = t === "All" ? isAllSelected : activeTopics.includes(t);
                return (
                  <button key={t} onClick={() => toggleTopic(t)}
                    className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] border transition-all ${active ? "bg-[#111111] text-[#F9F9F7] border-[#111111]" : "border-[#E5E5E0] text-neutral-500 hover:border-[#111111] hover:text-[#111111]"}`}
                    style={{ ...sans, borderRadius: 0 }}>{t}</button>
                );
              })}
            </div>

            {/* Digest header */}
            <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E0] pb-3">
              <h2 className="text-lg font-black text-[#111111] flex items-center gap-2" style={serif}>
                <Sparkles className="h-4 w-4 text-[#CC0000]" /> Live Feed
              </h2>
              <span className="text-[10px] text-neutral-400" style={mono}>Showing {paginatedArticles.length} of {filtered.length}</span>
            </div>

            {/* Article cards */}
            <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-px border border-[#111111] bg-[#111111]" : "border border-[#111111] divide-y divide-[#E5E5E0]"}>
              {isLoading ? (
                <div className="col-span-2 min-h-[50vh] flex flex-col items-center justify-center p-8 bg-[#F9F9F7] relative border-b border-[#111111] overflow-hidden">
                  <motion.div
                    className="absolute inset-0 pointer-events-none opacity-50"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, #e5e5e0 25%, transparent 25%, transparent 75%, #e5e5e0 75%, #e5e5e0), repeating-linear-gradient(45deg, #e5e5e0 25%, transparent 25%, transparent 75%, #e5e5e0 75%, #e5e5e0)`,
                      backgroundPosition: `0 0, 4px 4px`,
                      backgroundSize: `8px 8px`,
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center bg-[#F9F9F7] p-8 border-2 border-[#111111] shadow-[4px_4px_0_0_#111111]">
                    <div className="flex gap-1.5 mb-6">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            scaleY: [1, 2.5, 1],
                            backgroundColor: ["#111111", "#CC0000", "#111111"]
                          }}
                          transition={{ 
                            duration: 1.2, 
                            repeat: Infinity, 
                            delay: i * 0.15,
                            ease: "easeInOut" 
                          }}
                          className="w-3 h-8 bg-[#111111]"
                          style={{ originY: 1 }}
                        />
                      ))}
                    </div>
                    <motion.div 
                      animate={{ opacity: [1, 0.4, 1] }} 
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="bg-[#111111] text-[#F9F9F7] px-4 py-2 font-black uppercase text-sm tracking-[0.3em]"
                      style={mono}
                    >
                      Curating Feed...
                    </motion.div>
                    <p className="mt-4 text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold" style={mono}>
                      Parsing latest intelligence
                    </p>
                  </div>
                </div>
              ) : isError ? (
                <div className="col-span-2 text-center py-20 border-l-4 border-[#CC0000] pl-4 ml-4">
                  <p className="text-sm font-bold text-[#CC0000]" style={serif}>Failed to load articles.</p>
                  <p className="text-xs text-neutral-500 mt-2 font-mono">{error instanceof Error ? error.message : "Unknown error"}</p>
                </div>
              ) : (
                <>
                  {paginatedArticles.map((article: any, i: number) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.4) }}
                      onClick={() => setSelectedArticle(article)}
                      className={`bg-[#F9F9F7] cursor-pointer group transition-colors hover:bg-white ${viewMode === "list" ? "px-5 py-4" : "p-4"}`}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {article.categorizing ? (
                          <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-1" style={mono}><Loader2 className="h-2.5 w-2.5 animate-spin" /> Categorizing</span>
                        ) : (
                          <NpChip active>{article.topic || "News"}</NpChip>
                        )}
                        {article.pubDate && <span className="text-[9px] text-neutral-400" style={mono}>· {timeAgo(article.pubDate)}</span>}
                        <span className="ml-auto text-[9px] text-neutral-400 truncate max-w-[120px]" style={mono}>{article.source}</span>
                      </div>
                      <h3 className="font-bold text-[#111111] group-hover:text-[#CC0000] transition-colors mb-1 leading-snug" style={serif}>{article.title}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 mb-3" style={bodyFont}>{article.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] text-neutral-400">
                          <button onClick={e => handleLike(e, article)} className={`flex items-center gap-1 transition-all ${isLiked(article.id) ? "text-[#CC0000]" : "hover:text-[#CC0000]"}`} style={mono}>
                            <Heart className={`h-3.5 w-3.5 ${isLiked(article.id) ? "fill-current" : ""}`} />
                          </button>
                          <button onClick={e => handleShare(e, article)} className="flex items-center gap-1 hover:text-[#111111] transition-colors" style={mono}>
                            <Share2 className="h-3 w-3" /> Share
                          </button>
                          <button onClick={e => handleSave(e, article)} className={`flex items-center gap-1 transition-all ${isSaved(article.id) ? "text-[#111111]" : "hover:text-[#111111]"}`} style={mono}>
                            <Bookmark className={`h-3.5 w-3.5 ${isSaved(article.id) ? "fill-current" : ""}`} /> {isSaved(article.id) ? "Saved" : "Save"}
                          </button>
                        </div>
                        <div className="flex items-center text-[10px] text-[#CC0000] font-bold uppercase tracking-[0.12em] opacity-0 group-hover:opacity-100 transition-opacity" style={mono}>
                          Read <ChevronRight className="h-3 w-3 ml-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {hasMore && (
                    <div className={`col-span-2 text-center py-5 ${viewMode === "grid" ? "bg-[#F9F9F7]" : ""}`}>
                      <div className="flex items-center justify-center gap-2 text-xs text-neutral-400" style={mono}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#CC0000]" /> Scroll for more…
                      </div>
                    </div>
                  )}
                  {filtered.length === 0 && (
                    <div className={`col-span-2 text-center py-20 text-neutral-400 text-sm ${viewMode === "grid" ? "bg-[#F9F9F7]" : ""}`} style={bodyFont}>
                      {searchQuery ? "No articles match your search." : "No articles found. Try different topics or refresh."}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Insights */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 border border-[#111111]">
              <div className="px-6 py-3.5 border-b border-[#111111]">
                <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500 flex items-center gap-2" style={mono}><Zap className="h-3 w-3 text-[#CC0000]" /> Quick Insights from Today</p>
              </div>
              <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E0] bg-white">
                {[
                  { label: "Top Trend", value: insightsData?.topTrend?.name || "Loading…", sub: `Mentioned in ${insightsData?.topTrend?.count || "—"} articles` },
                  { label: "Most Read Topic", value: insightsData?.mostReadTopic?.name || "Loading…", sub: `${insightsData?.mostReadTopic?.percentage || "—"}% of feed` },
                  { label: "Emerging", value: insightsData?.emerging?.name || "Loading…", sub: `↑ ${insightsData?.emerging?.growth || "—"} interest` },
                ].map(ins => (
                  <div key={ins.label} className="px-6 py-5">
                    <p className="text-[9px] uppercase tracking-[0.22em] text-[#CC0000] mb-1 font-bold" style={mono}>{ins.label}</p>
                    <p className="text-base font-black text-[#111111] leading-tight" style={serif}>{ins.value}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5" style={mono}>{ins.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </main>
        </div>
      </div>

      {/* ── Article Detail Modal ── */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#111111]/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedArticle(null)}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#F9F9F7] border-2 border-[#111111] max-w-lg w-full max-h-[85vh] overflow-y-auto"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")` }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#111111]">
                <div className="flex items-center gap-2">
                  <NpChip active>{selectedArticle.topic}</NpChip>
                  <span className="text-[9px] text-neutral-400" style={mono}>{selectedArticle.source}</span>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="text-neutral-400 hover:text-[#111111] transition-colors" style={{ borderRadius: 0 }}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-5">
                <h2 className="text-2xl font-black text-[#111111] leading-tight" style={serif}>{selectedArticle.title}</h2>

                <div className="border-t border-[#E5E5E0] pt-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1.5 mb-3" style={mono}><Sparkles className="h-3 w-3 text-[#CC0000]" /> AI Summary</p>
                  {selectedArticle.summary === "Click to analyze" ? (
                    <div className="space-y-3">
                      {isAnalyzing ? (
                        <>
                          <div className="text-sm text-neutral-500 flex items-center gap-2" style={bodyFont}><Loader2 className="h-4 w-4 animate-spin text-[#CC0000]" /> Analyzing with AI…</div>
                          <div className="space-y-2 animate-pulse">{[1, 5 / 6, 4 / 6].map(w => <div key={w} className="h-3 rounded bg-neutral-200" style={{ width: `${w * 100}%` }} />)}</div>
                        </>
                      ) : aiCooldownLeft > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-neutral-500 flex items-center gap-2" style={bodyFont}><Clock className="h-4 w-4 text-amber-500" /> AI cooldown — {Math.ceil(aiCooldownLeft / 1000)}s remaining</div>
                          <div className="w-full h-1 bg-neutral-200 overflow-hidden">
                            <motion.div className="h-full bg-amber-400" initial={{ width: "100%" }} animate={{ width: `${(aiCooldownLeft / AI_COOLDOWN_MS) * 100}%` }} transition={{ duration: 1, ease: "linear" }} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500 flex items-center gap-2" style={bodyFont}><Loader2 className="h-4 w-4 animate-spin text-[#CC0000]" /> Analyzing…</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600 leading-relaxed" style={bodyFont}>{selectedArticle.summary}</p>
                  )}
                </div>

                {selectedArticle.summary !== "Click to analyze" && (
                  <>
                    <div className="border-t border-[#E5E5E0] pt-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1.5 mb-3" style={mono}><BookOpen className="h-3 w-3 text-[#CC0000]" /> Key Insights</p>
                      <ul className="space-y-1.5">
                        {selectedArticle.insights.map((ins, i) => (
                          <li key={i} className="text-sm text-neutral-600 flex items-start gap-2" style={bodyFont}>
                            <span className="w-1.5 h-1.5 bg-[#CC0000] mt-1.5 shrink-0" />{ins}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t border-[#E5E5E0] pt-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 mb-2" style={mono}>Why This Matters</p>
                      <p className="text-sm text-neutral-600 leading-relaxed" style={bodyFont}>{selectedArticle.why}</p>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#111111]">
                  <div className="flex items-center gap-4">
                    {[
                      { label: "Like", icon: Heart, active: isLiked(selectedArticle.id), filled: true, onClick: (e: any) => handleLike(e, selectedArticle), color: "#CC0000" },
                      { label: isSaved(selectedArticle.id) ? "Saved" : "Save", icon: Bookmark, active: isSaved(selectedArticle.id), filled: true, onClick: (e: any) => handleSave(e, selectedArticle), color: "#111111" },
                      { label: "Share", icon: Share2, active: false, filled: false, onClick: (e: any) => handleShare(e, selectedArticle), color: "#111111" },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.onClick}
                        className={`flex items-center gap-1.5 text-[10px] transition-all ${btn.active ? `font-bold` : "text-neutral-400 hover:text-[#111111]"}`}
                        style={{ ...mono, color: btn.active ? btn.color : undefined }}>
                        <btn.icon className={`h-3.5 w-3.5 ${btn.active && btn.filled ? "fill-current" : ""}`} />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111] hover:text-[#CC0000] transition-colors border-b border-[#111111] hover:border-[#CC0000] pb-0.5"
                    style={mono}>
                    Read original <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
