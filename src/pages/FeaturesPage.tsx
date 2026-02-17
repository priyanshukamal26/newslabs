import { motion } from "framer-motion";
import { Sparkles, TrendingUp, BookOpen, Shield, Cpu, Rss, KeyRound, Layers, BarChart3, Bell, Globe, Palette } from "lucide-react";

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

export default function FeaturesPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
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
      </div>
    </div>
  );
}
