import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, BookOpen, Clock, Sparkles, X, ExternalLink, Flame, Hash,
  ChevronRight, BarChart3, Bookmark, Bell, Settings, Search, Calendar,
  Star, Eye, ArrowUpRight, PieChart, Zap, Filter, LayoutGrid, List,
  ThumbsUp, MessageSquare, Share2, MoreHorizontal, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";

const topics = ["AI & ML", "Web Dev", "Science", "Startups", "Crypto", "Design", "DevOps", "Security"];

const articles = [
  { id: 1, title: "The Rise of Small Language Models in Production", topic: "AI & ML", time: "3 min", summary: "Companies are increasingly deploying smaller, fine-tuned models for specific tasks rather than relying on massive general-purpose LLMs.", insights: ["Cost reduction of up to 90% vs large models", "Faster inference times enable real-time applications", "Fine-tuning on domain data yields superior results"], why: "Small models democratize AI access for startups and small teams.", source: "MIT Technology Review", likes: 142, comments: 38 },
  { id: 2, title: "Rust Adoption in Web Frameworks Accelerates", topic: "Web Dev", time: "4 min", summary: "Leptos and Dioxus gain momentum as Rust-based web frameworks mature, offering memory safety with competitive DX.", insights: ["Server-side rendering now on par with JS frameworks", "WASM compilation enables near-native performance", "Growing ecosystem of UI component libraries"], why: "Signals a shift toward systems-level languages in web development.", source: "The New Stack", likes: 98, comments: 24 },
  { id: 3, title: "CRISPR Gene Therapy Approved for Sickle Cell", topic: "Science", time: "5 min", summary: "The first CRISPR-based gene therapy receives full approval, marking a milestone in genetic medicine.", insights: ["One-time treatment shows lasting results", "Cost remains a barrier at $2.2M per treatment", "Pipeline of 50+ CRISPR therapies in clinical trials"], why: "Opens the door to curing previously untreatable genetic diseases.", source: "Nature", likes: 215, comments: 67 },
  { id: 4, title: "Edge Computing Meets AI: The Next Platform Shift", topic: "Web Dev", time: "3 min", summary: "Running AI inference at the edge is becoming practical with new hardware and optimized model formats.", insights: ["Sub-10ms inference on edge devices", "Privacy-preserving AI without cloud dependency", "New ONNX runtime optimizations"], why: "Could eliminate latency and privacy concerns in AI applications.", source: "Ars Technica", likes: 76, comments: 19 },
  { id: 5, title: "Y Combinator W26 Batch: Key Trends", topic: "Startups", time: "4 min", summary: "This batch shows heavy concentration in AI infrastructure, climate tech, and developer tools.", insights: ["70% of companies are AI-native", "Climate tech funding doubled year-over-year", "Developer tools focus on AI-assisted coding"], why: "YC batches are leading indicators of where venture capital is flowing.", source: "TechCrunch", likes: 183, comments: 45 },
  { id: 6, title: "Zero-Trust Architecture Goes Mainstream", topic: "Security", time: "3 min", summary: "Enterprises adopt zero-trust as default security posture, driven by rising sophisticated attacks.", insights: ["68% of Fortune 500 now implement zero-trust", "Identity-based access replacing network perimeters", "AI-powered threat detection integration"], why: "Traditional perimeter security is no longer sufficient.", source: "Wired", likes: 64, comments: 12 },
];

const trending = ["Agentic AI", "Rust for Web", "Climate Tech", "Edge AI", "Small LMs", "Zero Trust", "CRISPR"];

const savedArticles = [
  { title: "Understanding Transformer Architecture", topic: "AI & ML", savedAt: "2 days ago" },
  { title: "The Future of WebAssembly", topic: "Web Dev", savedAt: "3 days ago" },
  { title: "Startup Fundraising in 2026", topic: "Startups", savedAt: "1 week ago" },
];

const readingStats = {
  thisWeek: 23,
  lastWeek: 18,
  streak: 12,
  totalSaved: 47,
  topTopic: "AI & ML",
  avgReadTime: "3.2 min",
};

