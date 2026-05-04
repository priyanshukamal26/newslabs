# NewsLabs: Developer Architecture & Core Systems

Welcome to the NewsLabs codebase. This document provides a high-level overview of the system architecture, code organization, and core logic components designed specifically for developers jumping into the project.

*(Note: For local setup and execution instructions, please refer to the main `README.md` and `PROJECT_WORKFLOW.md`)*

---

## 1. High-Level Architecture

NewsLabs is divided into three primary tiers:
1. **Frontend**: A React application powered by Vite, structured using modern functional components and hooks.
2. **Backend**: A Node.js backend using the Fastify web framework for high performance, typed strictly with TypeScript.
3. **Database**: PostgreSQL database schema managed through Prisma ORM.

### Flow of Data
1. The **Backend** (`rss.ts` service) runs recurring jobs to fetch external XML RSS feeds.
2. The incoming raw text is passed through the **NLP Engine** (`nlp.ts`) which assigns a primary category (e.g., *Technology*, *Business*), calculates a sentiment score (Positive/Neutral/Negative), and applies a reliability heuristic.
3. This enriched data is cached in an **In-Memory Store** (`store.ts`) for extremely fast read access.
4. The **Frontend** queries the Fastify API. Instead of waiting for all data at once, the frontend receives progressive updates, rendering cards on the dashboard seamlessly.
5. When a user interacts with a card (e.g., clicking for an AI summary), the Fastify API calls external LLM providers (Groq/Gemini via `ai.ts`), generates the summary, and returns it to the client.

---

## 2. Core Backend Services (`server/src/services/`)

The business logic of NewsLabs lives entirely in the Fastify backend's `services` directory.

### `nlp.ts` (Hybrid NLP Engine)
Instead of relying on external APIs for basic categorization, NewsLabs runs its own ML inference locally.
- **How it works**: It uses a pre-trained TF-IDF (Term Frequency-Inverse Document Frequency) and Logistic Regression model exported from Python into a `nlp_model.json` file.
- **Inference**: The TypeScript code tokenizes titles/content, performs matrix multiplication against the loaded weights, and outputs a confidence score for categories.
- **Overrides**: It includes fallback keyword mappings and specialized overrides (e.g., `applyIndiaOverride`) to ensure geographic and political nuances aren't miscategorized by Western-focused training datasets.

### `ai.ts` (Generative Summarization)
This module acts as a wrapper around the `groq-sdk` and `@google/generative-ai` libraries.
- **Prompt Generation**: It dynamically generates prompts based on the user's selected `summaryMode` (`concise`, `balanced`, or `detailed`).
- **Hybrid Fallback**: The default `hybrid` mode attempts to fetch summaries from Groq (Llama 3.1) for speed. If Groq rate-limits or times out, it gracefully falls back to Google Gemini (2.5 Flash).
- **BYOK (Bring Your Own Key)**: It supports custom endpoints allowing users to inject standard OpenAI-compatible REST API calls.

### `scheduler.service.ts` (Cron Dispatcher)
Handles the automated delivery of daily "Briefs" to users via Telegram and Discord.
- It uses `node-cron` scheduled against UTC times mapping to Indian Standard Time (IST) slots (Morning, Noon, Evening, Night).
- **Selection Logic**: It queries the in-memory store for 24-hour recent articles, ranks them by a combination of reliability (50%), topic matching user preferences (40%), and recency (10%), deduplicates by source, and dispatches the payload via Webhooks.

---

## 3. Database Schema Overview (`server/prisma/schema.prisma`)

We use Prisma for type-safe database access. Key models include:

- **`User`**: Core authentication and preference tracking. Also maintains "gamification" stats like `currentStreak` and `totalReads`.
- **`UserFeed`**: Many-to-one relationship mapping users to their custom RSS URLs.
- **`UserApiCredential` & `UserAiPreference`**: Secures encrypted BYOK API keys and timeouts.
- **`SavedArticle`, `LikedArticle`, `ReadHistory`**: Denormalized storage for user interactions. Note that we store raw article data (title, link, etc.) directly in these rows because the main article pool is kept in-memory and constantly rotates.
- **`UserNotificationSettings` & `NotificationLog`**: Controls Telegram/Discord connections and logs exact automated payload dispatch reasons for transparency.

---

## 4. Frontend Highlights (`src/`)

- **Progressive Loading**: Look at `src/pages/DashboardPage.tsx` and the `api.ts` service. Feed fetching is done in background chunks to prevent the UI from blocking.
- **State Management**: We rely on standard React Context/Hooks for local state and lightweight caching mechanisms.
- **Styling**: TailwindCSS is used exclusively. The Light/Dark mode implementation is built on CSS variables (`index.css`) that are flipped based on the `darkMode` boolean returned from the user's database profile.

## 5. Adding New Features

If you are tasked with adding a new feature:
1. **Database**: Update `schema.prisma` and run `npx prisma db push`.
2. **Backend Route**: Add your REST endpoint in `server/src/routes/`.
3. **Backend Logic**: Keep routes thin. Put the heavy lifting in a new or existing file inside `server/src/services/`.
4. **Frontend Integration**: Export the Axios call from `src/lib/api.ts` and consume it in your React component.
