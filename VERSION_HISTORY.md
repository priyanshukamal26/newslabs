# NewsLabs — Complete Version History

> A full record of every meaningful change from the first deployed build to the current v2.0 release.
> This document exists to help anyone joining the project understand the **why** behind every architectural decision.

---

## Origin — v1.0.0 (GitHub, Live on Render + Vercel)
**Released:** Early 2026 | **Status:** Hosted, Functional on current deployment

The first fully deployed public version. This is what currently lives on the GitHub repository and is indexed as the "live" build.

### What Was Built
- **React + Vite + TypeScript** frontend, deployed on **Vercel**
- **Fastify + Prisma + PostgreSQL** backend, deployed on **Render**
- **PostgreSQL** on **Supabase** free tier
- Parallel RSS feed fetching from ~15 curated tech sources
- In-memory article store (articles survive only until server restart)
- **Keyword-based categorization** into 17 topics — simple `.includes()` string match against a flat list
- **Algorithmic trending topics** — top-N word frequency across all article titles
- **AI article analysis** on demand — Groq `llama-3.1-8b-instant` for summaries, insights, and topic tagging
- Article **Like** and **Save** — initially in-memory, later migrated to PostgreSQL
- **Landing page**, Features page, Auth page, Dashboard, Profile page
- `vercel.json` for frontend routing, `server/render.yaml` for backend deployment

### Known Issues at v1.0
- ~65% of articles fell into "Uncategorized" due to weak keyword matching
- AI categorization consumed Groq rate limits, breaking user-facing analysis
- Date parsing inconsistencies (`pubDate` / `isoDate`) caused wrong sort order
- Article count mismatch between total shown and paginated display

---

## v1.1.0 — Authentication & User System

### What Changed
- **JWT-based auth** — `/api/auth/register`, `/api/auth/login`
- **User profile** — name, phone, email, dark mode preferences stored in PostgreSQL
- **Topic interests** — per-user topic list saved and used to filter the dashboard
- **`requireAuth`** Fastify middleware protecting user routes
- **Login streak tracking** — current streak, longest streak, total login days
- **Protected routes** on the frontend — `<ProtectedRoute>` wrapper
- Navigation bar: Sign In / Sign Out becomes mutually exclusive
- "Get Started" → "Log Out" when authenticated

---

## v1.2.0 — Dashboard & Feed Improvements

### What Changed
- **Daily Brief** endpoint — 3 curated articles across AI / Science / Tech, cached 6 hours server-side
- **Reading stats dashboard** — total reads, average read time, weekly activity chart, login streak
- **Notifications system** — per-user notifications with mark-read / mark-all-read
- **Liked & Saved articles** persisted to PostgreSQL (denormalized for fast retrieval)
- **Read history tracking** — time spent per article per user recorded
- Article `pubDate` exposed throughout UI and stored in liked/saved records

### Bugs Fixed
- Feed article count mismatch between total and paginated view
- `pubDate` / `isoDate` parsing inconsistencies causing incorrect sort order
- Duplicate article handling in feed aggregation

---

## v1.3.0 — Hybrid AI Mode & Profile Enhancements

### What Changed
- **Hybrid AI mode** — Groq tried first; automatically falls back to Google Gemini on rate-limit or timeout
- **Per-user AI provider preference** — selectable in Profile (`groq`, `gemini`, `hybrid`)
- **Dark / light mode toggle** persisted per user in database
- **Change password** form in Profile page
- **Retry logic with exponential back-off** — 2s → 4s → 8s on Groq 429 errors
- 15-second per-request timeout on Groq calls

### Bugs Fixed
- Hybrid mode wasn't actually falling back to Gemini (logic flaw fixed)
- AI Provider change error showed wrong message (now includes "Please try after a while")

---

## v1.4.0 — Categorization Engine Improvements (Level-Wise Scoring)

### What Changed
- Replaced the flat `.includes()` keyword match with a **4-level weighted scoring engine**:
  - Level 1: Exact phrase in title (highest weight: `length × 10`)
  - Level 2: Substring in title
  - Level 3: Exact word in content snippet
  - Level 4: Substring in content snippet
- **Regex word-boundary matching** (`\bkeyword\b`) to prevent false positives (e.g. `"haircare"` → `"ai"`)
- Special **acronym bonus system** — `"AI"`, `"ML"`, `"UI"`, `"UX"` get a +20 score in title to prevent substring collisions
- **Minimum score threshold** (5 points) to reject low-signal matches
- Articles now pass both `title` and `contentSnippet` to the categorizer

