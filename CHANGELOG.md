# Changelog

All notable changes to NewsLabs are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Trending topic click-to-filter (apply search from Trending Now panel)
- Persistent article storage (database-backed, survives server restarts)
- Naive Bayes model serialization (skip retraining on cold start)

---

## [2.0.0] — Hybrid NLP Categorization Engine

### Added
- **Hybrid NLP Categorization Engine v4** — 4-layer pipeline:
  1. Source Feed Bias (pre-weighted biases for 20+ known news sources)
  2. Keyword Scoring with regex phrase matching and acronym handling
  3. Naive Bayes NLP classifier (via `natural` npm package) with a **25% confidence threshold** — rejects low-confidence guesses; stricter **40% threshold** for Crypto, DevOps, Design, Web Dev
  4. `World` and `General` catch-all categories — zero articles left uncategorized
- **`World` category** — captures geopolitical news (wars, conflicts, UN, diplomatic events) that previously misfired into Crypto/DevOps
- **`General` category** — safe bucket for genuinely un-categorizable articles
- **India-First keyword expansion** — India keyword list grew from 25 → **100+ keywords** organized into 8 field groups: Politics & Government, Judiciary & Law, States & Cities (all 28 states), Economy & Finance, Corporates & Brands, Sports, Culture & Society, Defence & Infrastructure
- **16 Indian news source biases**: The Hindu, NDTV, Times of India, India Today, Hindustan Times, Scroll, The Wire, Republic TV, ABP News, Aaj Tak, News18, Zee News, and more
- **Expanded keyword lists** for all 18 categories (~2–3× growth per category): Crypto (token price, digital assets, altcoin, proof of stake…), Security (CVE, bug bounty, backdoor, DDoS…), Science (ecology, coral, wildlife, bird…), Sports (F1, UFC, pro kabaddi, squad…), Entertainment (Grammy, Cannes, K-pop, anime…), DevOps (serverless, GitOps, Helm, SRE…), and more
- **NLP training corpus** expanded from 85 → **300+ labelled examples**, with 50 India-specific sentences and 20 new `World` examples
- **`NLP Engine` status row** in the Status Dialog — Live health check via the `/health` endpoint's new `nlpClassifier` field
- **`source name` passed to categorizer** — RSS feed title now flows into categorizeArticle to power source-bias at runtime

### Fixed
- Iran/Gaza/war articles previously misfired as "Crypto" by low-confidence NLP — now correctly bucketed into "World"
- General BBC world news articles previously misfired as "DevOps" — now "World"
- Design category now matches via NLP even without exact keyword hits (ui design, user experience phrases)
- Regex phrase matching now safely escapes special characters in keywords (e.g. `c/c++`, `ci/cd`)


## [1.3.0] — Hybrid AI Mode & Profile Enhancements

### Added
- **Hybrid AI mode** — Groq is tried first; falls back to Google Gemini automatically on rate-limit or timeout
- **Per-user AI provider preference** — selectable in Profile settings (`groq`, `gemini`, `hybrid`)
- **Dark / light mode toggle** persisted per user in the database
- **Change password** form in Profile page
- Retry logic with exponential back-off (2 s → 4 s → 8 s) on Groq 429 errors
- 15-second per-request timeout on Groq calls

### Fixed
- Hybrid mode now correctly uses Gemini when Groq fails (logic flaw resolved)
- AI Provider setting change error message now includes "Please try after a while" user hint

---

## [1.2.0] — Dashboard & Feed Improvements

### Added
- **Daily Brief** endpoint with 6-hour server-side cache, returning curated AI / Science / Tech articles
- **Reading stats** dashboard — total reads, average read time, weekly activity chart, login streak
- **Notifications** system — per-user notifications with mark-read / mark-all-read
- **Liked & Saved articles** persisted to PostgreSQL (denormalized for fast retrieval)
- **Read history tracking** — records articles read and time spent per user
- Article `pubDate` field exposed throughout the UI and stored in liked/saved records

### Fixed
- Feed article count mismatch between total and paginated display
- Date parsing (`pubDate` / `isoDate`) inconsistencies causing incorrect sort order
- Duplicate article handling in feed aggregation

---

## [1.1.0] — Authentication & User System

### Added
- JWT-based email/password authentication (`/api/auth/register`, `/api/auth/login`)
- User profile with name, phone, email, dark mode preferences
- Topic interests saved per user (`/api/auth/update`)
- `requireAuth` Fastify middleware
- **Login streak** tracking (current streak, longest streak, total login days)
- Protected routes on frontend (`<ProtectedRoute>` wrapper)

### Changed
- Navigation bar: Sign In / Sign Out button becomes mutually exclusive based on auth state
- "Get Started" button on Landing Page changes to "Log Out" when authenticated

---

## [1.0.0] — Initial Release

### Added
- React + Vite + TypeScript frontend
- Fastify + Prisma + PostgreSQL backend
- Parallel RSS feed fetching from curated tech/news sources
- In-memory article store with on-demand AI analysis (Groq)
- Keyword-based article categorization into 17 topics
- Algorithmic trending topic extraction (word frequency)
- Algorithmic content insights (top trend, most-read topic, emerging topic)
- Article like / save / read interactions (in-memory, later migrated to DB)
- Landing page, Features page, Auth page, Dashboard, Profile
- Vercel deployment config (`vercel.json`)
- Render deployment config (`server/render.yaml`)
