import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles, TrendingUp, BookOpen, Shield, Cpu,
  Rss, KeyRound, Brain, Lock, ArrowRight, Globe,
} from "lucide-react";

/* ── Data ──────────────────────────────────────────────────────────── */
const features = [
  { icon: Sparkles, title: "AI Summarization", desc: "By bypassing clickbait, our models synthesize your feeds into dense, high-value briefs.", category: "Processing", wip: false },
  { icon: TrendingUp, title: "Trend Detection", desc: "Identify emerging narratives across all your feeds instantly, before they saturate the mainstream.", category: "Analysis", wip: false },
  { icon: BookOpen, title: "Topic-Based Feeds", desc: "Content is automatically categorized and delivered cleanly—no algorithms deciding what you see.", category: "Output", wip: false },
  { icon: Shield, title: "Legal & Ethical", desc: "Zero scraping. We only process content from websites that officially publish their feeds.", category: "Trust", wip: false },
  { icon: Cpu, title: "Always Updated", desc: "Set it and forget it. Your live dashboard is perpetually synced to your trusted sources.", category: "Automation", wip: false },
  { icon: Rss, title: "Open Standards", desc: "Built on RSS—the original, uncompromised standard for decentralized web syndication.", category: "Input", wip: false },
  { icon: Brain, title: "Smart Categorization", desc: "Every article is automatically sorted into the right topic — no wrong bins, no missing stories. Our intelligent engine gets smarter the more you read.", category: "Intelligence", wip: true },
  { icon: Globe, title: "India-First Coverage", desc: "Built for the Indian reader. Politics, markets, sport, culture — deeply understood, accurately sorted, from every major Indian outlet.", category: "Regional", wip: false },
];

const trustPillars = [
  { icon: Rss, label: "RSS Native", detail: "No hidden scraping" },
  { icon: KeyRound, label: "Official APIs", detail: "Verified access only" },
  { icon: Brain, label: "Smart Summaries", detail: "Cut the filler" },
  { icon: Lock, label: "Privacy First", detail: "Your data is yours" },
];

