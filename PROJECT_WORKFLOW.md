# NewsLabs Project Workflow & Development Plan

This document provides detailed instructions for starting the project, configuring the environment, and understanding the core architectural components.

## 🚀 Starting the Development Environment

To fully run NewsLabs locally, you need three main components running in parallel:

### 1. Backend (Fastify Server)
The backend handles RSS aggregation, AI processing, and database interactions.
- **Directory**: `/server`
- **Port**: `3000` (Default)
- **Command**:
  ```bash
  cd server
  npm install
  npm run dev
  ```
- **Health Check**: `http://localhost:3000/health`

### 2. Frontend (Vite + React)
The dashboard and landing pages.
- **Directory**: Root (`/`)
- **Port**: `8080` (Configured in `vite.config.ts` or default)
- **Command**:
  ```bash
  npm install
  npm run dev
  ```
- **Access**: `http://localhost:8080`

### 3. ngrok (External Tunnel)
Required for testing webhooks (like Telegram) and mobile previews.
- **Command**:
  ```bash
  npx ngrok http 3000
  ```
- **Note**: After starting, copy the `Forwarding` URL (e.g., `https://xxxx.ngrok-free.app`) and update your Telegram webhook if necessary.

---

## 🔧 Environment Configuration

All backend secrets live in `server/.env`. Ensure the following are set:

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase / PostgreSQL | Main database connection |
| `GROQ_API_KEY` | console.groq.com | Fast AI summaries & classification |
| `GEMINI_API_KEY` | aistudio.google.com | Fallback AI provider |
| `TELEGRAM_BOT_TOKEN` | BotFather | For sending news briefs to Telegram |
| `JWT_SECRET` | Manual | Signing user session tokens |

---

## 🗄️ Database & Prisma

NewsLabs uses Prisma as the ORM.

- **Schema File**: `server/prisma/schema.prisma`
- **Apply Changes**: `npx prisma db push` (fastest for development)
- **Migrations**: `npx prisma migrate dev --name <name>` (for production tracking)
- **Studio (GUI)**: `npx prisma studio` (runs on `localhost:5555`)

### Key Models
- **User**: Authentication and preferences.
- **UserFeed**: Custom RSS feeds per user.
- **Notification**: Alerts and morning briefs.
- **ReadHistory**: Tracking user engagement.

---

## 🤖 AI & NLP Pipeline

NewsLabs features a 4-layer hybrid NLP engine for article categorization and analysis:

1. **Layer 0: Source Bias**: Initial weighting based on the RSS feed's primary domain (e.g., ESPN -> Sports).
2. **Layer 1: Keyword Scoring**: Matches title and content against a library of 100+ keywords per category.
3. **Layer 2: NLP Classifier**: A Naive Bayes classifier trained on `datasets/news_data.json`. It only fires if confidence exceeds a threshold (0.25 for general, 0.40 for "soft" categories like Crypto/DevOps).
4. **Layer 3: Catch-all**: Remaining articles are bucketed into `World` or `General`.

### Analysis Features
- **Sentiment Analysis**: Detects tone (Positive/Neutral/Negative) and provides intensity signals.
- **Reliability Scoring**: Heuristic scoring based on source reputation, title sensationalism, and content depth.
- **Opinion vs. Fact**: Detects if an article is a News Report or an Opinion Piece.

---

## ⚡ Progressive Feed Loading

To ensure a fast user experience, NewsLabs uses a progressive loading strategy:
- Feeds are fetched in **chunks of 4** to prevent socket exhaustion.
- The `/feed` endpoint triggers a fire-and-forget update in the background.
- Articles appear in the UI as soon as their respective feed resolves, rather than waiting for all feeds to finish.

---

## 🔑 Bring Your Own Key (BYOK)

Advanced users can use their own AI credentials (OpenAI, Groq, Anthropic, or custom providers):
- **Encrypted Storage**: API keys are encrypted at rest using AES-256.
- **Customizable Timeouts**: Users can disable or set custom timeouts for AI analysis.
- **Fallback Logic**: If a user's BYOK fails, the system automatically falls back to the system's hybrid AI provider.

---

## 📢 Telegram Bot Integration

To test the automated news delivery:
1. Start ngrok on port 3000.
2. Update the webhook:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<NGROK_URL>/api/notifications/telegram/webhook`
3. Users link their account in the Dashboard using `/start <UUID>`.

---

## 🛠️ Common Troubleshooting

- **Port Conflicts**: If port 3000 is busy, check `server/.env` and change `PORT`. Update Vite's proxy if changed.
- **NLP Readiness**: If the health check shows `nlpClassifier: false`, the server is still training the model on startup. Wait 2-5 seconds.
- **Database Connection**: Ensure the Supabase instance is active. If using the transaction pooler (port 6543), append `?pgbouncer=true` to the connection string.

---

## 📁 Key File Locations

- **Backend Entry**: `server/src/server.ts`
- **NLP Engine**: `server/src/services/nlp.service.ts`
- **Route Definitions**: `server/src/routes/`
- **AI Logic**: `server/src/services/ai.service.ts`
- **Dashboard UI**: `src/pages/DashboardPage.tsx`
- **API Service**: `src/services/api.ts`
- **Database Schema**: `server/prisma/schema.prisma`
