import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, BookOpen, Clock, Sparkles, X, ExternalLink, Flame, Hash, ChevronRight } from "lucide-react";

const topics = ["AI & ML", "Web Dev", "Science", "Startups", "Crypto", "Design"];

const articles = [
  { id: 1, title: "The Rise of Small Language Models in Production", topic: "AI & ML", time: "3 min", summary: "Companies are increasingly deploying smaller, fine-tuned models for specific tasks rather than relying on massive general-purpose LLMs.", insights: ["Cost reduction of up to 90% vs large models", "Faster inference times enable real-time applications", "Fine-tuning on domain data yields superior results"], why: "Small models democratize AI access for startups and small teams." },
  { id: 2, title: "Rust Adoption in Web Frameworks Accelerates", topic: "Web Dev", time: "4 min", summary: "Leptos and Dioxus gain momentum as Rust-based web frameworks mature, offering memory safety with competitive DX.", insights: ["Server-side rendering now on par with JS frameworks", "WASM compilation enables near-native performance", "Growing ecosystem of UI component libraries"], why: "Signals a shift toward systems-level languages in web development." },
  { id: 3, title: "CRISPR Gene Therapy Approved for Sickle Cell", topic: "Science", time: "5 min", summary: "The first CRISPR-based gene therapy receives full approval, marking a milestone in genetic medicine.", insights: ["One-time treatment shows lasting results", "Cost remains a barrier at $2.2M per treatment", "Pipeline of 50+ CRISPR therapies in clinical trials"], why: "Opens the door to curing previously untreatable genetic diseases." },
  { id: 4, title: "Edge Computing Meets AI: The Next Platform Shift", topic: "Web Dev", time: "3 min", summary: "Running AI inference at the edge is becoming practical with new hardware and optimized model formats.", insights: ["Sub-10ms inference on edge devices", "Privacy-preserving AI without cloud dependency", "New ONNX runtime optimizations"], why: "Could eliminate latency and privacy concerns in AI applications." },
  { id: 5, title: "Y Combinator W26 Batch: Key Trends", topic: "Startups", time: "4 min", summary: "This batch shows heavy concentration in AI infrastructure, climate tech, and developer tools.", insights: ["70% of companies are AI-native", "Climate tech funding doubled year-over-year", "Developer tools focus on AI-assisted coding"], why: "YC batches are leading indicators of where venture capital is flowing." },
];

const trending = ["Agentic AI", "Rust for Web", "Climate Tech", "Edge AI", "Small LMs"];

export default function DashboardPage() {
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);
  const [activeTopics, setActiveTopics] = useState<string[]>(["AI & ML", "Web Dev"]);

  const toggleTopic = (t: string) => {
    setActiveTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const filtered = articles.filter((a) => activeTopics.includes(a.topic));

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="glass rounded-2xl p-4 sticky top-28">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Topics</h3>
            <div className="space-y-1">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTopic(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTopics.includes(t)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Hash className="inline h-3 w-3 mr-1.5" />
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                <Flame className="h-3 w-3" /> Trending
              </h3>
              <div className="space-y-1">
                {trending.map((t) => (
                  <div key={t} className="text-xs text-muted-foreground px-3 py-1.5 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold mb-1">Today's Digest</h1>
            <p className="text-sm text-muted-foreground mb-6">February 15, 2026 · {filtered.length} articles</p>
          </motion.div>

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

          <div className="space-y-3">
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
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">{article.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                <div className="mt-3 flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground text-sm">
                Select topics to see articles.
              </div>
            )}
          </div>
        </main>
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
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {selectedArticle.topic}
                </span>
                <button onClick={() => setSelectedArticle(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold mb-4">{selectedArticle.title}</h2>

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

                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Read original source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
