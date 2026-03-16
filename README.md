# NewsLabs 📰

> An AI-powered, personalized news aggregation platform that fetches RSS feeds, categorizes articles by topic, and uses **Groq** and **Google Gemini** to generate deep summaries, key insights, and daily briefs — all in a stunning, real-time dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📡 **RSS Feed Aggregation** | Pulls articles from dozens of curated tech/news RSS feeds in parallel |
| 🤖 **AI Article Analysis** | On-demand Groq/Gemini-powered summaries, insights, and topic classification |
| 🧠 **Hybrid NLP Categorization** | 4-layer engine: Source Feed Bias → Keyword Scoring → Naive Bayes NLP (with confidence threshold) → World/General catch-all. Achieves ~100% categorization rate |
| 🌏 **India-First Coverage** | 100+ India-specific keywords across politics, states, economy, courts, corporates, sports, culture, and defence — plus 16 Indian source feed biases |
| 🔥 **Trending Topics** | Algorithmic word-frequency analysis of live article titles |
| 📋 **Daily Brief** | Auto-curated top-3 articles across AI, Science, and Tech (6h cache) |
| ❤️ **Like & Save** | Persist favourite and bookmarked articles across sessions via PostgreSQL |
| 📊 **Reading Stats** | Track total reads, read time, login streak, and weekly activity |
| 🔔 **Notifications** | Per-user notification system with read/unread state |
| 🌙 **Dark / Light Mode** | Persisted per-user in the database |
| 🔐 **JWT Auth** | Secure email/password authentication with bcrypt + JWT tokens |
| 🎨 **AI Provider Switch** | Per-user preference: `groq`, `gemini`, or `hybrid` |
| 💚 **NLP Engine Status** | Live NLP classifier health surfaced in the Status Dialog (`/health` endpoint) |

---

## 🏗️ Architecture

```
newslabs/
├── src/                   # React + Vite frontend (TypeScript)
│   ├── pages/             # LandingPage, DashboardPage, AuthPage, ProfilePage, FeaturesPage
│   ├── components/        # Shared UI components (Navbar, Footer, AIChat, Radix UI)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility helpers
│   └── services/          # Axios API service layer
│
├── server/                # Fastify backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── server.ts      # Entry point — Fastify app setup
│   │   ├── routes.ts      # Route registration with prefixes
│   │   ├── routes/
│   │   │   ├── auth.ts    # /api/auth  — register, login, update topics
│   │   │   ├── content.ts # /api/content — feed, analyze, trending, daily-brief
│   │   │   ├── user.ts    # /api/user  — profile, stats, likes, saves, history
│   │   │   └── ai.ts      # /api/ai    — chat, summarize (rate-limit aware)
│   │   ├── services/
│   │   │   ├── ai.ts      # AiService — Groq + Gemini with retry & fallback
│   │   │   ├── rss.ts     # RssService — rss-parser wrapper
│   │   │   └── store.ts   # In-memory article store
│   │   └── middleware/
│   │       └── auth.ts    # JWT requireAuth preHandler
│   └── prisma/
│       └── schema.prisma  # PostgreSQL schema (Supabase-compatible)
│
└── api/
    └── chat.ts            # Vercel Edge Function (Vercel AI SDK)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- A **PostgreSQL** database (e.g. [Supabase](https://supabase.com) free tier)
- A **Groq** API key — [console.groq.com](https://console.groq.com)
- *(Optional)* A **Gemini** API key — [aistudio.google.com](https://aistudio.google.com)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/newslabs.git
cd newslabs
```

---

### 2. Frontend setup

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev
```

The frontend uses Vite and proxies API calls to `http://localhost:3000` in development.

---

### 3. Backend setup

```bash
cd server

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
```

