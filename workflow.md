# NewsLabs: Content & AI Lifecycle Workflow

This document outlines the step-by-step technical workflow of an article from the moment it is fetched to the moment it is delivered to the user as an AI-enriched insight.

---

## 1. Data Ingestion (RSS Fetching)
- **Service**: `RssService` (`server/src/services/rss.ts`)
- **Action**: The system fetches raw XML from 30+ system feeds or custom user feeds.
- **Optimization**: Uses `AbortController` with an 8s timeout and fetches in **chunks of 4** to prevent DNS/socket exhaustion on the server.

## 2. Progressive Store Injection
- **Service**: `Store` (`server/src/services/store.ts`)
- **Action**: Articles are deduplicated by URL. Unique articles are injected into the in-memory `Store`.
- **Enrichment**: The moment an article is added, it is passed through the `nlpService` for **Synchronous Enrichment**.

## 3. Synchronous NLP Enrichment (The "Instant" Layer)
- **Service**: `NlpService` (`server/src/services/nlp.ts`)
- **Tasks**:
    - **Classification**: Assigns a primary category (Tech, India, World, etc.) using TF-IDF + Logistic Regression.
    - **Sentiment**: Analyzes tone (-1 to +1).
    - **Reliability**: Scores 0-100 based on source trust and sensationalism.
    - **Opinion Detection**: Flags if it's a report or an op-ed.
- **Result**: The article is now "UI-ready" with tags and scores in under 50ms.

## 4. On-Demand Generative Analysis (The "Deep" Layer)
- **Endpoint**: `/api/analyze` (`server/src/routes/content.ts`)
- **Trigger**: When a user clicks an article in the frontend.
- **Service**: `AiService` (`server/src/services/ai.ts`)
- **Logic**:
    1. **Check Cache**: If a summary already exists for the requested mode, return it.
    2. **BYOK Check**: Check if the user has provided their own Groq/Gemini key.
    3. **Summarization**: Send the article content to the LLM with a JSON-strict prompt.
    4. **Extraction**: Extract `summary`, `insights`, and `why` from the JSON response.
    5. **Update Store**: Save the analysis back to the article object in memory.

## 5. Analytics & Trending Discovery
- **Endpoint**: `/api/trending`
- **Action**: Every 2 seconds (on frontend poll) or when requested, the `aiService` scans the titles of the last 50 articles.
- **Mechanism**: Frequency analysis of word clusters to identify "Hot Topics" (e.g., "OpenAI Sora" or "India Elections").

## 6. Delivery (Notifications & Briefs)
- **Service**: `SchedulerService` (`server/src/services/scheduler.service.ts`)
- **Cycle**: 4 times a day (IST: 6AM, 2PM, 6PM, 10PM).
- **Selection**: 
    - Filters articles from the last 24 hours.
    - Scores them based on: **Reliability (50%) + Topic Match (40%) + Recency (10%)**.
- **Dispatch**: Formats and sends a "Daily Brief" via Telegram or Discord.

---

## 7. Configuration & Secrets
- **Environment**: `.env` handles system-wide keys for Groq/Gemini.
- **Database**: Prisma handles user-specific feed lists and their encrypted BYOK credentials.
