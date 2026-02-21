import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, BookOpen, Shield, Cpu, Rss, KeyRound, Brain, Lock, ArrowRight, Zap } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Sparkles, title: "AI Summarization", desc: "Get concise, intelligent summaries of every article in your feed." },
  { icon: TrendingUp, title: "Trend Detection", desc: "Spot emerging topics before they go mainstream." },
  { icon: BookOpen, title: "Topic-Based Digests", desc: "Curated newsletters organized by the topics you care about." },
  { icon: Shield, title: "Legal & Ethical", desc: "Built on RSS feeds and official APIs. No scraping, ever." },
  { icon: Cpu, title: "Fully Automated", desc: "Set it once. Your personalized digest arrives daily." },
];

const trustIcons = [
  { icon: Rss, label: "RSS Feeds" },
  { icon: KeyRound, label: "Official APIs" },
  { icon: Brain, label: "AI Processing" },
  { icon: Lock, label: "Privacy First" },
];

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground mb-8"
        >
          <Zap className="h-3.5 w-3.5 text-primary" />
          Powered by Open Standards, Not Scraping
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
        >
          Your Personalized{" "}
          <span className="text-gradient">AI-Curated</span>
          {" "}Newsletter. Every Day.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          NewsLabs reads hundreds of articles so you don't have to.
          Smart curations from ethical sources.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/auth"
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity glow-primary"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { getPublicDailyBrief } from "../lib/api";

function NewsletterPreview() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-daily-brief'],
    queryFn: getPublicDailyBrief,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    gcTime: 1000 * 60 * 60 * 6,
  });

  const articles = data?.articles || [];

  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
            Your Daily <span className="text-gradient">Digest</span>, Previewed
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-lg mx-auto">
            Here's what a typical NewsLabs newsletter looks like - smart, concise, actionable.
          </motion.p>
        </motion.div>

        <div className="glass rounded-2xl p-6 md:p-8 max-w-2xl mx-auto min-h-[400px]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">NewsLabs — Today's Brief</span>
            <span className="ml-auto text-xs text-muted-foreground">{todayDate}</span>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="p-4 rounded-xl bg-muted/20 animate-pulse border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-16 bg-muted rounded-full"></div>
                    <div className="h-3 w-12 bg-muted/50 rounded-full"></div>
                  </div>
                  <div className="h-4 w-3/4 bg-muted/80 rounded mb-2"></div>
                  <div className="h-3 w-full bg-muted/50 rounded"></div>
                  <div className="h-3 w-5/6 bg-muted/30 rounded mt-1"></div>
                </div>
              ))
            ) : (
              articles.map((article, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer group block"
                >
                  <a href={article.link || '#'} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {article.topic}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">{article.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                  </a>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-lg mx-auto">
            From intelligent summarization to trend detection — all powered by ethical AI.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors group cursor-default"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-shadow">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          Powered by <span className="text-gradient">Open Standards</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mb-12"
        >
          No scraping. No data harvesting. Just clean, legal, ethical AI curation.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8"
        >
          {trustIcons.map((t, i) => (
            <motion.div
              key={t.label}
              variants={fadeUp}
              custom={i}
              className="flex flex-col items-center gap-3"
            >
              <div className="h-14 w-14 rounded-2xl glass flex items-center justify-center">
                <t.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}



export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <NewsletterPreview />
      <TrustSection />
    </div>
  );
}
