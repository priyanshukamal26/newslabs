# NewsLabs — Roadmap & Future Improvements

> This document is for developers and contributors who want to understand where NewsLabs is headed. Each item includes **why** it matters, **what** it touches, and rough **implementation notes** so future devs aren't starting blind.

---

## 🏷️ Status Key
| Badge | Meaning |
|---|---|
| 🔴 Not Started | No implementation yet |
| 🟡 In Progress | Active work underway |
| 🟢 Shipped | Feature is live |

---

## 1. 🧠 Improving Categorization Further
**Status:** 🟡 In Progress (v2.0 shipped hybrid NLP engine; further improvements planned)

### Why
The current Naive Bayes NLP model is trained at server startup using a static `training.json` corpus. As feeds grow in variety, accuracy will plateau. The next step is to move toward a more contextual, trainable model.

### What to Build
- **Weighted TF-IDF scoring** over keyword matching — gives rarer, more specific keywords higher weight than common ones
- **Active learning loop** — track when users click "Wrong Category" and feed that back into training data
- **Per-category precision/recall tracking** — a lightweight test harness that runs on startup and logs category accuracy to the console
- **Transformer embeddings (future)** — Replace Naive Bayes with sentence embeddings (e.g., `@xenova/transformers` running in Node) for contextual similarity matching. Feasibility: medium (adds ~50MB to server bundle)

### Files to Touch
- `server/src/routes/content.ts` — `categorizeArticle()` function, `categoryKeywords`, training init
- `server/src/data/training.json` — expand corpus with real mislabelled examples
- `server/src/services/store.ts` — add optional `categoryFeedback` field to Article interface

### Notes
- Keep the keyword engine as Layer 0/1 — it's fast & reliable for known terms. NLP should always remain a fallback, not the primary.
- Add a `/api/admin/categorization-report` endpoint to serve category accuracy stats for monitoring.

---

## 2. 🎯 AI-Powered Interest Engine + "For You" Feed
**Status:** 🔴 Not Started

### Why
Every user currently sees the same raw feed filtered by their selected topics. A truly personalized "For You" feed would surface articles the user is most likely to engage with, even if they haven't explicitly selected that topic.

### What to Build

#### Phase A — Implicit Interest Signals
Collect richer behavioral data from existing interactions:
- Article reads (already tracked in `ReadHistory`)
- Likes (tracked)
- Saves (tracked)
- Topic dwell time (new — track time between open/close events on the frontend)

#### Phase B — Interest Scoring Model
Build a lightweight per-user interest vector:
```
userInterests: {
  "AI & ML": 0.87,
  "India": 0.92,
  "Science": 0.55,
  ...
}
```
Computed from: `(likes × 3) + (saves × 2) + (reads × 1) + (dwell_time_weight)`

#### Phase C — "For You" Feed Endpoint
- New route: `GET /api/content/for-you`
- Returns articles ranked by `article.topic interest score × article recency`
- Falls back to standard feed if insufficient interaction data (< 10 reads)

#### Phase D — Frontend Tab
- Add a **"For You"** tab to DashboardPage alongside "All", "Saved", "Liked"
- Displayed only once user has enough history (> 10 reads)

### Files to Touch
- `server/src/routes/user.ts` — new `GET /api/user/interests` endpoint
- `server/src/routes/content.ts` — new `GET /api/content/for-you` endpoint
- `server/src/services/store.ts` — add `userInterestVector` computation helper
- `src/pages/DashboardPage.tsx` — add "For You" tab
- `prisma/schema.prisma` — add `UserInterest` model or JSON field on `User`

### Notes
- Privacy: Interest vectors are computed server-side and never exposed externally.
- This does NOT require an external ML service — all computation is arithmetic on existing DB data.

---

## 3. ⚡ Breaking News Section
**Status:** 🔴 Not Started

### Why
Currently the dashboard shows articles sorted by date with no prominence given to major breaking stories. Users want to immediately see the 10 most time-sensitive events at the top.

