import { motion } from "framer-motion";
import {
  Sparkles, TrendingUp, BookOpen, Shield, Cpu, Rss, KeyRound,
  Layers, BarChart3, Bell, Globe, Palette, Brain, FileText,
  Mail, Scale, Rocket, ArrowRight, Bookmark, Activity, MessageSquare, Lock, LayoutGrid
} from "lucide-react";
import { Link } from "react-router-dom";

/* ── Variants ──────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

/* ── Data ──────────────────────────────────────────────────────────── */
const features = [
  { icon: BookOpen, title: "Trusted Sources", desc: "Add your own trusted RSS sources and official APIs. All legal, all ethical.", category: "Input" },
  { icon: Sparkles, title: "On-Demand Summaries", desc: "Choose between concise, balanced, or detailed summaries based on your preference.", category: "Processing" },
  { icon: Brain, title: "Reliability Badging", desc: "Visual tags that score article reliability, sentiment tone, and detect factual vs. opinion pieces.", category: "Analysis" },
  { icon: Activity, title: "Reading Lab Analytics", desc: "Track your Topic DNA, read depth (deep vs. skim), and visualize habits via the Reading Clock heatmap.", category: "Analytics" },
  { icon: LayoutGrid, title: "Custom Dashboards", desc: "Organize your reading views with your own preferred layouts, toggling grid and list modes.", category: "Output" },
  { icon: Lock, title: "BYOK Privacy", desc: "Bring your own API key. Keep complete ownership of your data and maintain total privacy.", category: "Privacy" },
  { icon: Bell, title: "Notification Automation", desc: "Get smart, automated alerts about real-time content that matches your priority topics.", category: "Automation" },
  { icon: Shield, title: "Compliance & Ethics", desc: "Built on open standards. Absolutely no web scraping. Full transparency.", category: "Trust" },
];

const steps = [
  { icon: Rss, num: "01", title: "Fetch Feeds", desc: "You provide the sources. We pull content from their RSS feeds and official APIs — no scraping involved." },
  { icon: Brain, num: "02", title: "AI Categorization", desc: "Our engine detects the core topic, factual vs. opinion nature, and overall sentiment of the piece." },
  { icon: FileText, num: "03", title: "Dynamic Summaries", desc: "Articles are summarized into concise or detailed insights depending on your dashboard settings." },
  { icon: Activity, num: "04", title: "Analytics Building", desc: "Your engagement populates the Reading Lab with deep vs. skim read stats and topic heatmaps." },
  { icon: Mail, num: "05", title: "Live Dashboard", desc: "Access your personalized, continuously updating feed where you can read, save, and track your streak." },
];

const docsEthics = [
  {
    icon: Rss,
    title: "Legal Sources Only",
    content: "NewsLabs exclusively uses RSS feeds and official public APIs to aggregate content. We never scrape websites, bypass paywalls, or access content without authorization. Every piece of content you see comes from sources that explicitly provide feeds for public consumption.",
  },
  {
    icon: Shield,
    title: "No Scraping Policy",
    content: "We are committed to a strict no-scraping policy. Our platform respects robots.txt directives, honors rate limits, and only accesses content through officially supported channels. This ensures full compliance with copyright law and the terms of service of content providers.",
  },
  {
    icon: Scale,
    title: "Ethics & Transparency",
    content: "We believe in full transparency about how content is sourced, processed, and summarized. Our AI models generate original summaries — they do not reproduce copyrighted content verbatim. Source attribution is always provided, and original links direct readers back to the publisher.",
  },
  {
    icon: Rocket,
    title: "Roadmap",
    content: "We're building the future of ethical content curation. Upcoming features include: advanced personalization engines, team collaboration tools, and custom dashboard layouts. Our mission is to make knowledge accessible — the right way.",
  },
];

