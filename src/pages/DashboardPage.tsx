import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Clock, Sparkles, X, ExternalLink, Flame, Hash,
  ChevronRight, BarChart3, Bookmark, Bell, Search,
  Zap, Filter, List, LayoutGrid,
  Share2, RefreshCw, Heart, Check, ChevronDown, Loader2, Settings, HelpCircle, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const topics = ["All", "Technology", "Business & Finance", "World Affairs", "Science & Space", "Health", "Sports", "Entertainment", "Climate & Environment", "General", "Uncategorized"];

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFeed, triggerRefresh, analyzeArticle, Article, api,
  getUserStats, likeArticle, saveArticle, recordRead,
  getUserInteractions, getInsights,
  getSavedArticles, getNotifications, markAllNotificationsRead,
  getNotificationLogs, NotificationLogEntry
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { AIChat } from "../components/AIChat";

/* ── Style tokens ──────────────────────────────────────────────────── */
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const serif = { fontFamily: "'Playfair Display', serif" };
const bodyFont = { fontFamily: "'Lora', serif" };
const sans = { fontFamily: "'Inter', sans-serif" };

/* ── Types ─────────────────────────────────────────────────────────── */
type SortMode = "newest" | "oldest";
type SummaryMode = "concise" | "balanced" | "detailed";
const ARTICLES_PER_PAGE_OPTIONS = [15, 30, 50];
const DEFAULT_PER_PAGE = 30;
const AI_COOLDOWN_MS = 30000;
const SUMMARY_MODE_LABELS: Record<SummaryMode, string> = { concise: "Concise", balanced: "Balanced", detailed: "Detailed" };

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
      className={`text-[9px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 border ${active ? "border-editorial-red text-editorial-red" : "border-divider-grey text-neutral-500"}`}
      style={mono}
    >
      {children}
    </span>
  );
}