### What to Build
- A **"Breaking"** panel at the top of the Dashboard, separate from the main feed
- Shows **top 10 most recent articles** (by `pubDate`) across all sources, regardless of topic filter
- Auto-refreshes every 10 minutes without a full page reload
- Articles older than 4 hours are automatically removed from the Breaking panel

#### Breaking Eligibility Rules
An article qualifies as "Breaking" if:
1. `pubDate` is within the last **4 hours**, AND
2. Its source is in the list of known breaking-news sources (BBC, NDTV, Reuters, The Hindu, Indian Express), OR
3. Its title contains breaking cue words: `"breaking"`, `"just in"`, `"update:"`, `"alert:"`, `"live:"`, `"exclusive:"`

### Backend
- New route: `GET /api/content/breaking`
- Returns filtered + sorted articles matching the above rules
- No extra storage needed — scans the in-memory store

### Frontend
- `DashboardPage.tsx` — add a collapsible `<BreakingSection />` component above the main feed
- Styled distinctly (e.g. red left border, bold LIVE indicator, monospace timestamps)
- Auto-polls every 10 mins via `setInterval`

### Files to Touch
- `server/src/routes/content.ts` — new `GET /api/content/breaking` endpoint
- `src/pages/DashboardPage.tsx` — `BreakingSection` component
- `src/services/api.ts` — new `getBreakingNews()` API call

---

## 4. 📚 Current Affairs Section (Competitive Exam Prep)
**Status:** 🔴 Not Started

### Why
Students preparing for UPSC, SSC, IBPS, State PSC, and similar exams need a structured, time-filtered digest of current affairs — not a raw news feed. This is a high-value use case for India-based users.

### What to Build

#### Feature Overview
A dedicated **Current Affairs** page (`/current-affairs`) with:
- **Topic filters** — Politics, Economy, Science & Tech, International Relations, Environment, Sports, Awards & Honours
- **Period filters** — Today, Last 7 Days, Last 30 Days, Last 3 Months, Custom Date Range
- **Exam-style digest format** — Each item shown as a brief bullet point with: `[Topic] — One-line factual summary`
- **PDF Export** — Allow users to download the filtered set as a printable PDF

#### Article Eligibility
Articles from the `India`, `World`, `Politics`, `Business`, `Science`, `Space`, `Climate`, `Sports` categories are automatically included.

#### Data Pipeline
1. Reuse the existing article store — no new RSS sources needed initially
2. Add a `currentAffairsEligible: boolean` flag to the Article interface, set to `true` for eligible categories
3. New route: `GET /api/content/current-affairs?period=7d&topics=Politics,Economy`

#### Frontend
- New page: `src/pages/CurrentAffairsPage.tsx`
- Linked from Navbar and Dashboard sidebar
- Time filter UI using a segmented control (Today / Week / Month / 3 Months)
- Topic chips for multi-select filtering
- "Copy as Text" and "Download PDF" action buttons

### Files to Touch
- `server/src/routes/content.ts` — new `GET /api/content/current-affairs` endpoint
- `server/src/services/store.ts` — `currentAffairsEligible` flag on Article
- `src/pages/CurrentAffairsPage.tsx` — new page (NEW FILE)
- `src/App.tsx` or router — add `/current-affairs` route
- `src/components/Navbar.tsx` — add link

### Notes
- For PDF generation: use `jsPDF` on the frontend (no server-side rendering needed)
- For exam-style summaries: when clicked, trigger the existing `/api/content/analyze` endpoint — no extra AI cost
- Period filtering works on `pubDate` — ensure robust date parsing (existing bug already fixed in v1.2.0)

---

## General Principles for Future Devs

> [!IMPORTANT]
> **Do not re-enable AI categorization on feed fetch.** It exhausts Groq rate limits and breaks summarization for users. The hybrid NLP engine (Layer 0–4) is the correct solution.

> [!NOTE]
> **Keep the keyword engine fast.** It runs on every article at feed fetch time. Avoid async operations or external API calls inside `categorizeArticle()`.

> [!TIP]
> **The training.json corpus is the most impactful thing to expand.** Every 50 good labelled examples measurably improves Naive Bayes accuracy. When you find a misclassified article, add its title as a training example.