### Context
This was driven by user feedback that most news was landing in "Uncategorized". The level-wise engine cut uncategorized from ~65% to ~40%.

---

## v1.5.0 — Feed Source Expansion (Indian News)

### What Changed
- Added **4 new major Indian news RSS feeds**:
  - The Hindu (National)
  - The Hindu (Sports)
  - The Indian Express (Latest)
  - The Indian Express (Business)
- Server now fetches from **27 RSS feeds in parallel**
- Article store grows to **900+ articles** per refresh cycle

### Context
User reported major Indian news events going uncategorized or miscategorized. Adding native Indian sources provided much more India-specific training data for the NLP classifier.

---

## v1.6.0 — NLP Classifier Integration (Naive Bayes)

### What Changed
- **`natural` npm package** integrated into the Fastify server
- **Naive Bayes classifier** trained on server startup from `server/src/data/training.json`
- Training corpus seeded with keywords from all category lists (bootstrapped)
- `categorizeArticle()` now returns a structured object: `{ primary: string; topics: string[] }`
- **Multi-label classification** — articles can carry secondary topic tags
- **`getNlpStatus()`** exported to expose classifier health

### Bugs Fixed
- NLP forced classification even with 0.01% confidence (fixed in v2.0)

---

## v1.7.0 — Status Dialog & NLP Health Monitoring

### What Changed
- **`/health` endpoint** updated to include `nlpClassifier: "ready" | "training" | "failed"`
- **Status Dialog** in the frontend updated with an **NLP Engine** row showing live classifier health
- `Brain` icon added from `lucide-react` for the NLP row
- `status.tsx` parses `nlpClassifier` from the health response

---

## v1.8.0 — AI Summarization Improvements

### What Changed
- **Summarization prompt** hardened to:
  - Always include exact company/product names
  - Forbid vague language ("the company", "this technology")
  - Require specific numbers, dates, and named entities
- **Categorization prompt** (for AI-path) updated with edge case handling
- Custom **brutalist loading animation** in DashboardPage replaces standard spinner

---

## [v2.0.0] — Hybrid NLP Categorization Engine + India-First + World/General
**Edition Vol. 2.0 | Released March 2026**

This is a major architectural upgrade to the categorization system. The v1.x keyword engine had reached its ceiling; v2.0 introduces a true multi-layer pipeline.

### What Changed

#### Categorization Engine — Complete Rewrite (v4)
The old single-pass keyword scorer was replaced with a **4-layer hybrid engine**:

| Layer | Name | Description |
|---|---|---|
| 0 | Source Feed Bias | 20+ known feeds (ScienceDaily, ESPN, TechCrunch, NDTV…) pre-weight toward their domain (+30 score) |
| 1 | Keyword Scoring | Regex phrase matching + exact word scoring against 100+ keywords per category |
| 2 | NLP Classifier | Naive Bayes with **25% confidence threshold** — rejects low-confidence guesses; **40%** for misfire-prone categories (Crypto, DevOps, Design, Web Dev) |
| 3 | Source Bias Fallback | If still Uncategorized but source bias exists, trust the source |
| 4 | World / General | Articles with geopolitical cues → "World"; everything else → "General" |

**Result:** 0% Uncategorized across 967 live articles tested (from 65% uncategorized at v1.0).

#### 2 New Categories
- **`World`** — captures wars, conflicts, UN, diplomatic events, Iran, Gaza, Russia/Ukraine, Pakistan
- **`General`** — safe catch-all for content that genuinely doesn't fit any niche

#### India Keyword Expansion
India's keyword list grew from **25 → 100+ keywords** across 8 field groups:
- Politics & Government (30+ politicians, parties, institutions)
- Judiciary & Law (CBI, ED, NIA, PIL, UAPA)
- States & Cities (all 28 states + 25+ major cities)
- Economy & Finance (RBI, SEBI, GST, UPI, AADHAAR, Sensex, Nifty)
- Corporates & Brands (Tata, Reliance, Adani, Infosys, Wipro, TCS, Paytm, Zomato, Swiggy, Jio…)
- Sports (IPL, BCCI, Kohli, Dhoni, Neeraj Chopra, PV Sindhu, PKL, ISL…)
- Culture & Society (Bollywood, festivals, Ram Mandir, caste reform…)
- Defence & Infrastructure (Indian Army/Navy/IAF, DRDO, Vande Bharat, IRCTC…)