/* ── Page ──────────────────────────────────────────────────────────── */
export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-paper">

      {/* ── Page masthead ── */}
      <div className="border-b-2 border-ink">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-14 lg:py-20">
          <p
            className="text-[10px] uppercase tracking-[0.25em] text-editorial-red mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Full Coverage
          </p>
          <h1
            className="text-5xl md:text-7xl font-black text-ink leading-[0.92] tracking-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Powerful <em style={{ fontStyle: "italic" }}>Features</em>
          </h1>
          <p
            className="text-lg sm:text-xl text-neutral-600 max-w-2xl leading-relaxed"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Everything you need to aggregate your favorite feeds, summarize them with AI, and experience a real-time, intelligent news dashboard — built entirely on open standards.
          </p>
        </div>
      </div>

      {/* ── Feature grid ── */}
      <section className="border-b-2 border-ink" aria-label="Core features">
        <div className="max-w-screen-xl mx-auto">
          <div
            className="border-b border-ink px-4 sm:px-8 py-4"
          >
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-neutral-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Section A — Core Capabilities
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className={`
                  p-6 sm:p-8 border-b border-ink group cursor-default hard-shadow-hover
                  ${i % 3 !== 2 ? "lg:border-r" : ""}
                  ${i % 2 === 0 ? "sm:border-r lg:border-r-0" : "sm:border-r-0"}
                  ${i % 2 === 0 && i % 3 !== 2 ? "sm:border-r lg:border-r" : ""}
                `}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 border border-ink flex items-center justify-center bg-paper text-ink group-hover:bg-ink group-hover:text-paper transition-all duration-150"
                  >
                    <f.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {f.category}
                  </span>
                </div>
                <h3
                  className="font-bold text-lg sm:text-xl text-ink mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-base text-neutral-600 leading-relaxed"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works — inverted section ── */}
      <section className="section-inverted border-b-2 border-ink newsprint-texture" aria-label="How it works">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-16 lg:py-20">
          <div className="border-b border-neutral-700 pb-6 mb-12">
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Section B — Pipeline
            </p>
            <h2
              className="text-4xl md:text-5xl font-black text-paper leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              How It <em style={{ fontStyle: "italic" }}>Works</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Sidebar copy */}
            <div className="lg:col-span-4 lg:border-r border-neutral-700 lg:pr-10 mb-10 lg:mb-0">
              <p
                className="text-lg text-neutral-400 leading-relaxed lg:max-w-md"
                style={{ fontFamily: "'Lora', serif" }}
              >
                From your favorite RSS feeds to an intelligent dashboard in five steps. NewsLabs automates the entire pipeline — set your sources once and access a live, curated feed anytime.
              </p>
              <div className="mt-8">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-editorial-red text-white text-xs font-bold uppercase tracking-[0.18em] border border-editorial-red hover:bg-paper hover:text-ink hover:border-paper transition-all duration-150"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Steps */}
            <div className="lg:col-span-8 lg:pl-10 space-y-0 divide-y divide-neutral-700">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-6 py-6 group"
                >
                  {/* Step number */}
                  <div
                    className="text-3xl font-black text-editorial-red leading-none shrink-0 w-12 text-right"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {step.num}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
                      <h3
                        className="text-lg font-bold text-paper"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <p
                      className="text-base text-neutral-400 leading-relaxed"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Docs & Ethics ── */}
      <section className="border-b-2 border-ink" aria-label="Docs and ethics">
        <div className="max-w-screen-xl mx-auto">
          <div className="border-b border-ink px-4 sm:px-8 py-4">
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-neutral-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Section C — Docs & Ethics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {docsEthics.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 border-b border-ink ${i % 2 === 0 ? "md:border-r" : ""}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-editorial-red text-editorial-red flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <h3
                    className="text-xl font-bold text-ink"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.title}
                  </h3>
                </div>
                {/* Red left-border blockquote style */}
                <div className="border-l-2 border-editorial-red pl-5">
                  <p
                    className="text-base text-neutral-600 leading-relaxed text-justify"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    {s.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
