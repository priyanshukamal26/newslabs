import { motion } from "framer-motion";
import { Sparkles, TrendingUp, BookOpen, Shield, Cpu, Rss, KeyRound, Layers, BarChart3, Bell, Globe, Palette, Brain, FileText, Mail, Scale, Rocket } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Rss, title: "Smart Feed Aggregation", desc: "Connect RSS feeds, newsletters, and official APIs. All legal, all ethical.", category: "Input" },
  { icon: Sparkles, title: "AI Summarization", desc: "GPT-powered summaries that capture the essence of every article.", category: "Processing" },
  { icon: TrendingUp, title: "Trend Detection", desc: "Identify emerging topics across your feeds before they go mainstream.", category: "Analysis" },
  { icon: BookOpen, title: "Personalized Digests", desc: "Topic-based newsletters tailored to your interests and reading habits.", category: "Output" },
  { icon: Layers, title: "Multi-Source Merging", desc: "Combine content from dozens of sources into one clean, unified digest.", category: "Processing" },
  { icon: BarChart3, title: "Reading Analytics", desc: "Track what you read, how long you engage, and discover patterns.", category: "Analysis" },
  { icon: Bell, title: "Smart Notifications", desc: "Get notified only about content that matches your priority topics.", category: "Output" },
  { icon: Shield, title: "Compliance & Ethics", desc: "Built on open standards. No web scraping. Full transparency.", category: "Trust" },
  { icon: Globe, title: "Multi-Language Support", desc: "Curate and summarize content across multiple languages.", category: "Processing" },
  { icon: KeyRound, title: "API Access", desc: "Integrate NewsLabs into your own tools with our developer API.", category: "Developer" },
  { icon: Cpu, title: "Fully Automated", desc: "Set your preferences once. Your digest is generated and delivered daily.", category: "Output" },
  { icon: Palette, title: "Custom Branding", desc: "White-label your newsletters with your own brand and style.", category: "Output" },
];

const steps = [
  { icon: Rss, title: "Fetch Feeds", desc: "We pull content from RSS feeds and official APIs — no scraping involved.", color: "primary" },
  { icon: Brain, title: "AI Reads Content", desc: "Our AI engine processes and understands every article's context and meaning.", color: "primary" },
  { icon: FileText, title: "Summarize & Tag", desc: "Articles are summarized into concise insights and tagged by topic automatically.", color: "accent" },
  { icon: TrendingUp, title: "Trend Analysis", desc: "Cross-reference topics to detect emerging trends and patterns.", color: "accent" },
  { icon: Mail, title: "Newsletter Generation", desc: "A personalized, beautifully formatted newsletter is generated and delivered.", color: "primary" },
];

const sections = [
  {
    icon: Rss,
    title: "Legal Sources Only",
    content: "NewsLabs exclusively uses RSS feeds and official public APIs to aggregate content. We never scrape websites, bypass paywalls, or access content without authorization. Every piece of content in your digest comes from sources that explicitly provide feeds for public consumption.",
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
    content: "We're building the future of ethical content curation. Upcoming features include: advanced personalization engines, team collaboration tools, custom branding for white-label newsletters, API access for developers, and multi-language support. Our mission is to make knowledge accessible — the right way.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto space-y-32">
        {/* --- Core Features Section --- */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Powerful <span className="text-gradient">Features</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Everything you need to curate, summarize, and deliver intelligent newsletters.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors cursor-default group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{f.category}</span>
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* --- How It Works Section --- */}
        <section className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              From feed to inbox in five intelligent steps.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-transparent" />

            <div className="space-y-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative flex gap-6 items-start"
                >
                  {/* Node */}
                  <div className="relative z-10 h-12 w-12 shrink-0 rounded-xl bg-muted flex items-center justify-center border border-border">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="glass rounded-2xl p-5 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Step {i + 1}</span>
                    <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Docs & Ethics Section --- */}
        <section className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Docs & <span className="text-gradient">Ethics</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              How we build an ethical, legal, and transparent AI newsletter platform.
            </p>
          </motion.div>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