Edit `server/.env` — see [Environment Variables](#environment-variables) below.

```bash
# Apply the database schema
npx prisma db push

# (Optional) Open Prisma Studio to browse your data
npx prisma studio

# Start the dev server (http://localhost:3000)
npm run dev
```

---

## 🔧 Environment Variables

> All variables live in `server/.env`. See `server/.env.example` for a copy-paste template.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase transaction pooler recommended) |
| `JWT_SECRET` | ✅ | Secret used to sign JWT tokens — change this in production |
| `PORT` | ✅ | Backend server port (default: `3000`, Render uses `10000`) |
| `GROQ_API_KEY` | ✅ | API key from [console.groq.com](https://console.groq.com) |
| `AI_PROVIDER` | ✅ | `groq`, `gemini`, or `hybrid` |
| `GROQ_MODEL` | ❌ | Groq model (default: `llama-3.1-8b-instant`) |
| `GEMINI_API_KEY` | ❌ | Required only when `AI_PROVIDER=gemini` or `hybrid` |
| `GEMINI_MODEL` | ❌ | Gemini model (default: `gemini-2.5-flash`) |

---

## 🛠️ Available Scripts

### Frontend (`/`)
| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on `localhost:5173` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run test` | Run Vitest tests |
| `npm run lint` | Run ESLint |

### Backend (`/server`)
| Script | Description |
|---|---|
| `npm run dev` | Start Fastify with nodemon (watches for changes) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled production server |

---

## 🗄️ Database Schema

NewsLabs uses **Prisma** with **PostgreSQL**. Key models:

- **User** — email, hashed password, topics (JSON array), AI provider preference, reading stats, login streak
- **Feed** — RSS feed URLs tracked in the database
- **SavedArticle** — denormalized saved article data per user
- **LikedArticle** — denormalized liked article data per user
- **ReadHistory** — tracks which articles a user has read + time spent
- **Notification** — per-user notifications with read/unread state
- **Trend** — caches computed trending topics

Run migrations:
```bash
cd server
npx prisma migrate dev   # development
npx prisma db push       # push schema to existing DB without migration files
```

---

## 🤖 AI Providers

NewsLabs supports three AI modes, configurable per-user in the Profile settings:

| Mode | Behaviour |
|---|---|
| `groq` | Uses Groq exclusively (fast, `llama-3.1-8b-instant` by default) |
| `gemini` | Uses Google Gemini exclusively (`gemini-2.5-flash`) |
| `hybrid` | Tries Groq first; falls back to Gemini automatically on rate-limit or timeout |

> **Note:** AI article analysis (per-click summarization) is always active. The standalone `/api/ai/chat` and `/api/ai/summarize` endpoints are temporarily disabled by default to conserve API rate limits.

---

## 🌐 Deployment

### Frontend — Vercel

The frontend is configured for Vercel (`vercel.json` in root).  
Just connect the repo on [vercel.com](https://vercel.com) and set any required environment variables.

### Backend — Render

The backend ships with a `server/render.yaml` config:

```yaml
services:
  - type: web
    name: newslabs-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
      - key: PORT
        value: 10000
```

Push to GitHub, connect Render, and add all env vars from the table above.

---

## 📁 Topic Categories

Articles are auto-categorized into one of **19 topics** using the 4-layer hybrid NLP engine:

`AI & ML` · `Web Dev` · `Science` · `Startups` · `Crypto` · `Design` · `DevOps` · `Security` · `Politics` · `Business` · `Health` · `Sports` · `Entertainment` · `Climate` · `Space` · `India` · `World` · `General`

> **How categorization works:**
> 1. **Layer 0 — Source Feed Bias** — Known feeds (ScienceDaily, ESPN, TechCrunch, NDTV…) pre-weight toward their domain.
> 2. **Layer 1 — Keyword Scoring** — Title and content snippet are scored against 100+ keywords per category.
> 3. **Layer 2 — NLP Classifier** — Naive Bayes fallback, only fires above a 25% confidence threshold (40% for prone-to-misfire categories like Crypto/DevOps).
> 4. **Layer 3/4 — World / General** — Remaining articles bucket into geopolitical `World` or a safe `General` catch-all. Zero articles left uncategorized.

---

## 🔮 Known Limitations & Future Improvements

- **Trending Now** currently uses word frequency (not NLP). Future: integrate real topic-tagging.
- **AI Chat** is temporarily disabled to prevent API rate-limit exhaustion.
- Clicking a **trending topic** does not yet filter articles — this is a planned feature.
- The Naive Bayes NLP model is retrained on every server cold-start; persistent model serialization is a planned optimization.

See [`future_improvements.txt`](./future_improvements.txt) for more details.

---

## 📄 License

MIT © NewsLabs Contributors