#### 16 Indian Source Biases Added
The Hindu, NDTV, Times of India, India Today, Hindustan Times, Scroll, The Wire, Republic TV, ABP News, Aaj Tak, News18, Zee News, and more — any article from these sources now gets pre-classified as "India".

#### NLP Training Corpus — 10x Growth
`training.json` expanded from **85 → 300+ labelled examples**:
- 50 India-specific sentences
- 20 World/geopolitical examples
- 20 entries per major category (AI, Science, Sports, Entertainment…)
- Real article title phrasings (not just keywords)

#### Keyword List Expansion (All Categories)
Every category grew ~2–3× in keyword count. Key additions:
- **Crypto**: `token price`, `crypto market`, `digital assets`, `altcoin`, `proof of stake`, `dogecoin`, `xrp`
- **Security**: `CVE`, `bug bounty`, `backdoor`, `DDoS`, `social engineering`, `zero-day`
- **Science**: `coral`, `wildlife`, `bird`, `mammal`, `conservation`, `ecology`, `neuroscience`
- **Sports**: `Formula 1`, `UFC`, `pro kabaddi`, `squad`, `transfer window`, `semifinal`
- **DevOps**: `serverless`, `GitOps`, `Helm`, `Prometheus`, `Grafana`, `SRE`, `Cloudflare`
- **Entertainment**: `Grammy`, `Cannes`, `K-pop`, `anime`, `esports`, `Twitch`, `Spotify`

#### Bugs Fixed
- Iran/Gaza/war articles misfired as "Crypto" → now correctly "World"
- BBC world news misfired as "DevOps" → now "World"
- Regex phrase matching now safely escapes special characters (`ci/cd`, `c/c++`)
- `titleWords` and `contentWords` now explicitly typed as `string[]` (TypeScript fix)

#### UI Design — Brand New 2.0 Visual Identity

This is arguably the most visible change in 2.0. The entire public-facing UI (Landing Page, Features Page) was redesigned from scratch with a distinct **Brutalist Newsprint aesthetic**, while the Dashboard retains and refines the original dark glassmorphism style.

---

##### 🧱 The Design Philosophy — Dual Brutalist Narrative

v2.0 ships with **a brand new design language**-:

| Surface | Theme | Feel |
|---|---|---|
| Landing Page, Features Page, Dashboard, Profile, Auth | **Brutalist Newsprint** | Printed newspaper — sharp edges, ink-black borders, serif type, no border-radius |

The theme lives in `src/index.css`. The CSS custom properties (`--background`, `--card`, etc.) serve the Dashboard. The newsprint palette (`--np-paper: #F9F9F7`, `--np-ink: #111111`, `--np-red: #CC0000`) is applied directly in the public page components.

---

##### 🎨 Newsprint Design System (New in 2.0)

**Color Palette (4 strict colors — no others)**
| Token | Hex | Role |
|---|---|---|
| `--np-paper` | `#F9F9F7` | Page background — warm off-white, like aged newsprint |
| `--np-ink` | `#111111` | Primary text, borders, and buttons |
| `--np-red` | `#CC0000` | Accent — headlines, category labels, CTAs |
| `--np-muted` | `#E5E5E0` | Dividers, inactive elements |

**Typography Stack (4 fonts, each with a specific role)**
| Font | Role | Weight |
|---|---|---|
| **Playfair Display** | Headlines, section titles, display text | 400–900, italic |
| **Lora** | Body copy, article summaries, subheadlines | 400–600 |
| **JetBrains Mono** | Labels, metadata, category tags, bylines | 400–500 |
| **Inter** | UI buttons, navigation, CTAs | 300–900 |

All 4 fonts are loaded from Google Fonts as a single bundled `@import` in `index.css`.

**Zero Border Radius**
All public page interactive elements use `borderRadius: 0` (inline style override) or the `.sharp` utility class. Buttons, cards, icon boxes, and CTAs are perfectly squared — a deliberate editorial print aesthetic.

---

##### 🗞️ Landing Page — Complete Redesign

The original landing page was a basic centered layout. v2.0 replaces it with a full newspaper front-page structure:

**Hero Section — Asymmetric 8/4 Grid**
- Left column (8/12): Giant editorial headline `"Read Less. Understand More."` in Playfair Display at `5.5rem font-black`
- Italic `"Understand More."` in `#CC0000` — classic newspaper subhead treatment
- Newspaper masthead bar across the top with `BREAKING NEWS · AI · NEWS · FEED` label in JetBrains Mono
- Right column (4/12): Animated abstract dashboard wireframe — animated bars pulse to simulate live data
- Three stat blocks below the graphic: `100+ Sources`, `∞ Topics tracked`, `0 Ads or Distractions`
- Entry animation via **framer-motion** `fadeUp` — staggered 0.08s delay per element

**Feature Cards — 3-Column Editorial Grid**
- 8 feature cards in a responsive `1 → 2 → 3` column grid
- Each card has: category label (JetBrains Mono, red), icon box (inverts on hover), serif title, Lora body text
- `.hard-shadow-hover` effect — card lifts `(-2px, -2px)` and drops a `4px 4px 0 0 #111111` hard offset shadow (no blur — pure print style)
- Cards animate in via `whileInView` + `fadeUp` variant as user scrolls

**"The Feed" Live Preview Section**
- Inverted left panel (ink-black background) with `"The Feed"` heading in white Playfair Display
- Right panel: **infinite vertical marquee** (`.animate-marquee-vertical`) cycling through 5 sample articles
- Top and bottom gradient masks (`from-white to-transparent`) create a soft entrance/exit for the scrolling list
- On hover: marquee pauses (`group-hover:[animation-play-state:paused]`)
- Articles show: topic tag (red mono), `from [Source]` label (neutral mono), editorial title (hover → red), body summary (Lora)

**Trust Section — Inverted Dark Panel**
- Ink-black background with `.newsprint-texture` overlay — a fine 3px graph-paper grid at 2.5% opacity
- `✧ ✧ ✧` ornamental dividers (Playfair Display, tracked out)
- 4-column Trust Pillars grid with icons that glow red on hover
- `"A Foundation of Trust. Zero Scraping."` headline with inline red italic on "Zero Scraping."
- Centered "Build Your Feed" CTA button with border-only style (ghost) on dark background

---

##### 🖥️ Dashboard — Refinements

The Dashboard keeps its dark glassmorphism base but gets some targeted polish in 2.0:

**Loading Animation**
- Replaced the generic `<Loader2>` spinner with a custom **brutalist loading animation** built in framer-motion
- Multiple bars animate independently to simulate a data intake visualization
- Styled to match the dashboard's dark glass aesthetic

**Status Dialog — NLP Engine Row**
- New `"NLP Engine"` row added to the Status Dialog alongside Database and API services
- Powered by the `/health` endpoint's new `nlpClassifier` field
- Shows `ready` / `training` / `failed` with appropriate color coding
- Uses the `Brain` icon from `lucide-react`

---

##### 🎬 Animation System

v2.0 formalizes two reusable animation patterns:

**`fadeUp` variant (framer-motion)**
```ts
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" }
  }),
};
```
Used via `custom={i}` to stagger card animations as they enter the viewport.

**`animate-marquee-vertical` (CSS keyframe)**
Infinite vertical scroll on The Feed preview. Duplicates articles array to create a seamless loop without a gap.

---

##### Footer
- Version number updated from `"Edition Vol. 1.0"` → **`"Edition Vol. 2.0"`**

#### Other Changes
- **Landing page** — 2 new feature cards: "Hybrid NLP Engine" and "India-First Coverage"
- **README** — features table updated, categories section rewritten with 4-layer explanation
- **API_REFERENCE** — `/health` response updated to include `nlpClassifier` field
- **ROADMAP.md** — new file: 4 detailed future feature blueprints for contributors
- **VERSION_HISTORY.md** — new file: complete evolution from v1.0 → v2.0
- **Cleanup** — `test-categorization.ts`, `test-prisma.js`, `test-pg.js` removed

---


## Versioning Philosophy

| Range | Type |
|---|---|
| `1.0.0` | Initial public release (live on GitHub) |
| `1.1.x – 1.8.x` | Incremental features on top of the base system |
| `2.0.0` | Major architectural upgrade (NLP engine rewrite) |
| `2.x.x` (future) | New sections (Breaking, Current Affairs, Interest Feed) |
| `3.0.0` (future) | Transformer/embedding-based categorization or major UI redesign |

---

*Last updated: March 2026 — NewsLabs v2.0*
