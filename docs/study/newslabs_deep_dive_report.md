# NewsLabs: Comprehensive Technical & Operational Deep Dive

This document serves as the master reference guide for NewsLabs. It details the entire architecture, code paths, processing pipelines, and business logic of the platform, designed to prepare you for presentations and deep cross-questioning.

---

## 1. Executive Summary
NewsLabs is an AI-powered, personalized news aggregation platform. It doesn't just pull RSS feeds; it intelligently parses, categorizes, scores, and summarizes news using a custom-built Hybrid NLP engine and large language models (LLMs) from Groq and Google Gemini. It tracks user behavior, curates personalized feeds, and delivers daily digests via automated bots (Telegram/Discord).

## 2. Platform Architecture
NewsLabs operates on a decoupled client-server architecture:
- **Frontend**: React + Vite (TypeScript), utilizing TailwindCSS and Radix UI for a modern "Newsprint" aesthetic.
- **Backend**: Fastify (Node.js + TypeScript), providing high-throughput REST APIs.
- **Database**: PostgreSQL managed via Prisma ORM.
- **AI Infrastructure**:
  - **Local NLP**: Custom TF-IDF + Logistic Regression model running entirely in Node.js.
  - **Generative AI**: Groq (Llama 3.1) and Google Gemini (2.5 Flash), plus a Bring-Your-Own-Key (BYOK) system supporting any OpenAI-compatible endpoint.

---

## 3. The Data Pipeline (How News Moves)

### A. Ingestion (RSS Service)
NewsLabs fetches data from numerous curated RSS feeds. Instead of waiting for all feeds to resolve (which causes UI blocking and socket exhaustion), it uses a **Progressive Feed Loading** strategy. Feeds are fetched in chunks of 4. As soon as a feed chunk resolves, it is pushed to the UI, providing a real-time, stream-like experience.

### B. In-Memory Store & Database Persistence
To ensure blazing fast performance, ingested articles are kept in a backend in-memory `store`. When users "like", "save", or "read" an article, this action is persisted to PostgreSQL (via `SavedArticle`, `LikedArticle`, `ReadHistory` tables) while cross-referencing the in-memory cache.

---

## 4. The "Brain": AI & NLP Architecture

NewsLabs features a highly sophisticated dual-brain system: a deterministic/statistical NLP layer for categorization, and a generative LLM layer for summarization.

### The 4-Layer Hybrid NLP Engine (`server/src/services/nlp.ts`)
This engine operates at near-zero latency because it runs locally in Node.js without calling external APIs.

1. **Layer 0 - Source Feed Bias**: Automatically weights articles based on known source reliability and domain (e.g., ESPN = Sports, TechCrunch = Technology).
2. **Layer 1 - Keyword Scoring**: A fallback mechanism checking the title and content against a curated map of 100+ keywords per category.
3. **Layer 2 - NLP Classifier (TF-IDF + Logistic Regression)**: The core engine. It tokenizes text, calculates Term Frequency-Inverse Document Frequency (TF-IDF), applies sublinear scaling, and runs mathematical Logistic Regression prediction using weights loaded from `nlp_model.json`. It only accepts the result if the confidence score exceeds a strict threshold (typically 0.25).
4. **Layer 3 - Catch-all & India-Overrides**: To handle geopolitical nuances, NewsLabs has custom heuristics for Indian politics and geography. If the model misclassifies an Indian political event due to Western-focused training data, the `applyIndiaOverride` function catches entities like "BJP", "Modi", or "Sensex" and re-routes the article to `World Affairs` or `Business & Finance`. If all fails, articles fall back to a `General` bucket.

### Metadata Extraction
Alongside categorization, the NLP service extracts:
- **Sentiment (Hybrid)**: Primarily uses a **DistilBERT Transformer** (sst-2) for tone detection, with a VADER-style fallback for negation handling. Determines if an article is Positive, Neutral, or Negative.
- **Opinion vs. Fact**: Detects opinionated phrasing ("we must", "outrageous") versus factual reporting (numbers, quotes, specific days).
- **Reliability Scoring**: A 1-100 score evaluating title clickbait ("you won't believe"), source trust, capitalization (sensationalism), and presence of hard data/quotes.

