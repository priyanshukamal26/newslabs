import { motion } from "framer-motion";
import { Shield, Rss, Scale, Rocket } from "lucide-react";

const sections = [
  {
    icon: Rss,
    title: "Legal Sources Only",
    content: "AutoDigest.AI exclusively uses RSS feeds and official public APIs to aggregate content. We never scrape websites, bypass paywalls, or access content without authorization. Every piece of content in your digest comes from sources that explicitly provide feeds for public consumption.",
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

export default function DocsPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Docs & <span className="text-gradient">Ethics</span>
          </h1>
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
                <h2 className="text-xl font-bold">{s.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
