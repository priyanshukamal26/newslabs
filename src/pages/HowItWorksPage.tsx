import { motion } from "framer-motion";
import { Rss, Brain, FileText, TrendingUp, Mail } from "lucide-react";

const steps = [
  { icon: Rss, title: "Fetch Feeds", desc: "We pull content from RSS feeds and official APIs — no scraping involved.", color: "primary" },
  { icon: Brain, title: "AI Reads Content", desc: "Our AI engine processes and understands every article's context and meaning.", color: "primary" },
  { icon: FileText, title: "Summarize & Tag", desc: "Articles are summarized into concise insights and tagged by topic automatically.", color: "accent" },
  { icon: TrendingUp, title: "Trend Analysis", desc: "Cross-reference topics to detect emerging trends and patterns.", color: "accent" },
  { icon: Mail, title: "Newsletter Generation", desc: "A personalized, beautifully formatted newsletter is generated and delivered.", color: "primary" },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            How It <span className="text-gradient">Works</span>
          </h1>
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
      </div>
    </div>
  );
}
