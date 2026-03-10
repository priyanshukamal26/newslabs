# Changelog

All notable changes to NewsLabs are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Trending topic click-to-filter (apply search from Trending Now panel)
- AI-powered NLP topic tagging (replacing keyword-match categorization)
- Re-enable AI Chat once API rate-limit strategy is in place
- Persistent article storage (database-backed, survives server restarts)

---

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
- AI Chat component (Groq-powered, later rate-limited)
- Landing page, Features page, Auth page, Dashboard, Profile
- Vercel deployment config (`vercel.json`)
- Render deployment config (`server/render.yaml`)