### Generative AI Summarization (`server/src/services/ai.ts`)
When a user clicks an article, generative AI takes over.
- **Providers**: Defaults to a `hybrid` mode (attempts Groq for 10x speed, falls back to Gemini if rate-limited).
- **Tiered Summaries**: Prompts are dynamically generated based on user preference: `concise`, `balanced`, or `detailed`. The LLM is strictly instructed to return a JSON object containing a `summary`, `insights` array, a `why` (significance), and a forced `topic` categorization.
- **Bring Your Own Key (BYOK)**: Advanced users can input their own API keys. The keys are encrypted at rest (AES-256) and decrypted only during inference.

---

## 5. Automated Delivery & Scheduling (`server/src/services/scheduler.service.ts`)

NewsLabs pushes news to users proactively using a custom Cron-driven dispatcher.

### Scheduling Logic
- **Time Zones**: Operates strictly on IST (Indian Standard Time) mapped to UTC cron schedules (e.g., Morning Brief at 06:00 IST = 00:30 UTC).
- **Article Selection Algorithm**: Before sending a brief, the system queries the in-memory store for articles from the last 24-72 hours. It ranks them using a composite score:
  `Score = (Reliability * 0.5) + (Topic Match * 0.4) + (Recency * 0.1)`
- **Deduplication**: Ensures no more than 2 articles from the same source (e.g., BBC) are included in a 10-article digest to maintain variety.
- **Dispatch**: Uses Telegram and Discord Webhooks to format and send the curated list directly to the user's phone.

---

## 6. User Tracking & Database Schema (`server/prisma/schema.prisma`)

The PostgreSQL database acts as the source of truth for user state:
- **`User` Model**: Stores auth data, AI preferences (`aiProvider`, `summaryMode`), and gamified reading stats (`totalReads`, `totalReadTime`, `currentStreak`, `longestStreak`).
- **`UserFeed`**: Tracks custom RSS URLs added by the user.
- **`UserNotificationSettings`**: Stores Telegram/Discord connection tokens and the user's preferred active time slots (`morning`, `noon`, `evening`, `night`).
- **`NotificationLog`**: Keeps a historical, denormalized record of exactly what articles were sent to the user and why they were selected, providing total transparency into the AI's selection process.

---

## 7. Potential Cross-Examination Questions & Answers

**Q: Why use an in-memory store for articles instead of saving all RSS feeds to the database?**
A: Storing tens of thousands of raw RSS articles in PostgreSQL daily would bloat the database and cost money. By keeping raw articles in-memory and only persisting what users actually interact with (Likes, Saves, Reads, Notification Logs), we save massive amounts of DB storage and keep queries lightning fast.

**Q: How does the progressive feed loading actually work?**
A: Instead of `Promise.all` waiting for 50 RSS URLs to resolve, the frontend initiates a fetch. The backend processes 4 URLs at a time. The frontend polls or receives chunks, immediately rendering articles from the completed feeds. This prevents the "blank screen" loading state.

**Q: How is the BYOK (Bring Your Own Key) security handled?**
A: Keys are never stored in plain text. When a user submits an API key, the `crypto.ts` service encrypts it using a strong algorithm (AES-256) with a server-side secret before storing it in PostgreSQL. It is only decrypted in memory for the fraction of a second needed to make the external AI request.

**Q: What happens if Groq and Gemini both go down?**
A: The system degrades gracefully. The UI will still show the original article links, titles, and metadata generated by our local NLP engine. The only missing piece will be the deep, multi-paragraph AI summary.

**Q: How does the Logistic Regression NLP work in plain TypeScript?**
A: During development, a Python script (`train_nlp.py`) trains a model on a dataset of articles. It exports the calculated math weights (vocabulary indices, IDF scores, coefficients, intercepts) to a JSON file. Our TypeScript service simply loads this JSON and performs the same matrix multiplications as Python would, achieving ML inference without needing a heavy Python backend.
