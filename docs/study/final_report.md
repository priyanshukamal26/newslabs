# NEWSLABS — AI-Powered News Intelligence Platform

**Project Report | Subject Code: INT428 (Project-Based Assessment)**
**Student Name:** Priyanshu Kamal
**Roll Number:** ___________________________
**Branch and Semester:** ___________________________
**Guide / Faculty:** ___________________________
**Department:** Computer Science and Engineering
**Academic Year:** 2025 – 2026
**GitHub:** [https://github.com/priyanshukamal26/newslabs](https://github.com/priyanshukamal26/newslabs)
**Version:** v3.3.0 (May 2026)

---

## 1. Abstract

In the modern information era, the challenge has shifted from a scarcity of news to an overwhelming surplus, often riddled with sensationalism and low-signal content. **NewsLabs** is a high-performance news intelligence platform designed to bridge this gap. By combining traditional RSS aggregation with a multi-layered NLP (Natural Language Processing) engine and hybrid AI summarization, NewsLabs transforms raw information into actionable intelligence. The platform features a **Brutalist Newsprint** aesthetic, 72-hour rolling data retention, and a "Bring Your Own Key" (BYOK) privacy model, providing users with a curated, distraction-free reading experience that prioritizes reliability and depth.

## 2. Introduction

NewsLabs was built to address "Information Fatigue Syndrome." Most news aggregators rely on proprietary algorithms that prioritize engagement (clicks) over information quality. NewsLabs flips this incentive by putting the user in control of their sources while using AI to assist—not dictate—the reading process.

### 2.1 Core Objectives
- **Semantic Curation:** Move beyond keyword matching to true thematic understanding.
- **Privacy-First Intelligence:** Allow users to use their own AI provider keys to ensure data sovereignty.
- **Reliability Assessment:** Automatically score articles based on source trust and linguistic patterns.
- **Zero-Distraction UI:** A design language inspired by editorial print media to encourage deep reading.

---

## 3. Technical Architecture

NewsLabs utilizes a modern, type-safe stack designed for low latency and high scalability.

- **Frontend:** React 18 with Vite and TypeScript. Styling is handled via Vanilla CSS and Framer Motion for high-fidelity "Brutalist" animations.
- **Backend:** Fastify (Node.js) framework, providing a high-throughput REST API.
- **Database:** PostgreSQL managed via Prisma ORM for structured data persistence (Users, Feeds, Interactions, Logs).
- **In-Memory Store:** A synchronized volatile store for high-frequency article ingestion and real-time dashboard updates.
- **Deployment:** Optimized for Vercel (Frontend) and Render/Railway (Backend).

---

## 4. The NLP Pipeline: A 4-Layer Engine

The heart of NewsLabs is its categorization engine, which ensures zero "Uncategorized" articles through a tiered fallback system.

### 4.1 Layer 0: Source Bias
The system maintains an internal map of 20+ major news sources (e.g., TechCrunch, ESPN, The Hindu). Articles from these sources are pre-weighted toward their primary domain, providing a high-confidence starting point.

### 4.2 Layer 1: Regex Keyword Heuristics
A sophisticated regex-based engine matches phrases and acronyms (e.g., "AI", "ML", "IPL") with word-boundary awareness. This handles specific Indian contexts (States, Cities, Politicians) that general models might miss.

### 4.3 Layer 2: TF-IDF + Logistic Regression
For articles that pass the first two layers, NewsLabs uses a **Logistic Regression** model trained on a **TF-IDF** (Term Frequency-Inverse Document Frequency) vectorized corpus.
- **Dataset:** Trained on over **52,000 labeled articles** across 9 primary categories.
- **Accuracy:** The model achieves a verified **78.82% accuracy** on held-out test sets.
- **Zero-Dependency Inference:** The entire model is exported as a JSON weight matrix and executed in pure TypeScript, eliminating the need for a Python runtime or external API calls during ingestion.

### 4.4 Layer 3: Catch-all & World Fallback
The final layer identifies geopolitical cues (conflicts, international relations) to bucket articles into "World Affairs" or a safe "General" catch-all, ensuring no data is lost.

---

## 5. AI Strategy & BYOK Model

NewsLabs adopts a hybrid approach to Large Language Models (LLMs).

### 5.1 Hybrid Provider Routing
The platform defaults to **Groq (Llama 3.1 8B/70B)** for sub-second summarization and automatically falls back to **Google Gemini 1.5 Flash** in case of rate limits or API timeouts.

### 5.2 BYOK (Bring Your Own Key)
To ensure privacy and long-term sustainability, NewsLabs allows users to supply their own API keys.
- **Encryption:** Credentials are encrypted at rest using **AES-256-GCM** with a hardware-secured environment secret.
- **Validation:** Real-time key validation ensures zero-downtime when switching providers.

### 5.3 Sentiment Analysis
Sentiment is analyzed using a **DistilBERT (sst-2)** transformer model running in-process via the `@xenova/transformers` library. A lexicon-based VADER fallback ensures sentiment detection even in low-resource environments.

---

## 6. Notification & Scheduling System

The **NewsLabs Scheduler Service** manages high-precision cron tasks for automated intelligence delivery.

### 6.1 Daily Briefings
Users receive automated news briefings via Telegram or Discord at four curated time slots (IST):
- **Morning (07:30):** Wake-up intelligence.
- **Noon (12:30):** Mid-day update.
- **Evening (17:30):** Closing bell summary.
- **Night (22:30):** Daily recap.

### 6.2 The Ranking Formula
Briefings are selected using a weighted multi-factor algorithm:
- **50% Reliability:** Prioritizes verified Factual content over Opinion.
- **40% Topic Match:** Aligns with user-configured interests.
- **10% Recency:** Ensures "Breaking News" is always at the top.

---

## 7. Data Handling & Retention

NewsLabs is optimized for high-velocity data while maintaining a clean footprint.
- **72-Hour Rolling Retention:** Articles, briefings, and system logs are stored for 72 hours. An automated cleanup task runs daily to prune expired data.
- **6-Hour Brief Caching:** The public "Daily Brief" is cached for 6 hours to minimize AI costs and maximize response speed.
- **Chunked Ingestion:** RSS feeds are fetched in groups of 4 with an 8-second abort timeout to prevent socket exhaustion and handle slow sources.

---

## 8. Conclusion & Future Roadmap

NewsLabs v3.3.0 successfully demonstrates that high-quality news consumption can be achieved through open standards and local-first AI. By moving away from engagement-based algorithms toward a reliability-weighted model, we empower readers to reclaim their time.

**Future Milestones:**
- **React Native Mobile Client:** For on-the-go consumption.
- **Audio Briefings:** Text-to-speech integration for hands-free intelligence.
- **Vector Search:** Implementing semantic history via a vector database (e.g., Pinecone/Milvus) for long-term memory.

---
**Submission Date:** May 2026
**Project Link:** [GitHub Repository](https://github.com/priyanshukamal26/newslabs)
