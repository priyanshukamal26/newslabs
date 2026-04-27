import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Heart, Flame, BarChart3, Clock, TrendingUp,
  Bookmark, Activity, ExternalLink, Loader2
} from "lucide-react";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const serif = { fontFamily: "'Playfair Display', serif" };
const bodyFont = { fontFamily: "'Lora', serif" };

type ClockView = "hourly" | "daily" | "weekly";

function fmtSecs(s: number): string {
  if (s <= 0) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

function fmtHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* ── Gate Screen ── */
function GateScreen({ readsNeeded, totalReads }: { readsNeeded: number; totalReads: number }) {
  const target = 5;
  const pct = Math.min(100, (totalReads / target) * 100);
  return (
    <div className="border-2 border-ink bg-paper text-center py-24 px-8 relative overflow-hidden"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")` }}>
      <Activity className="h-10 w-10 text-neutral-200 mx-auto mb-6" />
      <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-editorial-red mb-3" style={mono}>
        Reading Lab
      </p>
      <h2 className="text-4xl font-black text-ink mb-3" style={serif}>Analytics Building…</h2>
      <p className="text-sm text-neutral-500 mb-10 max-w-sm mx-auto" style={bodyFont}>
        Read <span className="text-ink font-bold">{readsNeeded}</span> more article{readsNeeded !== 1 ? "s" : ""} to unlock your personalised reading dashboard.
      </p>
      <div className="w-full max-w-xs mx-auto">
        <div className="w-full h-3 border border-ink bg-paper relative overflow-hidden" style={{ borderRadius: 0 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute left-0 top-0 h-full bg-ink"
          />
        </div>
        <p className="text-[9px] text-neutral-400 mt-2 uppercase tracking-[0.2em]" style={mono}>
          {totalReads} / {target} reads
        </p>
      </div>
    </div>
  );
}

/* ── Heatmap Cell ── */
function HeatCell({ count, maxCount, label }: { count: number; maxCount: number; label: string }) {
  const [show, setShow] = useState(false);
  const intensity = maxCount > 0 ? count / maxCount : 0;
  const bg = count === 0
    ? "var(--np-paper)"
    : `hsl(var(--np-ink) / ${Math.max(0.1, intensity * 0.92)})`;
  return (
    <div
      className="relative border border-ink/10 cursor-default"
      style={{ backgroundColor: bg }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="aspect-square" />
      {show && count > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 whitespace-nowrap pointer-events-none"
          style={{ ...mono, fontSize: 9, background: "hsl(var(--np-ink))", color: "hsl(var(--np-paper))", padding: "2px 6px" }}>
          {label}: {count}
        </div>
      )}
    </div>
  );
}

/* ── Reading Clock ── */
function ReadingClock({ hourly, daily, weekly }: {
  hourly: Array<{ hour: number; count: number }>;
  daily: Array<{ date: string; label: string; count: number }>;
  weekly: Array<{ weekLabel: string; count: number }>;
}) {
  const [view, setView] = useState<ClockView>("hourly");

  const hourlyMax = Math.max(...hourly.map(h => h.count), 1);
  const dailyMax = Math.max(...daily.map(d => d.count), 1);
  const weeklyMax = Math.max(...weekly.map(w => w.count), 1);
  const peakHour = hourly.reduce((a, b) => b.count > a.count ? b : a, hourly[0]);

  return (
    <div className="border border-ink bg-paper">
      <div className="px-6 py-3.5 border-b border-ink flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500 flex items-center gap-2" style={mono}>
          <Clock className="h-3 w-3 text-editorial-red" /> Reading Clock
        </p>
        <div className="flex border border-divider-grey overflow-hidden">
          {(["hourly", "daily", "weekly"] as ClockView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors ${view === v ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-ink/5"}`}
              style={{ ...mono, borderRadius: 0 }}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 py-5">
        {view === "hourly" && (
          <>
            <div className="grid grid-cols-12 gap-1 mb-1">
              {hourly.slice(0, 12).map(h => (
                <HeatCell key={h.hour} count={h.count} maxCount={hourlyMax} label={fmtHour(h.hour)} />
              ))}
            </div>
            <div className="grid grid-cols-12 gap-1 mb-3">
              {hourly.slice(12).map(h => (
                <HeatCell key={h.hour} count={h.count} maxCount={hourlyMax} label={fmtHour(h.hour)} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-neutral-400 mb-4" style={mono}>
              <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
            </div>
            {peakHour && peakHour.count > 0 && (
              <p className="text-[10px] text-neutral-500 italic" style={bodyFont}>
                You read most at <span className="text-ink font-bold not-italic">{fmtHour(peakHour.hour)}</span>
              </p>
            )}
          </>
        )}
        {view === "daily" && (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {daily.slice(0, 7).map(d => (
                <HeatCell key={d.date} count={d.count} maxCount={dailyMax} label={d.label} />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {daily.slice(7).map(d => (
                <HeatCell key={d.date} count={d.count} maxCount={dailyMax} label={d.label} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-neutral-400 mt-1" style={mono}>
              {daily.filter((_, i) => i % 7 === 0).map(d => <span key={d.date}>{d.label}</span>)}
            </div>
          </>
        )}
        {view === "weekly" && (
          <>
            <div className="grid grid-cols-8 gap-1 mb-3">
              {weekly.map(w => (
                <HeatCell key={w.weekLabel} count={w.count} maxCount={weeklyMax} label={`Wk of ${w.weekLabel}`} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-neutral-400 mt-1" style={mono}>
              {weekly.filter((_, i) => i % 2 === 0).map(w => <span key={w.weekLabel}>{w.weekLabel}</span>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
interface ReadingLabProps {
  labData: any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function ReadingLabTab({ labData, isLoading, isAuthenticated }: ReadingLabProps) {
  if (!isAuthenticated) {
    return (
      <div className="text-center py-20 border border-ink bg-paper">
        <p className="text-sm text-neutral-500" style={bodyFont}>Please log in to access your Reading Lab.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 border border-ink bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-editorial-red mb-4" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400" style={mono}>Loading your analytics…</p>
      </div>
    );
  }

  if (!labData) return null;

  const {
    readsNeeded, totalReads, recentReads, topicBreakdown, sourceBreakdown,
    hourlyPattern, dailyPattern, weeklyPattern, sentimentBreakdown,
    deepReads, skimReads, avgTimeSpentSecs, engagementRate, likedTopics,
    likedArticles, savedArticles, topSource, currentStreak, longestStreak,
  } = labData;

  if (readsNeeded > 0) return <GateScreen readsNeeded={readsNeeded} totalReads={totalReads} />;

  const topTopic = topicBreakdown?.[0]?.topic || "—";
  const sentTotal = (sentimentBreakdown.Positive + sentimentBreakdown.Neutral + sentimentBreakdown.Negative) || 1;

  const sentimentCfg = [
    { key: "Positive", label: "Positive", color: "bg-emerald-500", text: "text-emerald-700", lightBg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { key: "Neutral", label: "Neutral", color: "bg-neutral-400", text: "text-neutral-600", lightBg: "bg-neutral-50 dark:bg-neutral-900/30" },
    { key: "Negative", label: "Negative", color: "bg-editorial-red", text: "text-editorial-red", lightBg: "bg-red-50 dark:bg-red-950/20" },
  ] as const;

  const dominantSentiment = (() => {
    const counts = sentimentBreakdown;
    if (counts.Positive >= counts.Neutral && counts.Positive >= counts.Negative) return "positive";
    if (counts.Negative >= counts.Neutral && counts.Negative >= counts.Positive) return "negative";
    return "balanced";
  })();

  const sentimentNote = dominantSentiment === "positive"
    ? "You lean toward uplifting, constructive news."
    : dominantSentiment === "negative"
    ? "You engage heavily with critical and challenging topics."
    : "You read a balanced mix across the sentiment spectrum.";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-px border border-ink bg-ink">

      {/* ── Summary Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink">
        {[
          { label: "Total Reads", value: totalReads, sub: `${deepReads} deep reads`, icon: BookOpen },
          { label: "Top Topic", value: topTopic.length > 14 ? topTopic.slice(0, 14) + "…" : topTopic, sub: `${topicBreakdown?.[0]?.percentage || 0}% of reads`, icon: BarChart3 },
          { label: "Engaged", value: `${engagementRate}%`, sub: `liked / reads ratio`, icon: Heart },
          { label: "Streak", value: `${currentStreak}d`, sub: `Best: ${longestStreak}d`, icon: Flame },
        ].map(s => (
          <div key={s.label} className="bg-paper px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon className="h-3.5 w-3.5 text-editorial-red" />
              <span className="text-[9px] text-neutral-400" style={mono}>{s.sub}</span>
            </div>
            <p className="text-2xl font-black text-ink" style={serif}>{s.value}</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 mt-0.5" style={mono}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-ink">
        {/* ── Topic DNA ── */}
        <div className="bg-paper">
          <div className="px-6 py-3.5 border-b border-ink">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500 flex items-center gap-2" style={mono}>
              <TrendingUp className="h-3 w-3 text-editorial-red" /> Topic DNA
            </p>
          </div>
          <div className="px-6 py-5 space-y-3">
            {topicBreakdown?.slice(0, 7).map((t: any, i: number) => (
              <div key={t.topic}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink" style={mono}>{t.topic}</span>
                  <span className="text-[9px] text-neutral-400" style={mono}>{t.count} · {t.percentage}%</span>
                </div>
                <div className="w-full h-2.5 border border-ink/20 bg-paper relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.percentage}%` }}
                    transition={{ delay: i * 0.06, duration: 0.7, ease: "easeOut" }}
                    className="absolute left-0 top-0 h-full bg-ink hover:bg-editorial-red transition-colors"
                  />
                </div>
              </div>
            ))}
            {topicBreakdown?.length > 0 && (
              <p className="text-[10px] text-neutral-400 pt-1 italic" style={bodyFont}>
                You're mostly a <span className="text-ink font-bold not-italic">{topTopic}</span> reader.
              </p>
            )}
          </div>
        </div>

        {/* ── Read Depth + Top Source ── */}
        <div className="bg-paper">
          <div className="px-6 py-3.5 border-b border-ink">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500 flex items-center gap-2" style={mono}>
              <Activity className="h-3 w-3 text-editorial-red" /> Read Depth
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-px border border-ink bg-ink">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 px-4 py-5 text-center">
                <p className="text-3xl font-black text-emerald-700" style={serif}>{deepReads}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-600 mt-1" style={mono}>Deep Reads</p>
                <p className="text-[8px] text-neutral-400 mt-0.5" style={mono}>≥50% of est. time</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-5 text-center">
                <p className="text-3xl font-black text-amber-700" style={serif}>{skimReads}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-600 mt-1" style={mono}>Skim Reads</p>
                <p className="text-[8px] text-neutral-400 mt-0.5" style={mono}>&lt;50% of est. time</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-divider-grey px-4 py-3">
                <p className="text-[8px] uppercase tracking-[0.15em] text-neutral-400 mb-1" style={mono}>Avg. Time</p>
                <p className="text-xl font-black text-ink" style={serif}>{fmtSecs(avgTimeSpentSecs)}</p>
              </div>
              <div className="border border-divider-grey px-4 py-3">
                <p className="text-[8px] uppercase tracking-[0.15em] text-neutral-400 mb-1" style={mono}>Top Source</p>
                <p className="text-sm font-black text-ink leading-tight" style={serif}>{topSource}</p>
              </div>
            </div>
            {sourceBreakdown?.length > 0 && (
              <div>
                <p className="text-[9px] text-neutral-400 uppercase tracking-[0.15em] mb-2" style={mono}>Sources read</p>
                <div className="space-y-1.5">
                  {sourceBreakdown.slice(0, 4).map((s: any) => (
                    <div key={s.source} className="flex items-center justify-between gap-2">
                      <span className="text-[9px] text-ink truncate max-w-[140px]" style={mono}>{s.source}</span>
                      <div className="flex-1 h-1.5 bg-divider-grey relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(s.count / (sourceBreakdown[0]?.count || 1)) * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className="absolute left-0 top-0 h-full bg-ink"
                        />
                      </div>
                      <span className="text-[9px] text-neutral-400 shrink-0" style={mono}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reading Clock ── */}
      <ReadingClock hourly={hourlyPattern || []} daily={dailyPattern || []} weekly={weeklyPattern || []} />

      {/* ── Sentiment Signal ── */}
      <div className="bg-paper border-t border-ink">
        <div className="px-6 py-3.5 border-b border-ink">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500 flex items-center gap-2" style={mono}>
            <BarChart3 className="h-3 w-3 text-editorial-red" /> News Signal
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-divider-grey">
          {sentimentCfg.map(s => {
            const count = sentimentBreakdown[s.key as keyof typeof sentimentBreakdown] || 0;
            const pct = Math.round((count / sentTotal) * 100);
            return (
              <div key={s.key} className={`px-6 py-5 ${s.lightBg}`}>
                <div className={`w-2 h-2 rounded-full ${s.color} mb-3`} />
                <p className={`text-3xl font-black ${s.text}`} style={serif}>{pct}%</p>
                <p className={`text-[9px] font-bold uppercase tracking-[0.15em] ${s.text} mt-1`} style={mono}>{s.label}</p>
                <p className="text-[9px] text-neutral-400 mt-0.5" style={mono}>{count} articles</p>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 border-t border-divider-grey">
          <p className="text-[10px] text-neutral-500 italic" style={bodyFont}>{sentimentNote}</p>
        </div>
      </div>

      {/* ── Liked & Saved Gallery ── */}
      <div className="grid md:grid-cols-2 gap-px bg-ink">
        {[
          { label: "Liked Articles", icon: Heart, items: likedArticles, dateKey: "likedAt", color: "text-editorial-red" },
          { label: "Saved Articles", icon: Bookmark, items: savedArticles, dateKey: "savedAt", color: "text-ink" },
        ].map(col => (
          <div key={col.label} className="bg-paper">
            <div className="px-5 py-3.5 border-b border-ink flex items-center gap-2">
              <col.icon className={`h-3 w-3 ${col.color}`} />
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500" style={mono}>{col.label}</p>
              <span className="ml-auto text-[9px] text-neutral-400" style={mono}>{col.items?.length || 0}</span>
            </div>
            <div className="divide-y divide-divider-grey max-h-64 overflow-y-auto">
              {col.items?.length > 0 ? col.items.map((item: any) => (
                <a key={item.id} href={item.link || "#"} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 hover:bg-ink/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink line-clamp-1 group-hover:underline" style={bodyFont}>{item.title || "Untitled"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-editorial-red border border-editorial-red px-1" style={mono}>{item.topic || "News"}</span>
                      <span className="text-[9px] text-neutral-400" style={mono}>{timeAgoShort(item[col.dateKey])}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-neutral-300 group-hover:text-ink shrink-0 transition-colors" />
                </a>
              )) : (
                <p className="text-[10px] text-neutral-400 px-5 py-6 text-center" style={mono}>Nothing here yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Reads Timeline ── */}
      <div className="bg-paper border-t border-ink">
        <div className="px-6 py-3.5 border-b border-ink">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500 flex items-center gap-2" style={mono}>
            <BookOpen className="h-3 w-3 text-editorial-red" /> Recent Reads
          </p>
        </div>
        <div className="divide-y divide-divider-grey">
          {recentReads?.length > 0 ? recentReads.slice(0, 20).map((r: any, i: number) => (
            <motion.div key={r.articleId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="flex items-start gap-4 px-6 py-3.5 hover:bg-ink/5 transition-colors">
              <span className="text-[10px] font-black text-neutral-300 pt-0.5 w-5 shrink-0 text-right" style={serif}>{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink leading-snug" style={bodyFont}>{r.title || "Untitled"}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[8px] font-bold uppercase tracking-[0.15em] border border-editorial-red text-editorial-red px-1" style={mono}>{r.topic}</span>
                  <span className="text-[9px] text-neutral-400" style={mono}>{r.source}</span>
                  <span className="text-[9px] text-neutral-400" style={mono}>· {timeAgoShort(r.readAt)}</span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className={`text-[8px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 border ${r.depthLabel === "Deep" ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20" : r.depthLabel === "Skim" ? "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/20" : "border-divider-grey text-neutral-400"}`} style={mono}>
                  {r.depthLabel}
                </span>
                <span className="text-[8px] text-neutral-400" style={mono}>{fmtSecs(r.timeSpentSecs)}</span>
              </div>
            </motion.div>
          )) : (
            <p className="text-sm text-neutral-400 text-center py-12" style={bodyFont}>No reads recorded yet. Start reading!</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