/* ── Animation variants ────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

/* ── Sections ──────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section
      className="relative border-b-2 border-ink overflow-hidden"
      aria-label="Hero"
    >
      {/* Dot-grid is on body; add subtle texture layer */}
      <div className="max-w-screen-xl mx-auto">
        {/* Newspaper masthead rule */}
        <div className="border-b border-ink px-4 sm:px-8 py-3 flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.25em] text-neutral-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Breaking News
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.25em] text-neutral-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            AI · News · Feed
          </span>
        </div>

        {/* Main hero grid — 8/4 asymmetric split */}
        <div className="grid grid-cols-1 lg:grid-cols-12">

          {/* LEFT: Headline block (col-span-8) */}
          <div className="lg:col-span-8 px-4 sm:px-8 py-14 lg:py-24 border-b lg:border-b-0 lg:border-r border-ink flex flex-col justify-center relative overflow-hidden">

            {/* Subtle background ornament */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-neutral-100 rounded-full blur-[80px] -z-10 opacity-60 pointer-events-none" />

            {/* Category label */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-2 bg-editorial-red" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-editorial-red"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Exclusive — AI-Powered Curation
              </span>
            </div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-ink leading-[0.95] tracking-tight mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Read Less.
              <br />
              <em className="text-editorial-red" style={{ fontStyle: "italic" }}>
                Understand More.
              </em>
            </motion.h1>

            {/* Deck (subheadline) */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="text-lg sm:text-xl text-neutral-600 max-w-xl leading-relaxed mb-10"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Stop drowning in endless feeds and clickbait. Connect your trusted RSS sources to NewsLabs, and our intelligent AI will synthesize hundreds of articles into a single, distraction-free live dashboard.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-ink text-paper text-xs font-bold uppercase tracking-[0.18em] border border-ink hover:bg-transparent hover:text-ink transition-all duration-150 min-h-[44px]"
                style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
              >
                Start Reading <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-transparent text-ink text-xs font-bold uppercase tracking-[0.18em] border border-ink hover:bg-ink/10 transition-all duration-150 min-h-[44px]"
                style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
              >
                See How It Works
              </Link>
            </motion.div>

            {/* Byline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-8 pt-6 border-t border-divider-grey flex items-center gap-4"
            >
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-neutral-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                By NewsLabs AI Engine
              </span>
              <span className="w-px h-3 bg-neutral-300" />
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-neutral-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Updated Live
              </span>
            </motion.div>
          </div>

          {/* RIGHT: Visual panel (col-span-4) */}
          <div className="lg:col-span-4 px-6 py-10 lg:py-16 flex flex-col gap-6 lg:bg-paper lg:border-l lg:border-ink">

            {/* Abstract Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full aspect-[4/3] border border-ink bg-paper p-4 flex flex-col gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #111111 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-divider-grey">
                <div className="w-3 h-3 bg-editorial-red rounded-full animate-pulse" />
                <motion.div
                  className="h-2 bg-neutral-200"
                  animate={{ width: ["4rem", "6rem", "4rem"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="flex-1 flex gap-3">
                <motion.div
                  className="w-1/3 bg-neutral-100 border border-neutral-200"
                  animate={{ height: ["100%", "70%", "100%", "85%", "100%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="w-2/3 h-full flex flex-col gap-2">
                  <motion.div
                    className="h-4 bg-ink"
                    animate={{ width: ["100%", "85%", "100%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="h-2 bg-neutral-200 mt-1"
                    animate={{ width: ["83%", "95%", "83%"] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                  <motion.div
                    className="h-2 bg-neutral-200"
                    animate={{ width: ["100%", "90%", "100%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />
                  <div className="h-2 w-3/4 bg-neutral-200" />
                  <div className="h-2 w-4/5 bg-neutral-200" />
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            {[
              { num: "100+", label: "Sources integrated" },
              { num: "∞", label: "Topics tracked" },
              { num: "0", label: "Ads or Distractions" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                className="border border-ink p-5 hard-shadow-hover cursor-default"
              >
                <div
                  className="text-4xl font-black text-ink leading-none mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {stat.num}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.2em] text-neutral-500"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section >
  );
}

function FeaturesSection() {
  return (
    <section className="border-b-2 border-ink" aria-label="Features">
      <div className="max-w-screen-xl mx-auto">
        {/* Section header */}
        <div className="border-b border-ink px-4 sm:px-8 py-6 flex items-end justify-between gap-4">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Product Features
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-ink leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Everything You Need
            </h2>
          </div>
          <Link
            to="/features"
            className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-editorial-red hover:text-ink transition-colors duration-150 shrink-0"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Full Feature List <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Collapsed 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              custom={i}
              className={`
                p-6 sm:p-8 border-b border-ink group cursor-default hard-shadow-hover
                ${(i + 1) % 3 !== 0 ? "lg:border-r" : ""}
                ${(i + 1) % 2 !== 0 ? "sm:border-r" : "sm:border-r-0"}
                ${(i + 1) % 3 !== 0 && (i + 1) % 2 !== 0 ? "sm:border-r lg:border-r" : ""}
              `}
            >
              {/* Icon box */}
              <div className="w-11 h-11 border border-ink flex items-center justify-center mb-5 bg-paper text-ink group-hover:bg-ink group-hover:text-paper transition-all duration-150">
                <f.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>

              {/* Category label */}
              <p
                className="text-xs uppercase tracking-[0.22em] text-editorial-red mb-2 font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {f.category}
              </p>

              <h3
                className="text-xl sm:text-2xl font-bold text-ink mb-3 flex items-center gap-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {f.title}
                {f.wip && (
                  <span className="relative flex items-center" aria-label="Work in progress">
                    {/* Pulsing dot */}
                    <span className="relative flex h-2.5 w-2.5 mt-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-editorial-red opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-editorial-red" />
                    </span>
                    {/* Tooltip */}
                    <span
                      className="absolute left-4 -top-1 z-50 hidden group-hover:flex flex-col w-56 bg-ink text-paper px-3 py-2.5 pointer-events-none"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      role="tooltip"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red mb-1">Improving</span>
                      <span className="text-xs leading-relaxed text-neutral-300">
                        Full AI-powered categorization is temporarily limited — on-demand AI analysis exhausts API rate limits needed for article summaries. Our keyword + NLP engine covers 100% of articles in the interim.
                      </span>
                      {/* Arrow */}
                      <span className="absolute -left-1.5 top-3 w-0 h-0 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-[#111111]" />
                    </span>
                  </span>
                )}
              </h3>
              <p
                className="text-base text-neutral-600 leading-relaxed"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterPreview() {
  const articles = [
    {
      topic: "AI & ML",
      source: "TechCrunch",
      title: "OpenAI's o3 model scores 87.5% on ARC-AGI benchmark, a new record",
      summary: "OpenAI's newest reasoning model o3 has achieved a score of 87.5% on the ARC-AGI benchmark, surpassing all previous AI systems and reigniting debate about what general intelligence really means.",
      link: "https://techcrunch.com/2024/12/20/openais-o3-model-scores-87-5-on-arc-agi-benchmark-a-new-record/"
    },
    {
      topic: "Science",
      source: "BBC Science",
      title: "Woolly mammoth and its habitats mapped out in unprecedented detail",
      summary: "Scientists have built the most detailed picture yet of the life of woolly mammoths using ancient DNA, sediment samples, and climate modelling — revealing a species far more adaptable than previously thought.",
      link: "https://www.bbc.com/news/articles/c5y32kkzd7ro"
    },
    {
      topic: "India",
      source: "The Hindu",
      title: "India GDP growth projected at 6.5% for FY2025, says RBI report",
      summary: "The Reserve Bank of India's latest state of the economy report projects GDP growth at 6.5% for the current fiscal year, driven by strong domestic consumption and government capital expenditure.",
      link: "https://www.thehindu.com/business/Economy/india-gdp-growth-projected-at-65-for-fy2025-says-rbi-report/article68000000.ece"
    },
    {
      topic: "Space",
      source: "NASA",
      title: "NASA's James Webb Space Telescope captures most distant galaxy ever seen",
      summary: "JADES-GS-z14-0, observed by the James Webb Space Telescope, is now confirmed as the most distant galaxy ever detected — existing just 290 million years after the Big Bang.",
      link: "https://www.nasa.gov/missions/webb/"
    },
    {
      topic: "Climate",
      source: "Reuters",
      title: "Global renewable energy capacity hits record high in 2024",
      summary: "The world added a record 300 gigawatts of renewable energy capacity last year according to the International Energy Agency, driven largely by surging solar installations across Asia and Europe.",
      link: "https://www.reuters.com/business/energy/global-renewable-energy-capacity-hits-record-high-2024/"
    },
  ];

  const todayDate = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <section className="border-b-2 border-ink" aria-label="Feed preview">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12">

        {/* Left label panel */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-ink px-6 py-10 flex flex-col justify-center bg-neutral-950 text-neutral-50">
          <p
            className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Live Preview
          </p>
          <h2
            className="text-3xl font-black leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The Feed
          </h2>
          <p
            className="text-sm text-neutral-400 leading-relaxed mb-6"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Click any article to read the original story directly from the source, or become a member to read our dense, AI-powered summaries inside your dashboard.
          </p>
          <div
            className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 border-t border-neutral-700 pt-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Updated every 6 hours
          </div>
        </div>

        {/* Right: Article list with running animation */}
        <div className="lg:col-span-9 flex flex-col bg-paper">
          <div className="flex-1 relative h-[560px] overflow-hidden group">
            {/* Top and Bottom gradient masks for smooth entering/exiting */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-paper to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-paper to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee-vertical group-hover:[animation-play-state:paused] flex flex-col absolute top-0 left-0 right-0">
              {/* Map the articles twice to create a seamless infinite scroll loop */}
              {[...articles, ...articles].map((article, i) => (
                <a
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 sm:px-8 py-6 border-b border-divider-grey hover:bg-ink/5 transition-colors duration-150 item-hover"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.22em] text-editorial-red"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {article.topic}
                    </span>
                    <span className="w-px h-3 bg-neutral-300" />
                    <span
                      className="text-[10px] uppercase tracking-[0.15em] text-neutral-400"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      from {article.source}
                    </span>
                  </div>
                  <h4
                    className="font-bold text-base sm:text-lg text-ink mb-1.5 leading-tight hover:text-editorial-red transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {article.title}
                  </h4>
                  <p
                    className="text-sm text-ink/70 line-clamp-2 md:line-clamp-3 leading-relaxed"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    {article.summary}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* CTA row (Pinned at bottom) */}
          <div className="relative z-20 px-6 sm:px-8 py-4 flex items-center justify-between bg-ink/5 border-t border-ink">
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-neutral-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Your feed • Updated every 6 hours
            </span>
            <Link
              to="/auth"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-ink hover:text-editorial-red transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Enter Dashboard <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="section-inverted newsprint-texture border-b-2 border-ink relative overflow-hidden" aria-label="Trust">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-16 lg:py-20">

        {/* Ornamental divider */}
        <div
          className="text-center text-2xl text-neutral-700 tracking-[1em] mb-10 select-none"
          style={{ fontFamily: "'Playfair Display', serif" }}
          aria-hidden="true"
        >
          &#x2727; &#x2727; &#x2727;
        </div>

        <div className="text-center mb-14 relative z-10">
          <p
            className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            The Anti-Clickbait Engine
          </p>
          <h2
            className="text-4xl md:text-5xl font-black text-paper leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            A Foundation of Trust.
            <em style={{ fontStyle: "italic", color: "hsl(var(--np-red))" }}>{" "}Zero Scraping.</em>
          </h2>
          <p
            className="text-base text-neutral-400 max-w-lg mx-auto leading-relaxed"
            style={{ fontFamily: "'Lora', serif" }}
          >
            No scraping. No data harvesting. No paywall bypassing. We only process clean, legal, ethical semantic data from sources that explicitly publish feeds for public consumption.
          </p>
        </div>

        {/* Subtle grid background glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-editorial-red opacity-5 blur-[120px] pointer-events-none z-0" />

        {/* Trust pillars grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-neutral-700 relative z-10">
          {trustPillars.map((p, i) => (
            <motion.div
              key={p.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className={`px-6 py-8 flex flex-col items-center text-center group cursor-default
                ${i < 3 ? "border-r border-neutral-700" : ""}
                border-b lg:border-b-0 border-neutral-700
              `}
            >
              <div className="w-12 h-12 border border-neutral-600 flex items-center justify-center mb-4 bg-ink text-paper group-hover:border-editorial-red group-hover:bg-editorial-red group-hover:text-paper transition-all duration-150">
                <p.icon className="h-5 w-5 transition-colors" strokeWidth={1.5} />
              </div>
              <h3
                className="text-sm font-bold text-paper mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {p.label}
              </h3>
              <p
                className="text-[10px] uppercase tracking-[0.15em] text-neutral-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {p.detail}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 relative z-10">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-transparent text-paper text-xs font-bold uppercase tracking-[0.18em] border border-neutral-600 hover:bg-paper hover:text-ink hover:border-paper transition-all duration-300 min-h-[44px]"
            style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
          >
            Build Your Feed <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Bottom ornament */}
        <div
          className="text-center text-2xl text-neutral-700 tracking-[1em] mt-12 select-none"
          style={{ fontFamily: "'Playfair Display', serif" }}
          aria-hidden="true"
        >
          &#x2727; &#x2727; &#x2727;
        </div>
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <HeroSection />
      <FeaturesSection />
      <NewsletterPreview />
      <TrustSection />
    </div>
  );
}
