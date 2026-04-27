# 📰 NewsLabs

### **Elevate Your Intelligence with AI-Powered News Orchestration**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)](https://github.com/priyanshukamal26/newslabs)
[![License](https://img.shields.io/badge/license-ISC-green.svg?style=for-the-badge)](LICENSE)
[![Built With](https://img.shields.io/badge/Built%20With-React%20%26%20Fastify-orange.svg?style=for-the-badge)](https://react.dev/)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%20%7C%20Groq%20%7C%20Ollama-purple.svg?style=for-the-badge)](https://ai.google.dev/)

---

## 🌟 Overview

**NewsLabs** is a sophisticated, AI-driven news intelligence platform designed to transform how you consume information. In an era of information overload, NewsLabs acts as your personal digital curator, aggregating news from diverse RSS sources and using state-of-the-art Large Language Models (LLMs) to synthesize, summarize, and deliver insights that matter to you.

Whether you're a tech enthusiast, a financial analyst, or a casual reader, NewsLabs provides a centralized hub for high-signal content, free from the noise of traditional social media feeds.

---

## 📸 Visual Overview

### **Platform Dashboard**
![Platform Dashboard](public/screenshots/feed_page.png)
*The NewsLabs Dashboard: A Brutalist Newsprint aesthetic optimized for reading and insight extraction.*

### **System Architecture**
![System Architecture](public/screenshots/architecture_diagram.png)
*Full-stack architecture from ingestion to automated delivery.*

### **Feature Intelligence**
![Feature Breakdown](public/screenshots/feature_breakdown.png)
*Detailed breakdown of the AI/NLP enrichment and automation pipeline.*

### **Analytics & Reading Insights**
![Analytics & Reading Insights](public/screenshots/analytics_page.png)
*Gamified reading stats, streaks, and personal progress milestones.*

---

## 🚀 Key Features

- 🧠 **Multi-Model AI Intelligence**: Seamlessly switch between **Google Gemini**, **Groq (Llama 3/Mixtral)**, and local **Ollama** models for summarization and analysis.
- 🔑 **Bring Your Own Key (BYOK)**: Full control over your AI costs and privacy by using your own API credentials with AES-256 encryption.
- 📥 **Intelligent RSS Aggregation**: Add and manage custom feeds with automated parsing, deduplication, and chunked fetching.
- 📬 **Omni-Channel Briefings**: Personalized news summaries delivered directly to **Telegram** or **Discord** on your preferred schedule.
- 📊 **Gamified Analytics**: Track your reading habits with daily streaks, read-time statistics, and categorical heatmaps.
- ⚡ **Real-time Trending**: Identify what's hot across your specialized feeds using NLP-based N-gram frequency analysis.
- 🌙 **Premium UI/UX**: A stunning, responsive interface with Dark Mode support, smooth animations (Framer Motion), and a dashboard optimized for productivity.

---

## 🏗 Technical Architecture

NewsLabs follows a modern, decoupled architecture designed for high performance and scalability.

1.  **Client Layer**: A highly interactive React 18 SPA (Vite) that communicates via a RESTful API, leveraging Framer Motion for premium UI/UX.
2.  **API Layer**: A high-performance Fastify server handling authentication, user management, and intelligent AI routing.
3.  **Worker Layer**: Background cron jobs managed by `node-cron` that handle RSS ingestion, automated briefings, and data maintenance.
4.  **AI Service Layer**: A provider-agnostic abstraction that routes requests to various LLM providers (Gemini, Groq, Ollama).
5.  **Data Layer**: PostgreSQL database managed via Prisma ORM for structured persistence of users, feeds, and reading history.

---

## 🤖 AI & NLP Architecture Deep-Dive

### **The Hybrid Intelligence Philosophy**
NewsLabs uses a **Layered Hybrid Pipeline** to balance speed, cost, and depth:
- **Statistical NLP (Layers 0-2)**: Instant categorization and metadata extraction (under 50ms).
- **Generative AI (Layer 3)**: Reserved for high-fidelity summarization and significance analysis ("Why This Matters").

### **The 4-Layer Categorization Engine**
When an article enters the system, it passes through these layers in **under 50ms**:
1.  **Layer 0: Source Metadata (Fast Track)**: Initial weighting based on source bias (e.g., *TechCrunch* → *Technology*).
2.  **Layer 1: Keyword Heuristics**: Weighted keyword matching against 100+ keywords per category.
3.  **Layer 2: Statistical Classifier (The "Brain")**: TF-IDF + Logistic Regression trained on 300+ labeled examples across 10+ categories.
4.  **Layer 3: Catch-all Fallback**: Geopolitical cues route to *World*, while others land in *General*.

### **Specialized NLP Analysts**
- **Sentiment Engine**: VADER-style lexicon analysis with negation handling (e.g., "not good" flipping to negative).
- **Reliability Scoring**: Heuristic scoring (0-100) based on source reputation, sensationalism detection, and content depth.
- **Opinion vs. Fact**: Detection of editorial language patterns vs. factual reporting signals.

---

## ⚡ Project Lifecycle & Workflow

### **1. Data Ingestion & Enrichment**
Feeds are fetched in **chunks of 4** to prevent socket exhaustion. Upon ingestion, articles are instantly enriched with sentiment, category, and reliability scores before hitting the UI.

### **2. On-Demand Deep Analysis**
When a user opens an article:
1.  **Cache Check**: Returns existing summary if available for the requested mode.
2.  **Provider Routing**: Uses preferred BYOK key or the system's hybrid fallback logic.
3.  **Summarization**: Generates a structured summary, key insights, and "Why This Matters" explanation.

### **3. Automated Delivery Lifecycle**
The `SchedulerService` runs 4 times daily (IST: 6AM, 2PM, 6PM, 10PM):
- **Filtering**: Selects high-reliability articles from the last 24 hours.
- **Ranking**: Weighted formula: **Reliability (50%) + Topic Match (40%) + Recency (10%)**.
- **Formatting**: Dispatches cleaned HTML to Telegram or rich embeds to Discord.

---

## 🛠 Tech Stack

### **Frontend**
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Animations**: Framer Motion
- **State Management**: TanStack Query (React Query)
- **Data Visualization**: Recharts

### **Backend**
- **Runtime**: Node.js
- **Framework**: Fastify (High performance)
- **Database**: PostgreSQL (via Prisma ORM)
- **AI Orchestration**: Google Generative AI, Groq SDK, Ollama
- **NLP**: Natural (Sentiment & Trend Analysis)
- **Scheduling**: Node-cron

---

## 📁 Folder Structure

```text
newslabs/
├── server/             # Backend Fastify Server
│   ├── prisma/         # Database schema and migrations
│   ├── src/
│   │   ├── routes/     # API Endpoints (Auth, AI, Content, User)
│   │   ├── services/   # Business logic (RSS, NLP, AI, Notifier)
│   │   ├── middleware/ # Auth & validation guards
│   │   └── server.ts   # Entry point
├── src/                # Frontend React Application
│   ├── components/     # UI Components (Navbar, AIChat, StatusBar)
│   ├── pages/          # View components (Dashboard, Profile, Auth)
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API interaction layer
│   └── lib/            # Utility functions (Tailwind merge, etc.)
├── public/             # Static assets
└── package.json        # Project manifest
```

---

## ⚙️ Installation & Setup

### **Prerequisites**
- Node.js (v18+)
- PostgreSQL (Local or Managed like Supabase)
- (Optional) Ollama installed locally for local AI

### **1. Clone the Repository**
```bash
git clone https://github.com/priyanshukamal26/newslabs.git
cd newslabs
```

### **2. Install Dependencies**
```bash
# Install root (frontend) dependencies
npm install

# Install server dependencies
cd server
npm install
```

### **3. Environment Setup**
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/newslabs"
JWT_SECRET="your_super_secret_key"
GEMINI_API_KEY="optional_global_key"
GROQ_API_KEY="optional_global_key"
TELEGRAM_BOT_TOKEN="your_bot_token"
```

### **4. Database Initialization**
```bash
cd server
npx prisma generate
npx prisma db push
```

---

## 🚀 Usage

### **Development Mode**
Start both the frontend and backend servers in separate terminals:

**Terminal 1 (Root):**
```bash
npm run dev
```

**Terminal 2 (Server):**
```bash
cd server
npm run dev
```

Visit `http://localhost:5173` to access the application.

---

## 📋 API Documentation

### **Auth**
- `POST /api/auth/register` - Create a new account
- `POST /api/auth/login` - Authenticate and get JWT token

### **Content**
- `GET /api/content/news` - Fetch aggregated news feed
- `POST /api/content/feeds` - Add a new RSS source
- `GET /api/content/trends` - Get top trending topics via N-gram analysis

### **AI**
- `POST /api/ai/summarize` - Generate AI summary/insights for an article
- `POST /api/ai/analyze` - Trigger deep analysis for a specific text block

---

## 🔑 Environment Variables

To run this project, add the following variables to your `server/.env`:

| Variable | Description | Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `GEMINI_API_KEY` | Google Gemini API Key | No |
| `GROQ_API_KEY` | Groq Cloud API Key | No |
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather | No |
| `DIRECT_URL` | Direct database connection string (for Prisma) | No |

---

## 🧪 Testing

NewsLabs uses **Vitest** for unit and integration testing.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 🚢 Deployment

### **Frontend**
The frontend is optimized for **Vercel** or **Netlify**. Set the build command to `npm run build` and output directory to `dist`.

### **Backend**
The backend can be deployed to **Render**, **Railway**, or a VPS. Run `npm run build` followed by `npm start`.

---

## ⚡ Performance & Optimization

- **High-Concurrency API**: Built on **Fastify** for low overhead and high throughput.
- **Progressive Feed Loading**: Feeds are fetched in chunks to prevent socket exhaustion; articles appear as they resolve.
- **Intelligent Caching**: Summaries and trends are cached server-side to minimize redundant LLM calls.
- **Optimized UI**: Leveraging **React Query** for background synchronization and efficient data caching.

---

## 🛠 Scripts

- `npm run dev`: Starts the Vite dev server.
- `npm run build`: Compiles the production-ready frontend.
- `npm run lint`: Runs ESLint for code quality.
- `npm run test`: Executes unit tests via Vitest.

---

## 🔐 Security Considerations

- **Encrypted Keys**: User-provided API keys (BYOK) are encrypted at rest using AES-256.
- **JWT Authentication**: Secure stateless authentication for all protected routes.
- **Environment Isolation**: Sensitive configuration is strictly managed via environment variables.

---

## 🗺 Roadmap

- [ ] **Mobile App**: Dedicated iOS/Android client using React Native.
- [ ] **Audio Briefings**: Text-to-Speech integration for hands-free consumption.
- [ ] **Advanced Filtering**: Regex-based keyword blocking and prioritization.

---

## 🤝 Contributing

Contributions are greatly appreciated. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📜 License

Distributed under the **ISC License**. See `LICENSE` for more information.

---

## ❤️ Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) for the stunning components.
- [Lucide](https://lucide.dev/) for the beautiful icons.
- [Vercel](https://vercel.com) for hosting inspiration.

---

## 👨‍💻 Author

**Priyanshu Kamal**
- GitHub: [@priyanshukamal26](https://github.com/priyanshukamal26)
- Twitter: [@priyanshu_kamal](https://twitter.com/priyanshu_kamal)

---
*Last Updated: April 2026 — NewsLabs v2.0.0*