const weeklyData = [
  { day: "Mon", count: 5 },
  { day: "Tue", count: 3 },
  { day: "Wed", count: 7 },
  { day: "Thu", count: 4 },
  { day: "Fri", count: 2 },
  { day: "Sat", count: 1 },
  { day: "Sun", count: 1 },
];

export default function DashboardPage() {
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);
  const [activeTopics, setActiveTopics] = useState<string[]>(["AI & ML", "Web Dev", "Security"]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleTopic = (t: string) => {
    setActiveTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const filtered = articles.filter(
    (a) => activeTopics.includes(a.topic) &&
    (searchQuery === "" || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <h1 className="text-2xl font-bold mb-1">Good morning, Alex 👋</h1>
            <p className="text-sm text-muted-foreground">February 15, 2026 · {filtered.length} new articles in your feed</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              A
            </div>
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
            { label: "Articles This Week", value: readingStats.thisWeek, icon: BookOpen, change: "+28%" },
            { label: "Reading Streak", value: `${readingStats.streak} days`, icon: Flame, change: "🔥" },
            { label: "Saved Articles", value: readingStats.totalSaved, icon: Bookmark, change: "+5" },
            { label: "Avg. Read Time", value: readingStats.avgReadTime, icon: Clock, change: "-12%" },
          ].map((stat, i) => (
            <div key={stat.label} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-medium text-primary">{stat.change}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="glass rounded-2xl p-4 sticky top-28 space-y-6">
              {/* Topics */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Topics</h3>
                <div className="space-y-1">
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTopic(t)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                        activeTopics.includes(t)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span><Hash className="inline h-3 w-3 mr-1.5" />{t}</span>
                      {activeTopics.includes(t) && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
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
                  {trending.map((t, i) => (
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
                  {savedArticles.map((a) => (
                    <div key={a.title} className="px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <p className="text-xs font-medium line-clamp-1">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.savedAt}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> This Week
                </h3>
                <div className="flex items-end gap-1.5 h-16 px-2">
                  {weeklyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm bg-primary/20 transition-all hover:bg-primary/40"
                        style={{ height: `${(d.count / 7) * 100}%`, minHeight: 4 }}
                      />
                      <span className="text-[9px] text-muted-foreground">{d.day[0]}</span>
                    </div>
                  ))}
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
                <button className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors">
                  <Filter className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
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
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTopics.includes(t)
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
              <span className="text-xs text-muted-foreground">{filtered.length} articles</span>
            </div>

            {/* Articles */}
            <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-3" : "space-y-3"}>
              {filtered.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedArticle(article)}
                  className="glass rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {article.topic}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {article.time}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{article.source}</span>
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">{article.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ThumbsUp className="h-3 w-3" /> {article.likes}
                      </span>
                      <span className="flex items-center gap-1 hover:text-primary transition-colors">
                        <MessageSquare className="h-3 w-3" /> {article.comments}
                      </span>
                      <span className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Share2 className="h-3 w-3" /> Share
                      </span>
                      <span className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Bookmark className="h-3 w-3" /> Save
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Read <ChevronRight className="h-3 w-3 ml-0.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-20 text-muted-foreground text-sm col-span-2">
                  {searchQuery ? "No articles match your search." : "Select topics to see articles."}
                </div>
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
                  <p className="text-sm font-medium">Small Language Models</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Mentioned in 4 articles today</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-primary mb-1">Most Read Topic</p>
                  <p className="text-sm font-medium">AI & Machine Learning</p>
                  <p className="text-[11px] text-muted-foreground mt-1">38% of today's digest</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-primary mb-1">Emerging</p>
                  <p className="text-sm font-medium">Edge AI Computing</p>
                  <p className="text-[11px] text-muted-foreground mt-1">↑ 240% interest this week</p>
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
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedArticle.time} read</span>
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {selectedArticle.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {selectedArticle.comments}</span>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" /> AI Summary
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedArticle.summary}</p>
                </div>

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

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Bookmark className="h-3.5 w-3.5" /> Save
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </button>
                  </div>
                  <a
                    href="#"
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
    </div>
  );
}