/* ── Tooltip \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function NpTooltip({ children, tip, detail }: { children: React.ReactNode; tip: string; detail?: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span
          className="absolute bottom-full left-0 mb-2 z-[9999] w-60 bg-paper text-ink border border-ink text-[9px] px-3 py-2.5 leading-relaxed pointer-events-none"
          style={{ ...mono, boxShadow: '2px 2px 0 #CC0000' }}
        >
          <span className="block font-black text-[10px] mb-1 tracking-[0.1em] uppercase text-editorial-red">{tip}</span>
          {detail && <span className="block opacity-80 leading-[1.6]">{detail}</span>}
        </span>
      )}
    </span>
  );
}

/* ── NLP Badge Components \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function NpSentimentBadge({ sentiment, signals }: { sentiment?: string; signals?: string[] }) {
  if (!sentiment) return null;
  const cfg: Record<string, { dot: string; label: string; classes: string }> = {
    Positive: { dot: 'bg-emerald-500', label: 'Positive', classes: 'text-emerald-700 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' },
    Neutral:  { dot: 'bg-neutral-400', label: 'Neutral',  classes: 'text-neutral-600 border-neutral-300 bg-neutral-50' },
    Negative: { dot: 'bg-editorial-red', label: 'Negative', classes: 'text-editorial-red border-red-300 bg-red-50 dark:bg-red-950/20' },
  };
  const c = cfg[sentiment];
  if (!c) return null;
  const signalText = signals && signals.length > 0
    ? `Key signals: ${signals.join(', ')}.`
    : 'Scored from positive/negative word patterns in the headline.';
  return (
    <NpTooltip tip="Sentiment" detail={`Detected tone: ${sentiment}. ${signalText}`}>
      <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border cursor-help ${c.classes}`} style={mono}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
        {c.label}
      </span>
    </NpTooltip>
  );
}

function NpTypeBadge({ type, signals }: { type?: string; signals?: string[] }) {
  if (!type || type === 'Factual') return null;
  const detail = signals && signals.length > 0
    ? `Opinion words found: ${signals.slice(0, 4).join(', ')}.`
    : 'Contains subjective or editorial language patterns.';
  return (
    <NpTooltip tip="Opinion Article" detail={`Classified as editorial/opinion content. ${detail}`}>
      <span className="text-[9px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border border-amber-500 text-amber-700 bg-amber-50 cursor-help" style={mono}>
        Opinion
      </span>
    </NpTooltip>
  );
}

function NpReliabilityBadge({ tier, score, signals }: { tier?: string; score?: number; signals?: string[] }) {
  if (!tier || score === undefined) return null;
  const cfg: Record<string, { classes: string; icon: string }> = {
    High:   { classes: 'text-emerald-700 border-emerald-500 bg-emerald-50', icon: '\u25a0' },
    Medium: { classes: 'text-amber-700 border-amber-500 bg-amber-50',       icon: '\u25c6' },
    Low:    { classes: 'text-editorial-red border-red-400 bg-red-50',        icon: '\u25b2' },
  };
  const c = cfg[tier] || { classes: 'text-neutral-500 border-divider-grey', icon: '?' };
  const signalText = signals && signals.length > 0
    ? signals.join('; ') + '.'
    : 'Based on source trust, language patterns, and factual indicators.';
  return (
    <NpTooltip tip={`Reliability: ${tier} (${score}/100)`} detail={`Credibility score from 0\u2013100. ${signalText}`}>
      <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border cursor-help ${c.classes}`} style={mono}>
        {c.icon} {score}
      </span>
    </NpTooltip>
  );
}

function NpConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === undefined) return null;
  const pct = Math.round(confidence * 100);
  return (
    <NpTooltip tip={`Model confidence: ${pct}%`} detail="The TF-IDF + Logistic Regression classifier's certainty about the assigned category. Above 70% is reliable.">
      <span className="text-[9px] font-bold tracking-[0.12em] text-neutral-400 border border-dashed border-neutral-300 px-1.5 py-0.5 cursor-help" style={mono}>
        {pct}%
      </span>
    </NpTooltip>
  );
}

export default function DashboardPage() {
  /* ── Data fetching ─────────────────────────────────────────────── */
  const { data: articles = [], isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    initialData: [],
    // Progressive streaming: poll aggressively when empty, slow down as articles arrive
    refetchInterval: (query) => {
      const count = (query.state.data as any[])?.length ?? 0;
      if (count === 0) return 2000;   // 2s when empty (feeds loading)
      if (count < 20) return 5000;    // 5s when streaming first batch
      return 15 * 60 * 1000;          // 15min when stable
    },
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
  const { data: notificationLogs } = useQuery({ queryKey: ["notification-logs"], queryFn: getNotificationLogs, enabled: isAuthenticated });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0;

  /* ── UI State ───────────────────────────────────────────────────── */
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTopics, setActiveTopics] = useState<string[]>(["All"]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [dashboardTab, setDashboardTab] = useState<"live" | "brief">("live");
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
  const [articleSummaryMode, setArticleSummaryMode] = useState<SummaryMode>("balanced");
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  /* Track the displayed analysis separately so mode-switch doesn't wipe article metadata */
  const [overrideAnalysis, setOverrideAnalysis] = useState<{ summary: string; insights: string[]; why: string; topic: string } | null>(null);

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
  const handleAnalyzeArticle = async (article: Article, mode?: SummaryMode) => {
    const now = Date.now();
    if (!mode && aiCooldownEnd > now) {
      const secs = Math.ceil((aiCooldownEnd - now) / 1000);
      if (!waitingForCooldown) toast.error(`AI cooling down — wait ${secs}s`, { duration: 3000 });
      setWaitingForCooldown(true); return;
    }
    if (mode) {
      // Per-article mode override — don't block on cooldown, show inline loader
      setIsReanalyzing(true);
      setOverrideAnalysis(null);
      try {
        const result = await analyzeArticle(article.id, mode, 'force');
        setOverrideAnalysis({ summary: result.summary, insights: result.insights, why: result.why, topic: result.topic });
      } catch {
        toast.error("Re-analysis failed. Try again.", { duration: 3000 });
      } finally {
        setIsReanalyzing(false);
      }
      return;
    }
    setIsAnalyzing(true); setWaitingForCooldown(false);
    try {
      const analyzed = await analyzeArticle(article.id);
      setSelectedArticle(analyzed);
      setOverrideAnalysis(null);
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
      setOverrideAnalysis(null);
      setArticleSummaryMode((user as any)?.summaryMode || "balanced");
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
    <div className="min-h-screen bg-paper pb-20"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")` }}>
      <div className="max-w-7xl mx-auto px-4 pt-20">

        {/* ── Masthead ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b-2 border-ink pb-5 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-editorial-red mb-1" style={mono}>{dateStr}</p>
            <h1 className="text-4xl font-black text-ink leading-tight" style={serif}>
              {greeting}, {user?.name?.split(" ")[0] || "Reader"}.
            </h1>
            <p className="text-xs text-neutral-500 mt-1" style={mono}>{safeArticles.length} articles in your feed today</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 border border-ink flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-all"
                style={{ borderRadius: 0 }}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-editorial-red text-white text-[8px] flex items-center justify-center font-bold">{unreadCount}</span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-11 w-72 bg-paper border border-ink shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-divider-grey">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500" style={mono}>Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={() => markAllReadMutation.mutate()} className="text-[9px] text-editorial-red hover:underline font-bold uppercase tracking-[0.1em]" style={mono}>Mark all read</button>
                      )}
                    </div>
                    {Array.isArray(notifications) && notifications.length > 0 ? notifications.slice(0, 10).map((n: any) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-divider-grey text-xs ${n.read ? "text-neutral-400" : "text-ink bg-red-50/30"}`}>
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
              className="h-9 w-9 border-2 border-ink flex items-center justify-center text-xs font-black text-ink hover:bg-ink hover:text-paper transition-all"
              style={{ ...serif, borderRadius: 0 }}>
              {user?.name?.[0] || "U"}
            </Link>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px mb-8 border border-ink bg-ink">
          {[
            { label: "Articles Read", value: stats?.totalReads ?? 0, sub: `${stats?.thisWeek ?? 0} this week`, icon: BookOpen },
            { label: "Reading Streak", value: `${stats?.streak ?? 0}d`, sub: `Best: ${stats?.longestStreak ?? 0}d`, icon: Flame },
            { label: "Saved Articles", value: stats?.totalSaved ?? 0, sub: `${stats?.totalLiked ?? 0} liked`, icon: Bookmark },
            { label: "Daily Read Time", value: stats?.avgReadTime || "0 min", sub: `${stats?.loginDays ?? 0} days active`, icon: Clock },
          ].map(stat => (
            <div key={stat.label} className="bg-paper px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-3.5 w-3.5 text-editorial-red" />
                <span className="text-[9px] text-neutral-400" style={mono}>{stat.sub}</span>
              </div>
              <p className="text-2xl font-black text-ink" style={serif}>{stat.value}</p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 mt-0.5" style={mono}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="border border-ink bg-paper sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {/* Topics */}
              <div className="px-4 py-3 border-b border-ink">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500" style={mono}>Your Topics</p>
              </div>
              <div className="py-1">
                {topics.map(t => {
                  const active = t === "All" ? isAllSelected : activeTopics.includes(t);
                  return (
                    <button key={t} onClick={() => toggleTopic(t)}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors ${active ? "bg-ink text-paper" : "text-ink/80 hover:bg-ink/5 hover:text-ink"}`}
                      style={{ ...sans, borderRadius: 0 }}>
                      <span className="flex items-center gap-1.5">
                        {t === "All" ? "All" : <><Hash className="h-3 w-3 shrink-0" />{t}</>}
                      </span>
                      {active && <span className="h-1.5 w-1.5 bg-editorial-red shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Saved */}
              <div className="border-t border-ink">
                <div className="px-4 py-3 border-b border-divider-grey">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1.5" style={mono}><Bookmark className="h-3 w-3" /> Saved</p>
                </div>
                <div className="py-1">
                  {Array.isArray(savedArticlesList) && savedArticlesList.length > 0 ? savedArticlesList.slice(0, 5).map((a: any) => (
                    <div key={a.id || a.title} className="group flex items-center gap-2 px-4 py-2 hover:bg-ink/5 transition-colors">
                      <a href={a.link || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                        <p className="text-xs text-ink line-clamp-1 font-medium" style={sans}>{a.title || <span className="italic text-neutral-400">Untitled</span>}</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5" style={mono}>{a.source || "Unknown"}</p>
                      </a>
                      <button onClick={() => saveMutation.mutate({ id: a.id, data: {} })} className="shrink-0 p-1 text-neutral-400 hover:text-editorial-red opacity-0 group-hover:opacity-100 transition-all" style={{ borderRadius: 0 }}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )) : <p className="text-[10px] text-neutral-400 px-4 py-3" style={mono}>No saved articles yet</p>}
                </div>
              </div>

              {/* Weekly chart */}
              <div className="border-t border-ink">
                <div className="px-4 py-3 border-b border-divider-grey">
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
                          <span className="text-[9px] font-bold text-ink bg-paper border border-divider-grey px-1 py-0.5 whitespace-nowrap" style={mono}>{d.count}</span>
                        </div>
                        <motion.div
                          initial={{ height: 2 }}
                          animate={{ height: `${Math.max(2, (d.count / maxCount) * 36)}px` }}
                          className="w-full bg-ink hover:bg-editorial-red transition-colors cursor-pointer"
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
                  className="w-full pl-9 pr-3 py-2.5 bg-paper border border-ink text-sm text-ink placeholder:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-ink transition"
                  style={{ ...sans, borderRadius: 0 }} />
              </div>
              <div className="flex items-center gap-2">
                {/* Sort filter */}
                <div className="relative">
                  <button onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="h-10 px-3 border border-ink bg-paper text-ink hover:bg-ink hover:text-paper transition-all flex items-center gap-1"
                    style={{ borderRadius: 0 }}>
                    <Filter className="h-3.5 w-3.5" /><ChevronDown className="h-3 w-3" />
                  </button>
                  <AnimatePresence>
                    {showFilterDropdown && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-11 w-40 bg-paper border border-ink shadow-lg z-50">
                        {(["newest", "oldest"] as const).map(opt => (
                          <button key={opt} onClick={() => { setSortMode(opt); setShowFilterDropdown(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors ${sortMode === opt ? "bg-ink text-paper" : "text-ink hover:bg-ink/5"}`}
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
                  className="h-10 w-10 border border-ink bg-paper flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-all disabled:opacity-50"
                  style={{ borderRadius: 0 }}>
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                </button>
                {/* Settings */}
                <div className="relative">
                  <button onClick={() => setShowSettings(!showSettings)}
                    className="h-10 w-10 border border-ink bg-paper flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-all"
                    style={{ borderRadius: 0 }}>
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-11 w-52 bg-paper border border-ink p-4 z-50 shadow-lg">
                        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 mb-3" style={mono}>Articles per page</p>
                        <div className="flex gap-1.5">
                          {ARTICLES_PER_PAGE_OPTIONS.map(n => (
                            <button key={n} onClick={() => { setArticlesPerPage(n); setDisplayCount(n); localStorage.setItem("newslab_perPage", String(n)); setShowSettings(false); }}
                              className={`flex-1 py-2 text-xs font-bold transition-colors border ${articlesPerPage === n ? "bg-ink text-paper border-ink" : "border-divider-grey text-neutral-500 hover:border-ink hover:text-ink"}`}
                              style={{ ...mono, borderRadius: 0 }}>{n}</button>
                          ))}
                        </div>
                        <p className="text-[9px] text-neutral-400 mt-2" style={mono}>Auto-loads more as you scroll</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* View toggle */}
                <div className="flex border border-ink overflow-hidden">
                  {([{ mode: "list" as const, icon: List }, { mode: "grid" as const, icon: LayoutGrid }]).map(({ mode, icon: Icon }) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      className={`h-10 w-10 flex items-center justify-center transition-colors ${viewMode === mode ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-ink/5"}`}
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
                    className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] border transition-all ${active ? "bg-ink text-paper border-ink" : "border-divider-grey text-neutral-500 hover:border-ink hover:text-ink"}`}
                    style={{ ...sans, borderRadius: 0 }}>{t}</button>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 mb-4 border-b border-divider-grey">
              <button onClick={() => setDashboardTab("live")}
                className={`pb-3 text-lg font-black flex items-center gap-2 border-b-2 transition-all ${dashboardTab === "live" ? "border-ink text-ink" : "border-transparent text-neutral-400 hover:text-ink"}`} style={serif}>
                <Sparkles className={`h-4 w-4 ${dashboardTab === "live" ? "text-editorial-red" : ""}`} /> Live Feed
              </button>
              <button onClick={() => setDashboardTab("brief")}
                className={`pb-3 text-lg font-black flex items-center gap-2 border-b-2 transition-all ${dashboardTab === "brief" ? "border-ink text-ink" : "border-transparent text-neutral-400 hover:text-ink"}`} style={serif}>
                <MessageSquare className={`h-4 w-4 ${dashboardTab === "brief" ? "text-editorial-red" : ""}`} /> Today's Brief
              </button>
              
              {dashboardTab === "live" && (
                <span className="ml-auto text-[10px] text-neutral-400 pb-3" style={mono}>Showing {paginatedArticles.length} of {filtered.length}</span>
              )}
            </div>

            {/* Content area */}
            {dashboardTab === "live" ? (
              <>

            {/* Article cards */}
            <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-px border border-ink bg-ink" : "border border-ink divide-y divide-divider-grey"}>
              {(isLoading || (isFetching && safeArticles.length === 0)) ? (
                <div className="col-span-2 min-h-[50vh] flex flex-col items-center justify-center p-8 bg-paper relative border-b border-ink overflow-hidden">
                  <motion.div
                    className="absolute inset-0 pointer-events-none opacity-50"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, #e5e5e0 25%, transparent 25%, transparent 75%, #e5e5e0 75%, #e5e5e0), repeating-linear-gradient(45deg, #e5e5e0 25%, transparent 25%, transparent 75%, #e5e5e0 75%, #e5e5e0)`,
                      backgroundPosition: `0 0, 4px 4px`,
                      backgroundSize: `8px 8px`,
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center bg-paper p-8 border-2 border-ink shadow-[4px_4px_0_0_hsl(var(--np-ink))]">
                    <div className="flex gap-1.5 mb-6">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scaleY: [1, 2.5, 1],
                            backgroundColor: ["hsl(var(--np-ink))", "hsl(var(--np-red))", "hsl(var(--np-ink))"]
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                          }}
                          className="w-3 h-8 bg-ink"
                          style={{ originY: 1 }}
                        />
                      ))}
                    </div>
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="bg-ink text-paper px-4 py-2 font-black uppercase text-sm tracking-[0.3em]"
                      style={mono}
                    >
                      Fetching Feeds...
                    </motion.div>
                    <p className="mt-4 text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold" style={mono}>
                      Articles will appear as each source loads
                    </p>
                  </div>
                </div>
              ) : isError ? (
                <div className="col-span-2 text-center py-20 border-l-4 border-editorial-red pl-4 ml-4">
                  <p className="text-sm font-bold text-editorial-red" style={serif}>Failed to load articles.</p>
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
                      className={`bg-paper cursor-pointer group transition-colors hover:bg-ink/5 ${viewMode === "list" ? "px-5 py-4" : "p-4"}`}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {article.categorizing ? (
                          <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-1" style={mono}><Loader2 className="h-2.5 w-2.5 animate-spin" /> Categorizing</span>
                        ) : (
                          <>
                            {/* Dual category: primaryCategory (super) › topic (sub from AI) */}
                            {article.primaryCategory && article.topic && article.topic !== article.primaryCategory ? (
                              <NpTooltip tip="Category hierarchy" detail={`Super-category from AI model: ${article.primaryCategory}. Sub-category from AI analysis: ${article.topic}.`}>
                                <span className="flex items-center gap-1 cursor-help">
                                  <NpChip active>{article.primaryCategory}</NpChip>
                                  <span className="text-[9px] text-neutral-400" style={mono}>›</span>
                                  <NpChip>{article.topic}</NpChip>
                                </span>
                              </NpTooltip>
                            ) : (
                              <NpChip active>{article.topic || "News"}</NpChip>
                            )}
                          </>
                        )}
                        <NpChip>{article.sourceType === "user" ? "User Feed" : "System Feed"}</NpChip>
                        {article.pubDate && <span className="text-[9px] text-neutral-400" style={mono}>· {timeAgo(article.pubDate)}</span>}
                        <span className="ml-auto text-[9px] text-neutral-400 truncate max-w-[120px]" style={mono}>{article.source}</span>
                      </div>
                      {/* NLP badges row */}
                      {(article.sentiment || article.articleType === 'Opinion' || article.reliabilityTier) && (
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <NpSentimentBadge sentiment={article.sentiment} signals={article.sentimentSignals} />
                          <NpTypeBadge type={article.articleType} signals={article.opinionSignals} />
                          <NpReliabilityBadge tier={article.reliabilityTier} score={article.reliability} signals={article.reliabilitySignals} />
                        </div>
                      )}
                      <h3 className="font-bold text-ink group-hover:text-editorial-red transition-colors mb-1 leading-snug" style={serif}>{article.title}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 mb-3" style={bodyFont}>{article.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] text-neutral-400">
                          <button onClick={e => handleLike(e, article)} className={`flex items-center gap-1 transition-all ${isLiked(article.id) ? "text-editorial-red" : "hover:text-editorial-red"}`} style={mono}>
                            <Heart className={`h-3.5 w-3.5 ${isLiked(article.id) ? "fill-current" : ""}`} />
                          </button>
                          <button onClick={e => handleShare(e, article)} className="flex items-center gap-1 hover:text-ink transition-colors" style={mono}>
                            <Share2 className="h-3 w-3" /> Share
                          </button>
                          <button onClick={e => handleSave(e, article)} className={`flex items-center gap-1 transition-all ${isSaved(article.id) ? "text-ink" : "hover:text-ink"}`} style={mono}>
                            <Bookmark className={`h-3.5 w-3.5 ${isSaved(article.id) ? "fill-current" : ""}`} /> {isSaved(article.id) ? "Saved" : "Save"}
                          </button>
                        </div>
                        <div className="flex items-center text-[10px] text-editorial-red font-bold uppercase tracking-[0.12em] opacity-0 group-hover:opacity-100 transition-opacity" style={mono}>
                          Read <ChevronRight className="h-3 w-3 ml-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {hasMore && (
                    <div className={`col-span-2 text-center py-5 ${viewMode === "grid" ? "bg-paper" : ""}`}>
                      <div className="flex items-center justify-center gap-2 text-xs text-neutral-400" style={mono}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-editorial-red" /> Scroll for more…
                      </div>
                    </div>
                  )}
                  {filtered.length === 0 && (
                    <div className={`col-span-2 text-center py-20 text-neutral-400 text-sm ${viewMode === "grid" ? "bg-paper" : ""}`} style={bodyFont}>
                      {searchQuery ? "No articles match your search." : "No articles found. Try different topics or refresh."}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Insights */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 border border-ink">
              <div className="px-6 py-3.5 border-b border-ink">
                <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500 flex items-center gap-2" style={mono}><Zap className="h-3 w-3 text-editorial-red" /> Quick Insights from Today</p>
              </div>
              <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-divider-grey bg-paper">
                {[
                  { label: "Top Trend", value: insightsData?.topTrend?.name || "Loading…", sub: `Mentioned in ${insightsData?.topTrend?.count || "—"} articles` },
                  { label: "Most Read Topic", value: insightsData?.mostReadTopic?.name || "Loading…", sub: `${insightsData?.mostReadTopic?.percentage || "—"}% of feed` },
                  { label: "Emerging", value: insightsData?.emerging?.name || "Loading…", sub: `↑ ${insightsData?.emerging?.growth || "—"} interest` },
                ].map(ins => (
                  <div key={ins.label} className="px-6 py-5">
                    <p className="text-[9px] uppercase tracking-[0.22em] text-editorial-red mb-1 font-bold" style={mono}>{ins.label}</p>
                    <p className="text-base font-black text-ink leading-tight" style={serif}>{ins.value}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5" style={mono}>{ins.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            </>
            ) : (
              <div className="space-y-8">
                {(!notificationLogs?.logs || notificationLogs.logs.length === 0) ? (
                  <div className="text-center py-20 border border-ink bg-paper">
                    <MessageSquare className="h-8 w-8 text-neutral-300 mx-auto mb-4" />
                    <p className="text-base font-bold text-ink" style={serif}>Your first brief hasn't arrived yet</p>
                    <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto" style={bodyFont}>
                      We'll deliver your curated news at your scheduled times. You can manage your delivery schedule in your Profile.
                    </p>
                    <Link to="/profile" className="inline-block mt-6 px-6 py-2.5 bg-ink text-paper text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#333] transition-colors" style={sans}>
                      Manage Schedule
                    </Link>
                  </div>
                ) : (
                  notificationLogs.logs.map((log, logIdx) => {
                    // Parse slotLabel into display parts
                    const isInstant = log.slot === 'instant';
                    const labelParts = log.slotLabel.split('—');
                    const headlineLabel = labelParts[0]?.trim().replace(/^⚡\s*/, '') || 'Brief';
                    const timeLabel = labelParts[1]?.trim() || (isInstant ? new Date(log.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST' : '');

                    return (
                      <div key={logIdx} className="border-2 border-ink bg-paper shadow-[4px_4px_0_0_hsl(var(--np-ink))]">
                        {/* Batch Header */}
                        <div className="px-6 py-5 border-b-2 border-ink text-center bg-ink/5 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(hsl(var(--np-ink)) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-editorial-red mb-2 relative z-10" style={mono}>
                            {isInstant ? 'On-Demand Delivery' : timeLabel}
                          </p>
                          <h3 className="text-3xl font-black text-ink uppercase tracking-tight relative z-10" style={serif}>
                            {isInstant ? '⚡ Instant Brief' : headlineLabel}
                          </h3>
                          <div className="mt-3 flex items-center justify-center gap-4 relative z-10">
                            <span className="text-[9px] text-neutral-400 uppercase tracking-[0.15em]" style={mono}>
                              {new Date(log.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST
                              {' · '}{log.articleTitles.length} articles
                            </span>
                            <span className="flex items-center gap-2" style={mono}>
                              {log.platforms.map((p, i) => (
                                <span key={i} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.1em] ${p.success ? 'text-[#10B981]' : 'text-editorial-red'}`}>
                                  {p.success ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
                                  {p.platform}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>

                        {/* Article Rows — same style as Live Feed list items */}
                        <div className="divide-y divide-divider-grey">
                          {log.articleTitles.map((title, idx) => {
                            const articleId = log.articleIds?.[idx];
                            // Build a minimal Article object to open the existing modal
                            const briefArticle: Article = {
                              id: articleId || `brief-${logIdx}-${idx}`,
                              title,
                              link: log.articleLinks[idx] || '',
                              source: log.articleSources[idx] || '',
                              topic: log.articleTopics[idx] || 'News',
                              summary: 'Click to analyze',
                              why: '',
                              insights: [],
                              pubDate: log.sentAt,
                            };
                            const liked = articleId ? isLiked(articleId) : false;
                            const saved = articleId ? isSaved(articleId) : false;

                            return (
                              <div key={idx}
                                className="group flex gap-4 px-5 py-4 hover:bg-ink/5 transition-colors cursor-pointer"
                                onClick={() => { setSelectedArticle(briefArticle); }}
                              >
                                {/* Number */}
                                <span className="text-base font-black text-neutral-300 group-hover:text-editorial-red transition-colors w-6 text-right shrink-0 pt-0.5" style={serif}>
                                  {idx + 1}.
                                </span>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-ink leading-snug group-hover:underline decoration-ink underline-offset-2 mb-1.5" style={serif}>
                                    {title}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-editorial-red border border-editorial-red px-1.5 py-0.5" style={mono}>
                                      {log.articleTopics[idx]}
                                    </span>
                                    <span className="text-[10px] text-neutral-500" style={mono}>· {log.articleSources[idx]}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={e => { e.stopPropagation(); handleLike(e, briefArticle); }}
                                    className={`p-1.5 rounded-sm transition-colors ${liked ? 'text-editorial-red' : 'text-neutral-400 hover:text-editorial-red'}`}
                                    title="Like"
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-editorial-red' : ''}`} />
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); handleSave(e, briefArticle); }}
                                    className={`p-1.5 rounded-sm transition-colors ${saved ? 'text-ink' : 'text-neutral-400 hover:text-ink'}`}
                                    title="Save"
                                  >
                                    <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-ink' : ''}`} />
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); handleShare(e, briefArticle); }}
                                    className="p-1.5 text-neutral-400 hover:text-ink transition-colors rounded-sm"
                                    title="Share"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setSelectedArticle(briefArticle); }}
                                    className="ml-1 px-2 py-1 bg-ink text-paper text-[8px] font-bold uppercase tracking-[0.15em] hover:bg-editorial-red transition-colors flex items-center gap-1"
                                    style={mono}
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Analyze
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer — selection reason */}
                        <div className="px-6 py-3 border-t border-divider-grey bg-ink/5">
                          <p className="text-[9px] text-neutral-400 leading-relaxed" style={mono}>
                            <span className="font-bold text-neutral-600 uppercase tracking-[0.1em]">Selection: </span>
                            {log.selectionReason}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Article Detail Modal ── */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedArticle(null)}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-paper border-2 border-ink max-w-lg w-full max-h-[85vh] overflow-y-auto"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")` }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-ink">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Dual category: broad ML category › fine-grained AI category */}
                  {selectedArticle.primaryCategory && (overrideAnalysis?.topic || selectedArticle.topic) && (overrideAnalysis?.topic || selectedArticle.topic) !== selectedArticle.primaryCategory ? (
                    <NpTooltip tip="Category hierarchy" detail={`Broad category (ML model): ${selectedArticle.primaryCategory}. Fine-grained (AI analysis): ${overrideAnalysis?.topic || selectedArticle.topic}.`}>
                      <span className="flex items-center gap-1 cursor-help">
                        <NpChip active>{selectedArticle.primaryCategory}</NpChip>
                        <span className="text-[9px] text-neutral-400" style={mono}>›</span>
                        <NpChip>{overrideAnalysis?.topic || selectedArticle.topic}</NpChip>
                      </span>
                    </NpTooltip>
                  ) : (
                    <NpChip active>{overrideAnalysis?.topic || selectedArticle.topic}</NpChip>
                  )}
                  <NpChip>{selectedArticle.sourceType === "user" ? "User Feed" : "System Feed"}</NpChip>
                  <span className="text-[9px] text-neutral-400" style={mono}>{selectedArticle.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Summary mode switcher — only visible after analysis */}
                  {selectedArticle.summary !== "Click to analyze" && (
                    <div className="flex border border-divider-grey overflow-hidden">
                      {(["concise", "balanced", "detailed"] as SummaryMode[]).map(m => (
                        <button key={m}
                          onClick={() => {
                            if (m === articleSummaryMode) return;
                            setArticleSummaryMode(m);
                            handleAnalyzeArticle(selectedArticle, m);
                          }}
                          className={`px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors ${articleSummaryMode === m ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-ink hover:text-paper"}`}
                          style={{ ...mono, borderRadius: 0 }}>
                          {SUMMARY_MODE_LABELS[m]}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setSelectedArticle(null)} className="text-neutral-400 hover:text-ink transition-colors" style={{ borderRadius: 0 }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                <h2 className="text-2xl font-black text-ink leading-tight" style={serif}>{selectedArticle.title}</h2>

                {/* NLP metadata row — with tooltips and visual prominence */}
                {(selectedArticle.sentiment || selectedArticle.articleType === 'Opinion' || selectedArticle.reliabilityTier) && (
                  <div className="border border-divider-grey bg-ink/5 px-3 py-2.5 -mx-0">
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-2" style={mono}>AI Analysis</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <NpSentimentBadge sentiment={selectedArticle.sentiment} signals={selectedArticle.sentimentSignals} />
                      <NpTypeBadge type={selectedArticle.articleType} signals={selectedArticle.opinionSignals} />
                      <NpReliabilityBadge tier={selectedArticle.reliabilityTier} score={selectedArticle.reliability} signals={selectedArticle.reliabilitySignals} />
                      {selectedArticle.secondaryTags && selectedArticle.secondaryTags.length > 0 && (
                        <>
                          <span className="text-[9px] text-neutral-300 mx-0.5" style={mono}>·</span>
                          {selectedArticle.secondaryTags.map(tag => (
                            <NpTooltip key={tag} tip={`Sub-tag: ${tag}`} detail="Secondary topic tag derived from keyword analysis of the headline.">
                              <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 border border-divider-grey text-neutral-500 cursor-help" style={mono}>{tag}</span>
                            </NpTooltip>
                          ))}
                        </>
                      )}
                      <NpConfidenceBadge confidence={selectedArticle.classificationConfidence} />
                    </div>
                  </div>
                )}

                <div className="border-t border-divider-grey pt-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1.5 mb-3" style={mono}><Sparkles className="h-3 w-3 text-editorial-red" /> AI Summary</p>
                  {selectedArticle.summary === "Click to analyze" ? (
                    <div className="space-y-3">
                      {isAnalyzing ? (
                        <>
                          <div className="text-sm text-neutral-500 flex items-center gap-2" style={bodyFont}><Loader2 className="h-4 w-4 animate-spin text-editorial-red" /> Analyzing with AI…</div>
                          <div className="space-y-2 animate-pulse">{[1, 5 / 6, 4 / 6].map(w => <div key={w} className="h-3 rounded bg-divider-grey" style={{ width: `${w * 100}%` }} />)}</div>
                        </>
                      ) : aiCooldownLeft > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-neutral-500 flex items-center gap-2" style={bodyFont}><Clock className="h-4 w-4 text-amber-500" /> AI cooldown — {Math.ceil(aiCooldownLeft / 1000)}s remaining</div>
                          <div className="w-full h-1 bg-divider-grey overflow-hidden">
                            <motion.div className="h-full bg-amber-400" initial={{ width: "100%" }} animate={{ width: `${(aiCooldownLeft / AI_COOLDOWN_MS) * 100}%` }} transition={{ duration: 1, ease: "linear" }} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500 flex items-center gap-2" style={bodyFont}><Loader2 className="h-4 w-4 animate-spin text-editorial-red" /> Analyzing…</div>
                      )}
                    </div>
                  ) : isReanalyzing ? (
                    <div className="space-y-3">
                      <div className="text-sm text-neutral-500 flex items-center gap-2" style={bodyFont}><Loader2 className="h-4 w-4 animate-spin text-editorial-red" /> Generating {SUMMARY_MODE_LABELS[articleSummaryMode].toLowerCase()} summary…</div>
                      <div className="space-y-2 animate-pulse">{[1, 5 / 6, 4 / 6].map(w => <div key={w} className="h-3 rounded bg-divider-grey" style={{ width: `${w * 100}%` }} />)}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-ink/80 leading-relaxed" style={bodyFont}>{overrideAnalysis?.summary || selectedArticle.summary}</p>
                  )}
                </div>

                {selectedArticle.summary !== "Click to analyze" && !isReanalyzing && (
                  <>
                    <div className="border-t border-divider-grey pt-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1.5 mb-3" style={mono}><BookOpen className="h-3 w-3 text-editorial-red" /> Key Insights</p>
                      <ul className="space-y-1.5">
                        {(overrideAnalysis?.insights || selectedArticle.insights).map((ins, i) => (
                          <li key={i} className="text-sm text-ink/80 flex items-start gap-2" style={bodyFont}>
                            <span className="w-1.5 h-1.5 bg-editorial-red mt-1.5 shrink-0" />{ins}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t border-divider-grey pt-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500 mb-2" style={mono}>Why This Matters</p>
                      <p className="text-sm text-ink/80 leading-relaxed" style={bodyFont}>{overrideAnalysis?.why || selectedArticle.why}</p>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-ink">
                    <div className="flex items-center gap-4">
                      {[
                        { label: "Like", icon: Heart, active: isLiked(selectedArticle.id), filled: true, onClick: (e: any) => handleLike(e, selectedArticle), color: "hsl(var(--np-red))" },
                        { label: isSaved(selectedArticle.id) ? "Saved" : "Save", icon: Bookmark, active: isSaved(selectedArticle.id), filled: true, onClick: (e: any) => handleSave(e, selectedArticle), color: "hsl(var(--np-ink))" },
                        { label: "Share", icon: Share2, active: false, filled: false, onClick: (e: any) => handleShare(e, selectedArticle), color: "hsl(var(--np-ink))" },
                      ].map(btn => (
                      <button key={btn.label} onClick={btn.onClick}
                        className={`flex items-center gap-1.5 text-[10px] transition-all ${btn.active ? `font-bold` : "text-neutral-400 hover:text-ink"}`}
                        style={{ ...mono, color: btn.active ? btn.color : undefined }}>
                        <btn.icon className={`h-3.5 w-3.5 ${btn.active && btn.filled ? "fill-current" : ""}`} />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-ink hover:text-editorial-red transition-colors border-b border-ink hover:border-editorial-red pb-0.5"
                    style={mono}>
                    Read original <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AIChat />
    </div>
  );
}


